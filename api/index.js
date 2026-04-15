const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('../config/db');
const path = require('path');

// Load env vars
dotenv.config();

const User = require('../models/User');
const Task = require('../models/Task');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// DB readiness check for serverless
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api')) {
        return res.status(503).json({ success: false, message: 'Database connecting or unavailable. Please try again in a moment.' });
    }
    next();
});

// Serve static frontend files
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Mount routers
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/tasks', require('../routes/taskRoutes'));
app.use('/api/submissions', require('../routes/submissionRoutes'));
app.use('/api/admin', require('../routes/adminRoutes'));
app.use('/api/users', require('../routes/userRoutes'));

// Serve React App for any other routes (Production only)

const PORT = process.env.PORT || 5000;

// Connect to database and seed if in-memory
connectDB().then(async (isMemoryDB) => {
    if (isMemoryDB) {
        console.log('Seeding in-memory database with test data...');
        await User.create({ name: 'Super Admin', email: 'admin@devtrack.com', password: 'password123', role: 'admin' });
        await User.create({ name: 'Student User', email: 'student@devtrack.com', password: 'password123', role: 'user' });
        await Task.insertMany([
            { title: 'Complete React Fundamentals Module', type: 'course', description: 'Watch sections 1-3 of the React course and submit the certificate or screenshot.' },
            { title: 'Two Sum', type: 'leetcode', description: 'Solve "Two Sum" on LeetCode. Array, Hash Table.', day: 1 },
            { title: 'Update Portfolio Repo', type: 'daily', description: 'Commit at least one update to your Github portfolio.' },
            { title: 'Build Weather App MVP', type: 'project', description: 'Initialize responsive weather app using public API.' }
        ]);
        console.log('Test data seeded.');
    }

    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Database connection process failed to initialize:', err);
});

module.exports = app;
