const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Slot',
            required: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        livekitRoomName: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['waiting', 'active', 'completed'],
            default: 'waiting',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
