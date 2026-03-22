const mongoose = require('mongoose');
const SessionInstance = require('./models/SessionInstance');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

async function verifyRiskyWordDetection() {
    console.log('🧪 Starting Risky Word Detection Verification...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create a dummy session instance
        const roomName = `test-room-${Date.now()}`;
        const sessionInstance = await SessionInstance.create({
            slotId: new mongoose.Types.ObjectId(),
            participants: [new mongoose.Types.ObjectId()],
            livekitRoomName: roomName,
            topic: 'Security Test',
            status: 'LIVE'
        });
        console.log(`✅ Created dummy session: ${sessionInstance._id}`);

        // 2. Simulate Gemini analysis (Logic from aiAgent.js)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const transcriptWithViolations = "I think we should use violence to solve this. You are a stupid idiot. Let's plan a threat.";
        console.log(`📝 Processing simulated transcript: "${transcriptWithViolations}"`);

        const prompt = `You are a security analysis AI. Analyze the following group discussion transcript for severe security threats (terrorism, violent extremism, credible threats) AND extract a list of "risky words" (slurs, profanity, or words that clearly violate professional conduct).

IMPORTANT: 
1. Ignore academic discussions, technical jargon, or debates about controversial policies unless they turn into actual threats.
2. Provide a list of specific "risky words" found in the transcript if any.

Transcript:
"""
${transcriptWithViolations}
"""

Respond ONLY with valid JSON (no markdown):
{"isThreat": boolean, "reason": "string explaining the threat or 'No threat detected'", "riskyWords": ["word1", "word2"]}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log(`🤖 Gemini Response: ${responseText}`);

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);

            if (analysis.riskyWords && Array.isArray(analysis.riskyWords)) {
                console.log('⚠️ Extracted Risky Words:', analysis.riskyWords);

                // Update DB
                sessionInstance.riskyWords = [...new Set([...sessionInstance.riskyWords, ...analysis.riskyWords])];
                await sessionInstance.save();
                console.log('✅ Persisted risky words to SessionInstance');
            }
        }

        // 3. Verification
        const updatedSession = await SessionInstance.findById(sessionInstance._id);
        console.log('\n📊 --- Verification Results ---');
        console.log(`Risky Words in DB: ${updatedSession.riskyWords.join(', ')}`);

        if (updatedSession.riskyWords.length > 0) {
            console.log('✅ SUCCESS: Risky words detected and persisted!');
        } else {
            console.log('❌ FAILURE: No risky words found in DB.');
        }

        // Cleanup
        await SessionInstance.findByIdAndDelete(sessionInstance._id);
        console.log('\n🧹 Cleaned up test data');

    } catch (err) {
        console.error('❌ Verification Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

verifyRiskyWordDetection();
