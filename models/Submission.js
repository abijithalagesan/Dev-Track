const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Task'
    },
    proof: {
        type: String, // Can be a URL (Github/Image) or Text explanation
        required: [true, 'Please provide proof of completion']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    feedback: {
        type: String // Admin comments when approving/rejecting
    },
    githubValidation: {
        status: {
            type: String,
            enum: ['none', 'pending', 'valid', 'invalid', 'empty'],
            default: 'none'
        },
        repoDetails: {
            stars: Number,
            lastCommit: Date,
            message: String
        }
    },
    leetcodeValidation: {
        status: {
            type: String,
            enum: ['none', 'pending', 'valid', 'invalid'],
            default: 'none'
        },
        details: {
            message: String
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
