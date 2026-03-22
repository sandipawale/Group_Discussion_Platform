const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gd-platform';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'prathmesh@gmail.com';

async function promoteAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String,
            isProfileComplete: Boolean
        }));

        const user = await User.findOne({ email: ADMIN_EMAIL });

        if (!user) {
            console.log(`User ${ADMIN_EMAIL} not found. They might need to login once first.`);
            process.exit(0);
        }

        user.role = 'admin';
        // Optional: Force profile complete for testing if you want to skip the setup screen
        // user.isProfileComplete = true; 

        await user.save();
        console.log(`SUCCESS: User ${ADMIN_EMAIL} is now an ADMIN.`);

        process.exit(0);
    } catch (err) {
        console.error('Error promoting admin:', err);
        process.exit(1);
    }
}

promoteAdmin();
