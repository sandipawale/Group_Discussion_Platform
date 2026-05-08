const { AccessToken } = require('livekit-server-sdk');
const { createClient } = require('@deepgram/sdk');
const SessionInstance = require('../models/SessionInstance');
const Slot = require('../models/Slot');
const Transcript = require('../models/Transcript');

// ─── Get Room Token (LiveKit) ──────────────────────────────
exports.getRoomToken = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // 1. Try finding by SessionInstance ID directly
        let room = await SessionInstance.findById(id)
            .populate('participants', 'name email')
            .populate('slotId', 'topic');

        // 2. If not found, it might be a Slot ID. Find the instance the user is assigned to for this slot.
        if (!room) {
            room = await SessionInstance.findOne({
                slotId: id,
                participants: userId,
                status: 'LIVE' // Only join live rooms
            }).populate('participants', 'name email').populate('slotId', 'topic');
        }

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found or you are not assigned yet.' });
        }

        // ─── Re-entry Prevention ──────────────────────────────────
        // Check if user has already submitted feedback for this specific session instance
        const Feedback = require('../models/Feedback'); // Lazy require to avoid circular if any
        const existingFeedback = await Feedback.findOne({ userId, sessionId: room._id });
        if (existingFeedback) {
            return res.status(403).json({
                success: false,
                message: 'Discussion completed! You have already submitted feedback for this session and cannot re-enter.'
            });
        }
        // ──────────────────────────────────────────────────────────

        // Check if user is a participant (Double check)
        const isParticipant = room.participants.some(
            (p) => p._id.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant of this room' });
        }

        // Generate LiveKit token
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: userId.toString(),
                name: req.user.name || req.user.email,
            }
        );
        at.addGrant({
            roomJoin: true,
            room: room.livekitRoomName,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        res.json({
            success: true,
            token,
            roomName: room.livekitRoomName,
            serverUrl: process.env.LIVEKIT_API_URL,
            participants: room.participants,
            roomId: room._id,
            topic: room.topic || room.slotId?.topic || 'Group Discussion',
            description: room.description || room.slotId?.description || ''
        });
    } catch (err) {
        console.error('Get Room Token Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate token' });
    }
};

// ─── Submit Transcript Chunk ──────────────────────────────────
exports.submitTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        const session = await SessionInstance.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        // Verify user is a participant
        const isParticipant = session.participants.some(p => p.toString() === req.user._id.toString());
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant of this session' });
        }

        await Transcript.create({
            roomId: session._id,
            userId: req.user._id,
            text: text.trim(),
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Submit Transcript Error:', err);
        res.status(500).json({ success: false, message: 'Failed to save transcript' });
    }
};

// ─── Leave Room (mark session complete + trigger analysis) ─
exports.leaveRoom = async (req, res) => {
    try {
        const session = await SessionInstance.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const isParticipant = session.participants.some(p => p.toString() === req.user._id.toString());
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Not a participant' });

        if (session.status !== 'COMPLETED') {
            session.status = 'COMPLETED';
            session.endTime = new Date();
            await session.save();

            const { analyzeSession } = require('../services/analysisService');
            analyzeSession(session._id).catch(err =>
                console.error(`Analysis failed for ${session._id}:`, err.message)
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Leave Room Error:', err);
        res.status(500).json({ success: false, message: 'Failed to complete session' });
    }
};

// ─── Transcribe Audio (Deepgram pre-recorded) ─────────────
exports.transcribeAudio = async (req, res) => {
    try {
        const session = await SessionInstance.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const isParticipant = session.participants.some(p => p.toString() === req.user._id.toString());
        if (!isParticipant) return res.status(403).json({ success: false });

        const audioBuffer = req.body;
        if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 500) {
            console.log(`⚠️ Audio too small or missing for session ${req.params.id}`);
            return res.json({ success: true, message: 'No audio data' });
        }

        console.log(`🎙️ Transcribing audio for user ${req.user._id}, size: ${(audioBuffer.length / 1024).toFixed(1)}KB`);

        const dg = createClient(process.env.DEEPGRAM_API_KEY);
        const { result, error } = await dg.listen.prerecorded.transcribeFile(audioBuffer, {
            model: 'nova-2',
            language: 'en-IN',
            smart_format: true,
            punctuate: true,
            paragraphs: true,
        });

        if (error) {
            console.error('Deepgram transcription error:', error);
            return res.json({ success: false, message: 'Transcription failed' });
        }

        const fullText = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();

        if (fullText) {
            await Transcript.create({ roomId: session._id, userId: req.user._id, text: fullText });
            console.log(`✅ Transcript saved [${req.user.name || req.user._id}]: "${fullText.slice(0, 80)}..."`);

            // Trigger analysis once we have at least one transcript and session is done
            if (session.status === 'COMPLETED') {
                const { analyzeSession } = require('../services/analysisService');
                analyzeSession(session._id).catch(err =>
                    console.error('Post-transcription analysis failed:', err.message)
                );
            }
        } else {
            console.log(`⚠️ Deepgram returned empty transcript for user ${req.user._id}`);
        }

        res.json({ success: true, transcribed: !!fullText });
    } catch (err) {
        console.error('Transcribe Audio Error:', err);
        res.status(500).json({ success: false, message: 'Transcription failed' });
    }
};

// ─── Get Room Details ──────────────────────────────────────
exports.getRoomDetails = async (req, res) => {
    try {
        const room = await SessionInstance.findById(req.params.id)
            .populate('participants', 'name email collegeName')
            .populate('slotId', 'topic startTime endTime');

        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        res.json({ success: true, room });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch room' });
    }
};
