const User = require('../models/User');
const SessionInstance = require('../models/SessionInstance');
const Slot = require('../models/Slot');
const Transcript = require('../models/Transcript');
const { analyzeSession } = require('../services/analysisService');

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

// Get details for a specific SessionInstance (room) with full AI analysis
exports.getSessionDetails = async (req, res) => {
    try {
        const session = await SessionInstance.findById(req.params.id)
            .populate('participants', 'name email collegeName')
            .populate('slotId', 'topic startTime endTime')
            .populate('participantAnalysis.userId', 'name email');

        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        // Fetch transcripts for this session
        const transcripts = await Transcript.find({ roomId: session._id })
            .populate('userId', 'name email')
            .sort({ createdAt: 1 });

        res.json({ success: true, session, transcripts });
    } catch (err) {
        console.error('Get Session Details Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch session details' });
    }
};

// Force-complete a stuck LIVE session and trigger analysis
exports.forceCompleteSession = async (req, res) => {
    try {
        const session = await SessionInstance.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        session.status = 'COMPLETED';
        session.endTime = session.endTime || new Date();
        session.analysisStatus = 'pending';
        await session.save();

        analyzeSession(req.params.id).catch(err =>
            console.error(`Force-complete analysis failed for ${req.params.id}:`, err.message)
        );

        res.json({ success: true, message: 'Session completed and analysis started.' });
    } catch (err) {
        console.error('Force Complete Error:', err);
        res.status(500).json({ success: false, message: 'Failed to force complete session' });
    }
};

// Manually trigger AI analysis for a specific session
exports.triggerAnalysis = async (req, res) => {
    try {
        const session = await SessionInstance.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        // Reset status so analysis runs fresh
        session.analysisStatus = 'pending';
        await session.save();

        // Run async, non-blocking
        analyzeSession(req.params.id).catch(err =>
            console.error(`Manual analysis trigger failed for ${req.params.id}:`, err.message)
        );

        res.json({ success: true, message: 'Analysis started. Refresh in a few seconds.' });
    } catch (err) {
        console.error('Trigger Analysis Error:', err);
        res.status(500).json({ success: false, message: 'Failed to trigger analysis' });
    }
};

// Get details for a specific slot including all its dynamically created rooms
exports.getSlotDetails = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id)
            .populate({
                path: 'occurrences',
                populate: [
                    { path: 'participants', select: 'name email' },
                    { path: 'participantAnalysis.userId', select: 'name email' }
                ]
            })
            .populate('waitingQueue.userId', 'name email');

        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        res.json({ success: true, slot });
    } catch (err) {
        console.error('Get Slot Details Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch slot details' });
    }
};
