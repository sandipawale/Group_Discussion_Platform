const https = require('https');
const Transcript = require('../models/Transcript');
const SessionInstance = require('../models/SessionInstance');

const ANALYSIS_MODELS = [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
];

function callOpenRouter(prompt) {
    return new Promise((resolve, reject) => {
        const tryModel = (idx) => {
            if (idx >= ANALYSIS_MODELS.length) return reject(new Error('All models failed'));
            const model = ANALYSIS_MODELS[idx];
            const body = JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
            });
            const req = https.request({
                hostname: 'openrouter.ai',
                path: '/api/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error) {
                            console.warn(`⚠️ Analysis model ${model} failed: ${json.error.message} — trying next`);
                            return tryModel(idx + 1);
                        }
                        console.log(`📡 Analysis used model: ${model}`);
                        resolve(json.choices[0].message.content);
                    } catch (e) { tryModel(idx + 1); }
                });
            });
            req.on('error', () => tryModel(idx + 1));
            req.setTimeout(20000, () => { req.destroy(); tryModel(idx + 1); });
            req.write(body);
            req.end();
        };
        tryModel(0);
    });
}

async function analyzeSession(sessionId) {
    try {
        const session = await SessionInstance.findById(sessionId).populate('participants', 'name email');
        if (!session) return;

        const transcripts = await Transcript.find({ roomId: sessionId })
            .populate('userId', 'name email')
            .sort({ createdAt: 1 });

        if (!transcripts.length) {
            console.log(`⚠️ No transcripts for session ${sessionId}, marking analysis complete with no data.`);
            session.analysisStatus = 'completed';
            session.overallSummary = 'No speech data was captured during this session.';
            await session.save();
            return;
        }

        // Group transcripts by user
        const byUser = {};
        for (const t of transcripts) {
            const uid = t.userId ? t.userId._id.toString() : 'unknown';
            if (!byUser[uid]) {
                byUser[uid] = { userId: uid, name: t.userId?.name || 'Unknown', messages: [] };
            }
            byUser[uid].messages.push(t.text);
        }

        const participantSummaries = Object.values(byUser);

        const prompt = `You are an expert evaluator for a student Group Discussion (GD) session at an engineering college placement drive.

Topic: "${session.topic || 'General Group Discussion'}"

Evaluate each participant based on their spoken contributions. For each participant, assess:
1. Relevance: Are they discussing the topic or going off-topic?
2. Behavior: Any misbehavior — profanity, personal attacks, interruptions, inappropriate content?
3. Performance Score (0-10): Rate their overall GD performance where:
   - 9-10: Exceptional — well-structured arguments, insightful, drives discussion
   - 7-8: Good — relevant points, decent fluency, constructive
   - 5-6: Average — some relevant points but lacks depth or clarity
   - 3-4: Below average — mostly off-topic or minimal contribution
   - 0-2: Poor — misbehaving, irrelevant, or barely participated

Participants and their spoken messages:
${participantSummaries.map(p => `--- ${p.name} ---\n${p.messages.join(' ')}`).join('\n\n')}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "participants": [
    {
      "name": "exact participant name as listed above",
      "performanceScore": 7,
      "isOffTopic": false,
      "isMisbehaving": false,
      "flags": ["specific issue if any, e.g. used profanity, went off-topic about cricket"],
      "summary": "One sentence assessment of their GD performance."
    }
  ],
  "overallSummary": "Two sentence summary of the overall session quality and group dynamics."
}`;

        const responseText = await callOpenRouter(prompt);

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in OpenRouter response');

        const analysis = JSON.parse(jsonMatch[0]);

        const participantAnalysis = analysis.participants.map((pa) => {
            const match = participantSummaries.find(p => p.name === pa.name);
            return {
                userId: match ? match.userId : null,
                name: pa.name,
                performanceScore: Math.min(10, Math.max(0, Number(pa.performanceScore) || 0)),
                isOffTopic: pa.isOffTopic || false,
                isMisbehaving: pa.isMisbehaving || false,
                flags: pa.flags || [],
                summary: pa.summary || ''
            };
        });

        session.participantAnalysis = participantAnalysis;
        session.overallSummary = analysis.overallSummary || '';
        session.analysisStatus = 'completed';
        await session.save();

        console.log(`✅ AI analysis completed for session ${sessionId}`);

        // Run security check in background (non-blocking)
        const { runSecurityCheck } = require('./aiAgent');
        const allTexts = transcripts.map(t => t.text);
        runSecurityCheck(sessionId, allTexts, session.topic).catch(err =>
            console.error('Security check error:', err.message)
        );
    } catch (err) {
        console.error(`❌ Analysis failed for session ${sessionId}:`, err.message);
        try {
            await SessionInstance.findByIdAndUpdate(sessionId, { analysisStatus: 'failed' });
        } catch (_) {}
    }
}

module.exports = { analyzeSession };
