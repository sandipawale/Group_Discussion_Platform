const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createTestStudent() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'student@test.com';
        const password = '123';
        const name = 'Test Student';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            user.role = 'student';
            await user.save();
        } else {
            console.log('Creating new test student...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'student',
                isProfileComplete: true,
                collegeName: 'Test College',
                branch: 'CS',
                year: '3rd Year'
            });
        }

        console.log('-----------------------------------');
        console.log('✅ Test Student Created/Updated');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error creating test student:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createTestStudent();
