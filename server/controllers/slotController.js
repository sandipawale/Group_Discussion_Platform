const Slot = require('../models/Slot');
const SessionInstance = require('../models/SessionInstance');

// ─── Update Slot (Admin) ───────────────────────────────────
exports.updateSlot = async (req, res) => {
    try {
        const { topic, description, startTime, endTime, maxParticipants, batchSize, minParticipants } = req.body;

        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        // Update fields if provided
        if (topic !== undefined) slot.topic = topic;
        if (description !== undefined) slot.description = description;
        if (startTime) slot.startTime = new Date(startTime);
        if (endTime) slot.endTime = new Date(endTime);
        if (maxParticipants) slot.maxParticipants = maxParticipants;
        if (batchSize) slot.batchSize = batchSize;
        if (minParticipants) slot.minParticipants = minParticipants;

        await slot.save();

        res.json({ success: true, slot });
    } catch (err) {
        console.error('Update Slot Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update slot' });
    }
};

// ─── Create Slot (Admin) ───────────────────────────────────
exports.createSlot = async (req, res) => {
    try {
        const { topic, description, startTime, endTime, maxParticipants, batchSize, minParticipants } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
        }

        const slot = await Slot.create({
            topic,
            description: description || '',
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            maxParticipants: maxParticipants || 40,
            batchSize: batchSize || 4,
            minParticipants: minParticipants || 2,
            createdBy: req.user._id,
        });

        res.status(201).json({ success: true, slot });
    } catch (err) {
        console.error('Create Slot Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create slot' });
    }
};

// ─── Get Today's Slots ─────────────────────────────────────
exports.getTodaySlots = async (req, res) => {
    try {
        const now = new Date();

        // Only show slots that haven't ended yet and are active
        const slots = await Slot.find({
            endTime: { $gt: now },
            isActive: true,
            status: { $in: ['SCHEDULED', 'LIVE', 'RESCHEDULED'] },
        }).sort({ startTime: 1 });

        const enriched = slots.map((slot) => {
            const total = slot.waitingQueue.length;
            const waitingCount = slot.waitingQueue.filter((q) => q.status === 'WAITING').length;

            return {
                ...slot.toObject(),
                totalRegistered: total,
                waitingCount,
                isFilling: total >= 2 && waitingCount > 0,
            };
        });

        res.json({ success: true, slots: enriched });
    } catch (err) {
        console.error('Get Slots Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch slots' });
    }
};

// ─── Register for a Slot (Join Queue) ──────────────────────
exports.registerSlot = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        // Check if already registered for this specific slot
        const alreadyIn = slot.waitingQueue.find(
            (q) => q.userId.toString() === req.user._id.toString()
        );
        if (alreadyIn) {
            return res.status(400).json({ success: false, message: 'Already registered for this slot' });
        }

        // ─── Overlap Validation ───────────────────────────────────
        // Check if user is registered in any other slot that overlaps in time
        const overlappingSlot = await Slot.findOne({
            _id: { $ne: slot._id },
            status: { $in: ['SCHEDULED', 'LIVE'] },
            waitingQueue: {
                $elemMatch: {
                    userId: req.user._id,
                    status: { $ne: 'COMPLETED' }
                }
            },
            startTime: { $lt: slot.endTime },
            endTime: { $gt: slot.startTime }
        });

        if (overlappingSlot) {
            return res.status(400).json({
                success: false,
                message: `Time conflict! You are already registered for "${overlappingSlot.topic}" which overlaps with this session.`
            });
        }
        // ──────────────────────────────────────────────────────────

        // Push to waiting queue
        slot.waitingQueue.push({ userId: req.user._id, status: 'WAITING' });
        await slot.save();

        res.json({
            success: true,
            status: 'WAITING',
            message: 'Registered successfully. You will be notified when the session starts.'
        });
    } catch (err) {
        console.error('Register Slot Error:', err);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

// ─── Cancel Registration ───────────────────────────────────
exports.cancelRegistration = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        const idx = slot.waitingQueue.findIndex(
            (q) => q.userId.toString() === req.user._id.toString() && q.status === 'WAITING'
        );

        if (idx === -1) {
            return res.status(400).json({
                success: false,
                message: 'Not in waiting queue or already confirmed',
            });
        }

        slot.waitingQueue.splice(idx, 1);
        await slot.save();

        res.json({ success: true, message: 'Registration cancelled' });
    } catch (err) {
        console.error('Cancel Registration Error:', err);
        res.status(500).json({ success: false, message: 'Cancellation failed' });
    }
};

// ─── Delete Slot (Admin) ───────────────────────────────────
exports.deleteSlot = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

        // Check if slot has already started
        if (slot.status === 'LIVE') {
            return res.status(400).json({ success: false, message: 'Cannot delete a live session' });
        }

        // Delete associated SessionInstance documents
        await SessionInstance.deleteMany({ slotId: req.params.id });

        // Delete the slot using findByIdAndDelete
        await Slot.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Slot and associated instances deleted successfully' });
    } catch (err) {
        console.error('Delete Slot Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete slot' });
    }
};

// ─── Get All Slots (Admin) ─────────────────────────────────
exports.getAllSlots = async (req, res) => {
    try {
        const slots = await Slot.find().sort({ startTime: -1 }).populate('waitingQueue.userId', 'name email');
        res.json({ success: true, slots });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch slots' });
    }
};
