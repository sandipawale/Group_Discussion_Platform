const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = (process.env.ADMIN_EMAIL || 'prathmesh@gmail.com').toLowerCase().trim();
        const user = await User.findOne({ email });

        console.log('--- Diagnostic Results ---');
        console.log('Target Email:', email);
        if (user) {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            console.log('Is Profile Complete:', user.isProfileComplete);
        } else {
            console.log('User NOT found in database.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkAdmin();
