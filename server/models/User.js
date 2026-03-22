const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // Don't return password by default
        },
        name: {
            type: String,
            trim: true,
            default: '',
        },
        collegeName: {
            type: String,
            trim: true,
            default: '',
        },
        branch: {
            type: String,
            trim: true,
            default: '',
        },
        year: {
            type: String,
            trim: true,
            default: '',
        },
        topicsOfInterest: {
            type: [String],
            default: [],
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        reputationScore: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },
        isProfileComplete: {
            type: Boolean,
            default: false,
        },
        isFlagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
