const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Slot = require('./models/Slot');
const SessionInstance = require('./models/SessionInstance');
const { runScheduleTask } = require('./utils/scheduler');

// Mock Data
const slotId = new mongoose.Types.ObjectId();
const user1Id = new mongoose.Types.ObjectId();
const user2Id = new mongoose.Types.ObjectId();

async function runTest() {
    console.log('🧪 Starting Room Assignment Verification Test...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const User = require('./models/User');
        await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
        const user1 = await User.create({ _id: user1Id, email: 'test1@example.com', name: 'Student 1' });
        const user2 = await User.create({ _id: user2Id, email: 'test2@example.com', name: 'Student 2' });
        console.log('Created test users.');

        // Clean up
        await Slot.deleteMany({ _id: slotId });
        await SessionInstance.deleteMany({ slotId: slotId });

        // 1. Create a LIVE slot with 1 participant waiting (min 2)
        const slot = await Slot.create({
            _id: slotId,
            topic: 'Test Topic',
            startTime: new Date(Date.now() - 5000), // Started 5s ago
            endTime: new Date(Date.now() + 3600000),
            minParticipants: 2,
            batchSize: 4,
            status: 'LIVE',
            waitingQueue: [{ userId: user1Id, status: 'WAITING' }]
        });
        console.log('Created LIVE slot with 1 participant.');

        // 2. Run scheduler
        await runScheduleTask();

        // 3. Check if room was created
        let instances = await SessionInstance.find({ slotId: slotId });
        if (instances.length === 0) {
            console.log('✅ Success: No room created for 1 participant in LIVE slot.');
        } else {
            console.error('❌ Failure: Room created for only 1 participant!');
            process.exit(1);
        }

        // 4. Add second participant
        console.log('Adding second participant...');
        await Slot.findByIdAndUpdate(slotId, {
            $push: { waitingQueue: { userId: user2Id, status: 'WAITING' } }
        });

        // 5. Run scheduler again
        await runScheduleTask();

        // 6. Check if room was created
        const updatedSlot = await Slot.findById(slotId);
        console.log('Updated Slot Status:', updatedSlot.status);
        console.log('Waiting Queue:', updatedSlot.waitingQueue.map(q => q.status));
        instances = await SessionInstance.find({ slotId: slotId });
        console.log('Instances found:', instances.length);
        if (instances.length === 1 && instances[0].participants.length === 2) {
            console.log('✅ Success: Room created correctly for 2 participants.');
        } else {
            console.error('❌ Failure: Room not created correctly for 2 participants!');
            process.exit(1);
        }

        // Cleanup
        await Slot.deleteMany({ _id: slotId });
        await SessionInstance.deleteMany({ slotId: slotId });
        console.log('🧹 Cleanup complete.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test Error:', err);
        process.exit(1);
    }
}

runTest();
