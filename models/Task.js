const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    type: {
        type: String,
        enum: ['daily', 'leetcode', 'project', 'course'],
        required: [true, 'Please specify the task type']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    deadline: {
        type: Date
    },
    day: {
        type: Number, // Applicable for LeetCode 30-day challenge (1-30)
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
