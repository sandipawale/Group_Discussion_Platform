const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
    {
        topic: {
            type: String,
            required: false,
            trim: true,
            default: ''
        },
        description: {
            type: String,
            default: '',
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        maxParticipants: {
            type: Number,
            default: 40,
        },
        // Auto-scaling & Rescheduling fields
        batchSize: {
            type: Number,
            default: 4, // Users per video room
        },
        minParticipants: {
            type: Number,
            default: 2, // Min total users to start session
        },
        status: {
            type: String,
            enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'],
            default: 'SCHEDULED',
        },
        occurrences: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SessionInstance'
        }],
        waitingQueue: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                status: {
                    type: String,
                    enum: ['WAITING', 'CONFIRMED', 'COMPLETED'],
                    default: 'WAITING',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        isRescheduled: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
