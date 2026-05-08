const cron = require('node-cron');
const Slot = require('../models/Slot');
const SessionInstance = require('../models/SessionInstance');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { generateGDTopic } = require('../services/topicService');
const { analyzeSession } = require('../services/analysisService');

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
                const adminSetTopic = slot.topic && slot.topic.trim() !== '' && slot.topic.toUpperCase() !== 'TBD';

                // ─── Generate ONE topic for the entire slot (shared across all rooms) ───
                let slotTopic;
                if (adminSetTopic) {
                    slotTopic = { topic: slot.topic, description: slot.description };
                } else {
                    // Collect recently used topics globally to avoid repetition
                    const existingInstances = await SessionInstance.find(
                        {},
                        { topic: 1 },
                        { sort: { startTime: -1 }, limit: 50 }
                    );
                    const usedTopics = existingInstances.map(s => s.topic).filter(Boolean);

                    try {
                        slotTopic = await generateGDTopic(usedTopics);
                    } catch (topicErr) {
                        console.error('Topic generation failed, using fallback:', topicErr.message);
                        slotTopic = {
                            topic: 'Technology and Society GD',
                            description: 'A discussion on the impact of modern technology on human connections.'
                        };
                    }

                    // Save the generated topic back to the slot so admin panel shows it
                    slot.topic = slotTopic.topic;
                    slot.description = slotTopic.description;
                }

                console.log(`🎯 Slot topic: "${slotTopic.topic}"`);

                for (let i = 0; i < participants.length; i += batchSize) {
                    const chunkList = participants.slice(i, i + batchSize);
                    if (chunkList.length < 1) continue;

                    const roomName = `room-${slot._id}-${Date.now()}-${i}`;

                    const instance = await SessionInstance.create({
                        slotId: slot._id,
                        participants: chunkList.map(u => u._id),
                        livekitRoomName: roomName,
                        topic: slotTopic.topic,
                        description: slotTopic.description,
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

                    console.log(`🚀 Room created: "${slotTopic.topic}" (${chunkList.length} users)`);
                }
                hasChanged = true;
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
            console.log(`🏁 Ending slot "${slot.topic}"`);
            slot.status = 'COMPLETED';
            slot.isActive = false;
            await slot.save();

            // Mark associated LIVE instances as COMPLETED and trigger AI analysis
            const liveInstances = await SessionInstance.find({ slotId: slot._id, status: 'LIVE' });
            await SessionInstance.updateMany(
                { slotId: slot._id, status: 'LIVE' },
                { status: 'COMPLETED', endTime: new Date() }
            );
            // Trigger async AI analysis for each completed session (non-blocking)
            for (const instance of liveInstances) {
                analyzeSession(instance._id).catch(err =>
                    console.error(`Analysis trigger failed for ${instance._id}:`, err.message)
                );
            }
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
