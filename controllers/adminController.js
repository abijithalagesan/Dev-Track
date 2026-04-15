const User = require('../models/User');
const Task = require('../models/Task');
const Submission = require('../models/Submission');

// @desc    Get all stats (users, tasks, submissions)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalTasksCompleted = await Submission.countDocuments({ status: 'approved' });
        const pendingApprovals = await Submission.countDocuments({ status: 'pending' });

        res.status(200).json({ totalUsers, totalTasksCompleted, pendingApprovals });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new task
// @route   POST /api/admin/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
    try {
        const { title, type, description, deadline, day, assignedTo } = req.body;

        const task = await Task.create({
            title, type, description, deadline, day, assignedTo
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all submissions with filters
// @route   GET /api/admin/submissions
// @access  Private/Admin
const getAllSubmissions = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const submissions = await Submission.find(query)
            .populate('user', 'name email')
            .populate('task', 'title type')
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject submission
// @route   PUT /api/admin/submissions/:id
// @access  Private/Admin
const updateSubmissionStatus = async (req, res) => {
    try {
        const { status, feedback } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = status;
        if (feedback) submission.feedback = feedback;

        await submission.save();

        // Increment streak if approved and logic applies
        if (status === 'approved') {
            const user = await User.findById(submission.user);
            user.streak = (user.streak || 0) + 1;
            await user.save();
        }

        res.status(200).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance for a specific date
// @route   GET /api/admin/attendance
// @access  Private/Admin
const getAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const Attendance = require('../models/Attendance');
        const records = await Attendance.find({ date }).populate('user', 'name email');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark attendance for multiple users
// @route   POST /api/admin/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
    try {
        const { date, records } = req.body;

        if (!date || !records) {
            return res.status(400).json({ message: 'Date and records are required' });
        }

        const Attendance = require('../models/Attendance');
        const bulkOps = records.map(record => ({
            updateOne: {
                filter: { user: record.userId, date: date },
                update: {
                    status: record.status,
                    markedBy: req.user._id
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(bulkOps);

        res.status(200).json({ message: 'Attendance saved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new student by admin
// @route   POST /api/admin/users
// @access  Private/Admin
const createStudent = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'user'
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStats, createTask, getAllSubmissions, updateSubmissionStatus, getAllUsers, getAttendance, markAttendance, createStudent };
