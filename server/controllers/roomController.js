const { AccessToken } = require('livekit-server-sdk');
const SessionInstance = require('../models/SessionInstance');
const Slot = require('../models/Slot');

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
