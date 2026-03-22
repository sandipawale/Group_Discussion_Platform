const mongoose = require('mongoose');
require('dotenv').config();
const Slot = require('./models/Slot');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for seeding...');

        // Delete existing slots
        await Slot.deleteMany({});

        const now = new Date();
        const startTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 mins after start

        await Slot.create({
            topic: 'Future of Generative AI',
            description: 'Discussing the impact of LLMs and Diffusion models on student productivity and job markets.',
            startTime,
            endTime,
            maxParticipants: 40,
        });

        console.log('✅ Created a test slot for today!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
