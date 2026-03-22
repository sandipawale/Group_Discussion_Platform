const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { runScheduleTask } = require('./utils/scheduler');

async function runLockTest() {
    console.log('🧪 Starting Scheduler Run-Lock Stress Test...');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Triggering scheduler 5 times simultaneously...');

        // Trigger 5 times in parallel
        await Promise.all([
            runScheduleTask(),
            runScheduleTask(),
            runScheduleTask(),
            runScheduleTask(),
            runScheduleTask()
        ]);

        console.log('✅ Stress test completed. Check console logs for "skipping this run" messages.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test Error:', err);
        process.exit(1);
    }
}

runLockTest();
