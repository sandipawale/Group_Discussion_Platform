const mongoose = require('mongoose');
const Slot = require('./models/Slot');
const dotenv = require('dotenv');

dotenv.config();

async function verifyOptionalTopicCreation() {
    console.log('🧪 Starting Optional Topic Creation & Update Verification...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Test Creation without Topic
        console.log('\n📝 Testing Creation with EMPTY topic...');
        const createData = {
            topic: '',
            description: 'Test blank topic',
            startTime: new Date(Date.now() + 3600000), // 1 hour from now
            endTime: new Date(Date.now() + 7200000),   // 2 hours from now
            maxParticipants: 40,
            batchSize: 4,
            minParticipants: 2
        };

        const newSlot = await Slot.create(createData);
        console.log(`✅ Slot Created! ID: ${newSlot._id}, Topic: "${newSlot.topic}"`);

        if (newSlot.topic === '') {
            console.log('✅ SUCCESS: Creation with blank topic allowed.');
        } else {
            console.log('❌ FAILURE: Topic is not blank.');
        }

        // 2. Test Update without Topic
        console.log('\n📝 Testing Update to EMPTY topic...');
        newSlot.topic = 'Temporary Topic';
        await newSlot.save();
        console.log(`- Set topic to: "${newSlot.topic}"`);

        // Simulating the updateSlot controller logic
        const updatedSlot = await Slot.findById(newSlot._id);
        updatedSlot.topic = '';
        await updatedSlot.save();
        console.log(`✅ Slot Updated! New Topic: "${updatedSlot.topic}"`);

        if (updatedSlot.topic === '') {
            console.log('✅ SUCCESS: Update to blank topic allowed.');
        } else {
            console.log('❌ FAILURE: Topic update failed.');
        }

        // Cleanup
        await Slot.findByIdAndDelete(newSlot._id);
        console.log('\n🧹 Cleaned up test data');

    } catch (err) {
        console.error('❌ Verification Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

verifyOptionalTopicCreation();
