const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const Slot = require('./server/models/Slot');
const User = require('./server/models/User');

async function inspect() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const slot = await Slot.findOne({ topic: /Artificial Intelligence/i })
            .populate('waitingQueue.userId');

        if (!slot) {
            console.log('❌ Slot not found. Recent slots:');
            const recent = await Slot.find().sort({ createdAt: -1 }).limit(5);
            recent.forEach(s => console.log(`- ${s.topic} (${s.status})`));
            process.exit(0);
        }

        console.log('\n--- Slot Trace ---');
        console.log(`Topic: ${slot.topic}`);
        console.log(`Status: ${slot.status}`);
        console.log(`IsRescheduled: ${slot.isRescheduled}`);
        console.log(`Start: ${slot.startTime}`);
        console.log(`Now:   ${new Date()}`);

        console.log('\nWaiting Queue:');
        slot.waitingQueue.forEach((q, i) => {
            console.log(`[${i}] Status: ${q.status}, User: ${q.userId?.name || 'NULL'}, Email: ${q.userId?.email || 'N/A'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Crash:', err);
        process.exit(1);
    }
}

inspect();
