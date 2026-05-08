const Slot = require('../models/Slot');
const SessionInstance = require('../models/SessionInstance');

// ─── My Registrations (Confirmed + Pending) ────────────────
exports.getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user._id;

        const slots = await Slot.find({
            'waitingQueue.userId': userId,
        });

        const confirmed = [];
        const pending = [];

        for (const slot of slots) {
            const entry = slot.waitingQueue.find(
                (q) => q.userId.toString() === userId.toString()
            );

            if (entry?.status === 'CONFIRMED') {
                const room = await SessionInstance.findOne({
                    slotId: slot._id,
                    participants: userId,
                }).populate('participants', 'name email collegeName');

                confirmed.push({
                    slot: {
                        _id: slot._id,
                        topic: slot.topic,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    },
                    room: room
                        ? {
                            _id: room._id,
                            livekitRoomName: room.livekitRoomName,
                            status: room.status,
                            participants: room.participants,
                            topic: room.topic,
                        }
                        : null,
                });
            } else if (entry?.status === 'WAITING') {
                const waitingCount = slot.waitingQueue.filter(
                    (q) => q.status === 'WAITING'
                ).length;

                pending.push({
                    slot: {
                        _id: slot._id,
                        topic: slot.topic,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    },
                    waitingCount,
                    needMore: Math.max(0, slot.minParticipants - waitingCount),
                });
            }
        }

        res.json({ success: true, confirmed, pending });
    } catch (err) {
        console.error('My Registrations Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
    }
};

// ─── Dashboard Stats ───────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const completedRooms = await SessionInstance.countDocuments({
            participants: userId,
            status: 'COMPLETED',
        });

        const activeRooms = await SessionInstance.countDocuments({
            participants: userId,
            status: 'LIVE',
        });

        res.json({
            success: true,
            stats: {
                reputationScore: req.user.reputationScore,
                totalSessions: completedRooms + activeRooms,
                completedSessions: completedRooms,
                activeSessions: activeRooms,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};
