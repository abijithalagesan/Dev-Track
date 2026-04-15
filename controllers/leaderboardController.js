const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.aggregate([
            { $match: { role: 'user' } },
            { 
                $project: { 
                    name: 1, 
                    streak: 1, 
                    longestStreak: 1,
                    totalTasksCompleted: 1 
                } 
            },
            { $sort: { totalTasksCompleted: -1, streak: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
