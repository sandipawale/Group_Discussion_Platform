/**
 * AI Security Agent
 * -----------------
 * Called after session analysis completes.
 * Scans transcripts for risky words and security threats using OpenRouter.
 * Emits real-time socket events to admin dashboard.
 */

const https = require('https');
const User = require('../models/User');
const SessionInstance = require('../models/SessionInstance');
const { getIO } = require('../utils/socketManager');

const SECURITY_MODELS = [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'google/gemma-4-26b-a4b-it:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
];

function callOpenRouter(prompt) {
    return new Promise((resolve, reject) => {
        const tryModel = (idx) => {
            if (idx >= SECURITY_MODELS.length) return reject(new Error('All security models failed'));
            const model = SECURITY_MODELS[idx];
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
                        if (json.error) { return tryModel(idx + 1); }
                        resolve(json.choices[0].message.content);
                    } catch (e) { tryModel(idx + 1); }
                });
            });
            req.on('error', () => tryModel(idx + 1));
            req.setTimeout(15000, () => { req.destroy(); tryModel(idx + 1); });
            req.write(body);
            req.end();
        };
        tryModel(0);
    });
}

async function runSecurityCheck(sessionId, transcriptTexts, topic) {
    try {
        const combinedText = transcriptTexts.join('\n').trim();
        if (!combinedText || combinedText.length < 20) return;

        const prompt = `You are a security content moderator for an educational platform. Analyze the following group discussion transcript from engineering college students.

Topic: "${topic || 'Group Discussion'}"

Detect:
1. Risky words: profanity, slurs, hate speech, or clearly unprofessional language (ignore normal academic debate words)
2. Severe threats: terrorism, violence, or credible threats (NOT heated arguments or strong opinions)

Transcript:
"""
${combinedText.slice(0, 3000)}
"""

Respond ONLY with valid JSON (no markdown):
{"isThreat": false, "reason": "No threat detected", "riskyWords": ["word1", "word2"]}

If no risky words found, return empty array. Be conservative — only flag actual profanity or threats.`;

        const responseText = await callOpenRouter(prompt);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return;

        const result = JSON.parse(jsonMatch[0]);
        const session = await SessionInstance.findById(sessionId).populate('participants', '_id name email');
        if (!session) return;

        const io = getIO();
        let changed = false;

        // Save risky words
        if (Array.isArray(result.riskyWords) && result.riskyWords.length > 0) {
            const cleaned = result.riskyWords.map(w => String(w).toLowerCase().trim()).filter(Boolean);
            session.riskyWords = [...new Set([...(session.riskyWords || []), ...cleaned])];
            changed = true;
            console.log(`⚠️ Security: risky words in session ${sessionId}:`, cleaned);

            if (io) {
                io.to('admin-room').emit('risk-words-update', {
                    sessionId: sessionId.toString(),
                    topic: session.topic,
                    newWords: cleaned,
                });
            }
        }

        // Flag users for severe threats
        if (result.isThreat && session.participants?.length) {
            const reason = result.reason || 'Policy violation detected';
            await User.updateMany(
                { _id: { $in: session.participants.map(p => p._id) } },
                { isFlagged: true, flagReason: reason }
            );
            console.log(`🚨 Security: threat detected in session ${sessionId}: ${reason}`);

            if (io) {
                io.to('admin-room').emit('threat-alert', {
                    sessionId: sessionId.toString(),
                    topic: session.topic,
                    reason,
                    participantCount: session.participants.length,
                    timestamp: new Date(),
                });
            }
        }

        if (changed) await session.save();

    } catch (err) {
        console.error(`Security check failed for session ${sessionId}:`, err.message);
    }
}

module.exports = { runSecurityCheck };
