import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    initialTime: number; // in seconds
    onTimeout: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialTime, onTimeout }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeout();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeout]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
        </div>
    );
};

export default CountdownTimer;
