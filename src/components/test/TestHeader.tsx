import React, { useEffect, useState } from 'react';

interface TestHeaderProps {
  testTitle: string;
  duration: number; // in minutes
  totalQuestions: number;
  currentQuestion: number;
  onTimeUp?: () => void;
}

export const TestHeader: React.FC<TestHeaderProps> = ({
  testTitle,
  duration,
  totalQuestions,
  currentQuestion,
  onTimeUp,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining < 300; // Less than 5 minutes
  const isWarningTime = timeRemaining < 60; // Less than 1 minute

  const getTimeColor = () => {
    if (isWarningTime) return 'text-red-600 dark:text-red-400';
    if (isLowTime) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressPercentage = (current: number) => {
    return Math.round((current / totalQuestions) * 100);
  };

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm p-4 z-10">
      <div className="max-w-4xl mx-auto">
        {/* Title and Timer */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {testTitle}
          </h1>
          <div className={`text-center ${getTimeColor()}`}>
            <div className="text-2xl font-bold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs font-medium">Time Remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {getProgressPercentage(currentQuestion)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage(currentQuestion)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
