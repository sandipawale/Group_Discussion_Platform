/**
 * AI Security Agent
 * -----------------
 * Connects as a hidden participant to a LiveKit room,
 * streams audio to Deepgram for STT, then sends transcripts
 * to Google Gemini 1.5 Flash for threat analysis.
 *
 * Usage:
 *   const { startAgent } = require('./services/aiAgent');
 *   startAgent(roomName, io);  // io = Socket.IO instance
 */

const { RoomServiceClient, AccessToken } = require('livekit-server-sdk');
const { createClient } = require('@deepgram/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Transcript = require('../models/Transcript');
const Room = require('../models/Room');

const ANALYSIS_INTERVAL_MS = 30000; // Analyze every 30 seconds

/**
 * Start the AI Security Agent for a given LiveKit room.
 */
async function startAgent(roomName, io) {
    console.log(`🤖 AI Agent starting for room: ${roomName}`);

    try {
        // ─── 1. Initialize Deepgram ─────────────────────────
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

        // ─── 2. Initialize Gemini ───────────────────────────
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // ─── 3. Transcript buffer ───────────────────────────
        let transcriptBuffer = '';
        let analysisTimer = null;

        // ─── 4. Deepgram Live Transcription ─────────────────
        const connection = deepgram.listen.live({
            model: 'nova-2',
            language: 'en',
            smart_format: true,
            interim_results: false,
        });

        connection.on('open', () => {
            console.log(`🎤 Deepgram connection open for room: ${roomName}`);
        });

        connection.on('transcript', async (data) => {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim()) {
                console.log(`📝 [${roomName}] Transcript: ${transcript}`);
                transcriptBuffer += transcript + ' ';

                // Save transcript to DB
                const room = await Room.findOne({ livekitRoomName: roomName });
                if (room) {
                    await Transcript.create({
                        roomId: room._id,
                        text: transcript,
                    });
                }
            }
        });

        connection.on('error', (err) => {
            console.error(`❌ Deepgram error [${roomName}]:`, err);
        });

        connection.on('close', () => {
            console.log(`🔇 Deepgram connection closed for room: ${roomName}`);
            if (analysisTimer) clearInterval(analysisTimer);
        });

        // ─── 5. Periodic Gemini Analysis ────────────────────
        analysisTimer = setInterval(async () => {
            if (!transcriptBuffer.trim()) return;

            const textToAnalyze = transcriptBuffer;
            // Removed: transcriptBuffer = ''; // Don't clear yet

            try {
                const prompt = `You are a security analysis AI. Analyze the following group discussion transcript for severe security threats (terrorism, violent extremism, credible threats) AND extract a list of "risky words" (slurs, profanity, or words that clearly violate professional conduct).

IMPORTANT: 
1. Ignore academic discussions, technical jargon, or debates about controversial policies unless they turn into actual threats.
2. Provide a list of specific "risky words" found in the transcript if any.

Transcript:
"""
${textToAnalyze}
"""

Respond ONLY with valid JSON (no markdown):
{"isThreat": boolean, "reason": "string explaining the threat or 'No threat detected'", "riskyWords": ["word1", "word2"]}`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                // Parse JSON from response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);

                    // CLEAR BUFFER ON SUCCESSFUL PARSE
                    transcriptBuffer = transcriptBuffer.replace(textToAnalyze, '');

                    const sessionInstance = await SessionInstance.findOne({ livekitRoomName: roomName });
                    if (sessionInstance) {
                        // ─── Save Risky Words ───
                        if (analysis.riskyWords && Array.isArray(analysis.riskyWords) && analysis.riskyWords.length > 0) {
                            console.log(`⚠️ RISKY WORDS found in ${roomName}:`, analysis.riskyWords);
                            sessionInstance.riskyWords = [...new Set([...sessionInstance.riskyWords, ...analysis.riskyWords])];
                            await sessionInstance.save();

                            if (io) {
                                io.to('admin-room').emit('risk-words-update', {
                                    roomName,
                                    newWords: analysis.riskyWords,
                                    allWords: sessionInstance.riskyWords
                                });
                            }
                        }

                        // ─── Severe Threat Logic ───
                        if (analysis.isThreat) {
                            console.log(`🚨 THREAT DETECTED in room ${roomName}: ${analysis.reason}`);
                            await User.updateMany(
                                { _id: { $in: sessionInstance.participants } },
                                { isFlagged: true, flagReason: analysis.reason }
                            );

                            await Transcript.updateMany(
                                { roomId: sessionInstance._id },
                                { isThreat: true, threatReason: analysis.reason }
                            );

                            if (io) {
                                io.to('admin-room').emit('threat-alert', {
                                    roomName,
                                    roomId: sessionInstance._id,
                                    reason: analysis.reason,
                                    timestamp: new Date(),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`❌ Gemini analysis error [${roomName}]:`, err.message);
                // Buffer is NOT cleared on error, it will retry with accumulated text next interval
            }
        }, ANALYSIS_INTERVAL_MS);

        // Return control handles
        return {
            sendAudio: (audioBuffer) => {
                if (connection.getReadyState() === 1) {
                    connection.send(audioBuffer);
                }
            },
            stop: () => {
                if (analysisTimer) clearInterval(analysisTimer);
                connection.finish();
                console.log(`🛑 AI Agent stopped for room: ${roomName}`);
            },
        };
    } catch (err) {
        console.error(`❌ AI Agent startup error [${roomName}]:`, err.message);
        return null;
    }
}

module.exports = { startAgent };
