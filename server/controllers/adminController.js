const User = require('../models/User');
const SessionInstance = require('../models/SessionInstance');
const Slot = require('../models/Slot');

exports.getAnalytics = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const activeRoomsInstances = await SessionInstance.find({ status: 'LIVE' });
        const activeRooms = activeRoomsInstances.length;

        // Calculate total students currently in live rooms
        const totalActiveUsers = activeRoomsInstances.reduce((sum, room) => sum + (room.participants?.length || 0), 0);

        const todayRooms = await SessionInstance.countDocuments({
            createdAt: { $gte: todayStart }
        });

        const completedRooms = await SessionInstance.countDocuments({ status: 'COMPLETED' });

        const flaggedUsers = await User.find({ isFlagged: true })
            .select('name email flagReason reputationScore')
            .limit(10);
        const riskyWordsAgg = await SessionInstance.aggregate([
            { $unwind: "$riskyWords" },
            { $group: { _id: "$riskyWords", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const flaggedWords = riskyWordsAgg.map(r => ({ word: r._id, count: r.count }));

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalAdmins,
                totalRoomsToday: todayRooms,
                activeRooms,
                completedRooms,
                totalActiveUsers
            },
            flaggedUsers,
            flaggedWords: flaggedWords.length ? flaggedWords : []
        });
    } catch (err) {
        console.error('Admin Analytics Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

exports.getFlaggedDetails = async (req, res) => {
    try {
        const flaggedUsers = await User.find({ isFlagged: true });
        res.json({ success: true, flaggedUsers });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch flagged details' });
    }
};

// Get details for a specific slot including all its dynamically created rooms
exports.getSlotDetails = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id)
            .populate({
                path: 'occurrences',
                populate: {
                    path: 'participants',
                    select: 'name email'
                }
            })
            .populate('waitingQueue.userId', 'name email');

        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        res.json({ success: true, slot });
    } catch (err) {
        console.error('Get Slot Details Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch slot details' });
    }
};
