const Feedback = require('../models/Feedback');
const SessionInstance = require('../models/SessionInstance');

// Submit Feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { sessionId, rating, comments } = req.body;

        if (!sessionId || !rating) {
            return res.status(400).json({ success: false, message: 'Session ID and rating are required' });
        }

        const existingFeedback = await Feedback.findOne({ userId: req.user._id, sessionId });
        if (existingFeedback) {
            return res.status(400).json({ success: false, message: 'You have already submitted feedback for this session.' });
        }

        const feedback = await Feedback.create({
            userId: req.user._id,
            sessionId,
            rating,
            comments
        });

        // ─── Post-Feedback Lifecycle Management ──────────────────────
        // Find the slot and mark this student as COMPLETED so they can join other GDs
        try {
            const Slot = require('../models/Slot');
            const session = await SessionInstance.findById(sessionId);
            if (session) {
                await Slot.updateOne(
                    { _id: session.slotId, 'waitingQueue.userId': req.user._id },
                    { $set: { 'waitingQueue.$.status': 'COMPLETED' } }
                );
            }
        } catch (updateErr) {
            console.error('Failed to update slot status to COMPLETED:', updateErr);
        }
        // ────────────────────────────────────────────────────────────

        res.status(201).json({ success: true, feedback });
    } catch (err) {
        console.error('Feedback Error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
};

// Get User Feedback History
exports.getMyFeedback = async (req, res) => {
    try {
        const history = await Feedback.find({ userId: req.user._id })
            .populate({
                path: 'sessionId',
                populate: { path: 'slotId', select: 'topic startTime' }
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, history });
    } catch (err) {
        console.error('Fetch Feedback Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};
