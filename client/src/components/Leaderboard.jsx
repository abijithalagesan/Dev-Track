import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal } from 'lucide-react';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/users/leaderboard');
                setLeaders(res.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return <div className="text-center text-gray-400 py-8">Loading Leaderboard...</div>;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden w-full max-w-md mx-auto mt-8 shadow-2xl">
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-center">
                <Trophy className="text-yellow-500 mr-2" size={24} />
                <h2 className="text-xl font-bold text-white">Top DevTrack Students</h2>
            </div>
            
            <div className="divide-y divide-gray-700/50">
                {leaders.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">No students on the board yet!</div>
                ) : leaders.map((user, index) => (
                    <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition">
                        <div className="flex items-center">
                            <span className="w-8 text-center font-bold text-gray-400 mr-4">
                                {index === 0 ? <Medal className="inline text-yellow-500" size={24} /> : 
                                 index === 1 ? <Medal className="inline text-gray-300" size={24} /> :
                                 index === 2 ? <Medal className="inline text-amber-600" size={24} /> : 
                                 `#${index + 1}`}
                            </span>
                            <div>
                                <h4 className="font-semibold text-gray-200">{user.name}</h4>
                                <p className="text-xs text-gray-500">{user.totalTasksCompleted} completed tasks</p>
                            </div>
                        </div>
                        <div className="text-right flex items-center bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                            <span className="text-orange-400 font-bold mr-1">{user.streak}</span>
                            <span className="text-xs">🔥</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
