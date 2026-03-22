const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { runScheduleTask } = require('./server/utils/scheduler');
const Slot = require('./server/models/Slot');
const User = require('./server/models/User');
const SessionInstance = require('./server/models/SessionInstance');

async function testConfirmation() {
    console.log('🧪 Starting Verification of Participant Confirmation...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create a test user
        const user = await User.create({
            name: 'Test Verifier',
            email: `verify_${Date.now()}@example.com`,
            googleId: `google_${Date.now()}`,
            isProfileComplete: true
        });

        // 2. Create a test slot
        const now = new Date();
        const slot = await Slot.create({
            topic: 'Verification Topic',
            startTime: new Date(now.getTime() - 1000), // Started 1 second ago
            endTime: new Date(now.getTime() + 3600000), // Ends in 1 hour
            minParticipants: 1, // Set to 1 for easy testing
            batchSize: 4,
            waitingQueue: [{ userId: user._id, status: 'WAITING' }]
        });

        console.log('🔄 Running scheduler...');
        await runScheduleTask();

        // 3. Verify results
        const updatedSlot = await Slot.findById(slot._id);
        const qEntry = updatedSlot.waitingQueue[0];

        console.log(`Slot Status: ${updatedSlot.status}`);
        console.log(`Participant Status: ${qEntry.status}`);

        if (updatedSlot.status === 'LIVE' && qEntry.status === 'CONFIRMED') {
            console.log('✅ SUCCESS: Participant correctly marked as CONFIRMED.');
        } else {
            console.error('❌ FAILURE: Participant still WAITING or status mismatch.');
        }

        // 4. Cleanup
        await User.findByIdAndDelete(user._id);
        await Slot.findByIdAndDelete(slot._id);
        await SessionInstance.deleteMany({ slotId: slot._id });
        console.log('🧹 Cleanup complete.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Test Error:', err);
        process.exit(1);
    }
}

testConfirmation();
