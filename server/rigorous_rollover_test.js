const mongoose = require('mongoose');
const Slot = require('./models/Slot');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Mocking the logic from slotController.getTodaySlots
 */
function mockGetTodaySlots(slot, userId, now) {
    let displayStartTime = new Date(slot.startTime);
    let displayEndTime = new Date(slot.endTime);
    let isRolledOver = false;

    // RULE IMPLEMENTATION:
    if (now >= displayStartTime) {
        const userEntry = slot.waitingQueue.find(
            q => q.userId.toString() === userId.toString()
        );

        const isConfirmedInLive = userEntry && userEntry.status === 'CONFIRMED';

        if (!isConfirmedInLive) {
            displayStartTime.setDate(displayStartTime.getDate() + 1);
            displayEndTime.setDate(displayEndTime.getDate() + 1);
            isRolledOver = true;
        }
    }

    return {
        isRolledOver,
        displayStartTime
    };
}

async function runRigorousTests() {
    console.log('🚀 Starting Rigorous Rollover Logic Verification...\n');

    try {
        const studentA = { _id: new mongoose.Types.ObjectId() }; // Registered & WAITING
        const studentB = { _id: new mongoose.Types.ObjectId() }; // Registered & CONFIRMED
        const studentC = { _id: new mongoose.Types.ObjectId() }; // Unregistered

        const now = new Date();
        const startTime = new Date(now.getTime() + 120000); // 2 minutes from now
        const endTime = new Date(startTime.getTime() + 1800000); // 30 mins later

        const dummySlot = {
            startTime,
            endTime,
            waitingQueue: [
                { userId: studentA._id, status: 'WAITING' },
                { userId: studentB._id, status: 'CONFIRMED' }
            ]
        };

        console.log(`Current Time: ${now.toLocaleTimeString()}`);
        console.log(`Slot Start:  ${startTime.toLocaleTimeString()}`);

        // --- TEST CASE 1: Before Start Time ---
        console.log('\n--- CASE 1: BEFORE START TIME (Both should see TODAY) ---');
        const res1A = mockGetTodaySlots(dummySlot, studentA._id, now);
        const res1C = mockGetTodaySlots(dummySlot, studentC._id, now);
        console.log(`User A (Registered/Waiting) -> Rolled Over: ${res1A.isRolledOver} (Date: ${res1A.displayStartTime.toLocaleDateString()})`);
        console.log(`User C (Unregistered) -> Rolled Over: ${res1C.isRolledOver} (Date: ${res1C.displayStartTime.toLocaleDateString()})`);

        // --- TEST CASE 2: After Start Time (Pre-Confirmed) ---
        console.log('\n--- CASE 2: AFTER START TIME (WAITING/UNREG should see TOMORROW) ---');
        const pastStart = new Date(startTime.getTime() + 60000); // 1 min after start
        const res2A = mockGetTodaySlots(dummySlot, studentA._id, pastStart);
        const res2C = mockGetTodaySlots(dummySlot, studentC._id, pastStart);
        console.log(`User A (Registered/Waiting) -> Rolled Over: ${res2A.isRolledOver} (Date: ${res2A.displayStartTime.toLocaleDateString()})`);
        console.log(`User C (Unregistered) -> Rolled Over: ${res2C.isRolledOver} (Date: ${res2C.displayStartTime.toLocaleDateString()})`);

        // --- TEST CASE 3: After Start Time (Confirmed User) ---
        console.log('\n--- CASE 3: AFTER START TIME (CONFIRMED should see TODAY) ---');
        const res3B = mockGetTodaySlots(dummySlot, studentB._id, pastStart);
        console.log(`User B (Registered/Confirmed) -> Rolled Over: ${res3B.isRolledOver} (Date: ${res3B.displayStartTime.toLocaleDateString()})`);

        console.log('\n🌟 --- FINAL SUMMARY --- 🌟');
        if (!res1A.isRolledOver && res2A.isRolledOver && res2C.isRolledOver && !res3B.isRolledOver) {
            console.log('✅ ALL SCENARIOS VERIFIED SUCCESSFULLY!');
            console.log('   1. Both see Today before start.');
            console.log('   2. Waiting/Unregistered see Tomorrow after start.');
            console.log('   3. Confirmed student stays on Today after start.');
        } else {
            console.log('❌ VERIFICATION FAILED! Logic mismatch found.');
        }

    } catch (err) {
        console.error('❌ Verification Error:', err);
    }
}

runRigorousTests();
