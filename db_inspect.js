const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const Slot = require('./server/models/Slot');
const SessionInstance = require('./server/models/SessionInstance');
const User = require('./server/models/User');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find the slot from the screenshot (Future of AI...)
        const slots = await Slot.find({ topic: /Artificial Intelligence/i })
            .populate('waitingQueue.userId', 'name email')
            .populate('occurrences');

        if (slots.length === 0) {
            console.log('❌ Slot not found by topic. Listing all active slots:');
            const allSlots = await Slot.find({ isActive: true }).limit(5);
            allSlots.forEach(s => console.log(`- ${s.topic} (ID: ${s._id}, Status: ${s.status}, Participants: ${s.waitingQueue.length})`));
        }

        for (const slot of slots) {
            console.log('\n--- Slot Details ---');
            console.log(`Topic: ${slot.topic}`);
            console.log(`ID: ${slot._id}`);
            console.log(`Status: ${slot.status}`);
            console.log(`Start Time: ${slot.startTime}`);
            console.log(`Min Participants: ${slot.minParticipants}`);
            console.log(`Batch Size: ${slot.batchSize}`);

            console.log('\nWaiting Queue:');
            slot.waitingQueue.forEach(q => {
                console.log(`- User: ${q.userId?.name || 'Unknown'} (${q.userId?.email || 'N/A'}), Status: ${q.status}`);
            });

            console.log('\nOccurrences:');
            slot.occurrences.forEach((occ, i) => {
                console.log(`- Room #${i + 1}: ${occ._id}, Status: ${occ.status}, Participants: ${occ.participants.length}, CreatedAt: ${occ.createdAt}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Inspection Error:', err);
        process.exit(1);
    }
}

inspect();
