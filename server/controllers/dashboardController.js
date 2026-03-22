const Slot = require('../models/Slot');
const Room = require('../models/Room');

// ─── My Registrations (Confirmed + Pending) ────────────────
exports.getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find slots where user is in waitingQueue
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
                // Find the room for this user + slot
                const room = await Room.findOne({
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
                    needMore: 4 - (waitingCount % 4 === 0 ? 4 : waitingCount % 4),
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

        const completedRooms = await Room.countDocuments({
            participants: userId,
            status: 'completed',
        });

        const activeRooms = await Room.countDocuments({
            participants: userId,
            status: { $in: ['waiting', 'active'] },
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
