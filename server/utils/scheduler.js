const cron = require('node-cron');
const Slot = require('../models/Slot');
const SessionInstance = require('../models/SessionInstance');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { generateGDTopic } = require('../services/topicService');

// Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendRescheduleEmail = async (users, slot, oldTime) => {
    if (!users.length) return;
    const emails = users.map(u => u.email).join(',');

    if (process.env.NODE_ENV === 'development') {
        console.log(`📧 [DEV] Sending Reschedule Email to: ${emails}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"GD Platform" <${process.env.SMTP_USER}>`,
            bcc: emails,
            subject: 'Session Rescheduled: Insufficient Participants',
            html: `
                <div style="font-family:sans-serif;padding:20px;">
                    <h2>Session Rescheduled</h2>
                    <p>The session <strong>"${slot.topic}"</strong> has been rescheduled because the minimum participant count was not met.</p>
                    <p><strong>New Time:</strong> ${slot.startTime.toLocaleString()}</p>
                </div>
            `
        });
    } catch (err) {
        console.error('Failed to send reschedule emails:', err);
    }
};

let isTaskRunning = false;

const runScheduleTask = async () => {
    if (isTaskRunning) {
        console.log('⏳ Scheduler: Previous task still running, skipping this run.');
        return;
    }
    isTaskRunning = true;
    const now = new Date();
    const twoMinsFromNow = new Date(now.getTime() + 2 * 60 * 1000);

    try {
        // ─── 1. START SESSIONS ───────────────────────────────────────────
        const slotsToStart = await Slot.find({
            startTime: { $lte: now },
            status: { $in: ['SCHEDULED', 'RESCHEDULED', 'LIVE'] },
            isActive: true,
            endTime: { $gt: now }
        }).populate('waitingQueue.userId');

        for (const slot of slotsToStart) {
            let hasChanged = false;

            // ─── 1. Session State Transition ───
            // Mark as LIVE if it's currently time
            if (slot.status !== 'LIVE') {
                console.log(`📡 Session "${slot.topic}" is now LIVE.`);
                slot.status = 'LIVE';
                slot.isRescheduled = false;
                hasChanged = true;
            }

            // ─── 2. Evaluate Participants ───
            const participants = slot.waitingQueue
                .filter(q => q.status === 'WAITING' && q.userId)
                .map(q => q.userId)
                .filter(u => u !== null);

            if (participants.length >= slot.minParticipants) {
                const batchSize = slot.batchSize || 4;
                const isAutoTopic = !slot.topic || slot.topic.trim() === '' || slot.topic.toUpperCase() === 'TBD';

                let roomTopic = { topic: slot.topic, description: slot.description };

                // ─── Generate topic ONCE per slot if needed ───
                if (isAutoTopic) {
                    try {
                        roomTopic = await generateGDTopic();
                        // Update parent slot immediately so next rooms use same topic
                        slot.topic = roomTopic.topic;
                        slot.description = roomTopic.description;
                    } catch (topicErr) {
                        console.error('Gemini topic generation failed for slot, using defaults:', topicErr);
                        roomTopic = {
                            topic: 'Technology and Society GD',
                            description: 'A discussion on the impact of modern technology on human connections.'
                        };
                    }
                }

                for (let i = 0; i < participants.length; i += batchSize) {
                    const chunkList = participants.slice(i, i + batchSize);

                    // Only start if we have a viable chunk (at least 2 if possible, or whatever is left)
                    if (chunkList.length < 1) continue;

                    const roomName = `room-${slot._id}-${Date.now()}-${i}`;

                    const instance = await SessionInstance.create({
                        slotId: slot._id,
                        participants: chunkList.map(u => u._id),
                        livekitRoomName: roomName,
                        topic: roomTopic.topic,
                        description: roomTopic.description,
                        startTime: new Date(),
                        endTime: slot.endTime,
                        status: 'LIVE'
                    });
                    slot.occurrences.push(instance._id);


                    // ─── Mark participants as CONFIRMED so they aren't picked up again ───
                    for (const user of chunkList) {
                        const targetId = user._id ? user._id.toString() : user.toString();
                        const qIdx = slot.waitingQueue.findIndex(q => {
                            if (!q.userId) return false;
                            const qUserId = q.userId._id ? q.userId._id.toString() : q.userId.toString();
                            return qUserId === targetId;
                        });
                        if (qIdx !== -1) slot.waitingQueue[qIdx].status = 'CONFIRMED';
                    }
                }
                hasChanged = true;
                console.log(`🚀 Started/Scaled rooms for slot "${slot.topic}" (${participants.length} users processed)`);
            }

            if (hasChanged) {
                await slot.save();
            }
        }

        // ─── 3. END SESSIONS ─────────────────────────────────────────────
        const slotsToEnd = await Slot.find({
            endTime: { $lte: now },
            status: { $in: ['SCHEDULED', 'LIVE', 'RESCHEDULED'] },
            isActive: true
        });

        for (const slot of slotsToEnd) {
            const hasWaiting = slot.waitingQueue.some(q => q.status === 'WAITING');

            if (hasWaiting) {
                console.log(`♻️ Auto-rolling over slot "${slot.topic}" for pending students.`);
                const newStartTime = new Date(slot.startTime);
                newStartTime.setDate(newStartTime.getDate() + 1);
                const newEndTime = new Date(slot.endTime);
                newEndTime.setDate(newEndTime.getDate() + 1);

                slot.startTime = newStartTime;
                slot.endTime = newEndTime;
                slot.status = 'SCHEDULED'; // Reset to scheduled for tomorrow
                slot.isRescheduled = false; // Rollover is normal behavior
                await slot.save();
            } else {
                console.log(`🏁 Ending slot "${slot.topic}"`);
                slot.status = 'COMPLETED';
                await slot.save();
            }

            // Always mark associated LIVE instances as COMPLETED
            await SessionInstance.updateMany(
                { slotId: slot._id, status: 'LIVE' },
                { status: 'COMPLETED' }
            );
        }

    } catch (err) {
        console.error('Scheduler Error:', err);
    } finally {
        isTaskRunning = false;
    }
};

const initScheduler = () => {
    console.log('⏰ Scheduler initialized...');
    cron.schedule('* * * * *', runScheduleTask);
};

module.exports = { initScheduler, runScheduleTask };
