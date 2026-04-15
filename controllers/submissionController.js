const Submission = require('../models/Submission');
const Task = require('../models/Task');

// @desc    Submit proof for a task
// @route   POST /api/submissions
// @access  Private
const submitTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        let proof = req.body.proof;

        if (req.file) {
            // If an image was uploaded, store its path as the proof
            proof = `/uploads/${req.file.filename}`;
        }

        if (!taskId || !proof) {
            return res.status(400).json({ message: 'Please provide task and proof' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const existing = await Submission.findOne({ user: req.user._id, task: taskId });
        if (existing && existing.status !== 'rejected') {
            return res.status(400).json({ message: 'Task already submitted' });
        }

        let status = 'pending';
        let feedback = '';
        let githubValidation = { status: 'none' };
        let leetcodeValidation = { status: 'none' };
        
        if (proof && proof.includes('github.com')) {
            const validateGithubRepo = require('../utils/githubValidator');
            githubValidation = await validateGithubRepo(proof);
            
            if (githubValidation.status === 'invalid' || githubValidation.status === 'empty') {
                return res.status(400).json({ message: `GitHub Validation Failed: ${githubValidation.message}` });
            }
            
            if (githubValidation.status === 'valid') {
                status = 'approved';
                feedback = 'Automatically approved via GitHub API validation.';
            }
        } else if (proof && proof.includes('leetcode.com')) {
            const validateLeetcodeUrl = require('../utils/leetcodeValidator');
            leetcodeValidation = await validateLeetcodeUrl(proof);
            
            if (leetcodeValidation.status === 'invalid') {
                return res.status(400).json({ message: `LeetCode Validation Failed: ${leetcodeValidation.message}` });
            }
            
            if (leetcodeValidation.status === 'valid') {
                status = 'approved';
                feedback = 'Automatically approved via LeetCode link validation.';
            }
        }

        const submission = await Submission.create({
            user: req.user._id,
            task: taskId,
            proof,
            status,
            feedback,
            githubValidation,
            leetcodeValidation
        });

        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
        if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

        if (!lastActivity) {
            user.streak = 1;
        } else {
            const diffTime = Math.abs(today - lastActivity);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                user.streak += 1; 
            } else if (diffDays > 1) {
                user.streak = 1; 
            }
        }

        if (user.streak > user.longestStreak) {
            user.longestStreak = user.streak;
        }

        user.lastActivityDate = new Date();
        await user.save();

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's submissions
// @route   GET /api/submissions/me
// @access  Private
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.user._id }).populate('task');
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitTask, getMySubmissions };
