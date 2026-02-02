import React from 'react';

const CurrentStreakCard = () => {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-md">
            <div className="flex items-center">
                <div className="bg-light-blue-500 rounded-full p-2">
                    {/* Icon goes here */}
                    <span>🎯</span> {/* Placeholder for the target icon */}
                </div>
                <div className="ml-2">
                    <h2 className="font-bold text-dark">Current Streak</h2>
                    <p className="text-muted">10,000 steps</p>
                </div>
            </div>
            <div className="mt-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">12</h1>
                <p className="text-dark">days</p>
            </div>
        </div>
    );
};

export default CurrentStreakCard;