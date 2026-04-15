const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');
const Task = require('./backend/models/Task');
const Submission = require('./backend/models/Submission');

dotenv.config({ path: './.env' });

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding');

        // Clear existing
        await User.deleteMany();
        await Task.deleteMany();
        await Submission.deleteMany();

        // Create Admin
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@devtrack.com',
            password: 'password123',
            role: 'admin'
        });

        // Create Sample User
        const user = await User.create({
            name: 'Student User',
            email: 'student@devtrack.com',
            password: 'password123',
            role: 'user'
        });

        // Create Tasks
        await Task.insertMany([
            {
                title: 'Complete React Fundamentals Module',
                type: 'course',
                description: 'Watch sections 1-3 of the React course and submit the certificate or screenshot.'
            },
            {
                title: 'Two Sum',
                type: 'leetcode',
                description: 'Solve "Two Sum" on LeetCode. Array, Hash Table.',
                day: 1
            },
            {
                title: 'Update Portfolio Repo',
                type: 'daily',
                description: 'Commit at least one update to your Github portfolio.'
            },
            {
                title: 'Build Weather App MVP',
                type: 'project',
                description: 'Initialize responsive weather app using public API.'
            }
        ]);

        console.log('Database Seeded Successfully!');
        console.log('\n--- Test Credentials ---');
        console.log('Admin: admin@devtrack.com / password123');
        console.log('User:  student@devtrack.com / password123');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDB();
