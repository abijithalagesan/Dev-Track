import React from 'react';
import Leaderboard from './components/Leaderboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center py-12 px-4 selection:bg-purple-500/30">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                DevTrack Demo
            </h1>
            <p className="text-gray-400 mt-2">Advanced Productivity Features (React API Integration)</p>
        </header>

        <Leaderboard />
    </div>
  );
}

export default App;
