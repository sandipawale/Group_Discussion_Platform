const mongoose = require('mongoose');

const sessionInstanceSchema = new mongoose.Schema({
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    livekitRoomName: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    status: {
        type: String,
        enum: ['LIVE', 'COMPLETED'],
        default: 'LIVE'
    },
    transcript: {
        type: String,
        default: ''
    },
    riskyWords: {
        type: [String],
        default: []
    },
    scores: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('SessionInstance', sessionInstanceSchema);
