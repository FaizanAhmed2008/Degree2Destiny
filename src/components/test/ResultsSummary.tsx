import React from 'react';
import { TestResult } from '@/types';

interface ResultsSummaryProps {
  result: TestResult;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result }) => {
  const getPassFailColor = () => {
    return result.passed
      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  };

  const getPassFailTextColor = () => {
    return result.passed
      ? 'text-green-800 dark:text-green-200'
      : 'text-red-800 dark:text-red-200';
  };

  const getScoreColor = () => {
    if (result.percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (result.percentage >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Overall Result Card */}
      <div
        className={`p-6 border rounded-lg ${getPassFailColor()}`}
      >
        <div className="text-center">
          <h2 className={`text-3xl font-bold mb-2 ${getPassFailTextColor()}`}>
            {result.passed ? '✓ PASSED' : '✗ FAILED'}
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {result.passed
              ? 'Congratulations! You have successfully passed this test.'
              : `You need ${result.testType === 'MCQ' ? '40' : result.testType === 'APTITUDE' ? '30' : '30'} marks to pass.`}
          </p>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Score Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Total Score */}
          <div className="col-span-2 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Score
            </div>
            <div className={`text-4xl font-bold ${getScoreColor()}`}>
              {result.totalScore}/{result.totalMarks}
            </div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
              Percentage: <span className={getScoreColor()}>{result.percentage}%</span>
            </div>
          </div>

          {/* Category Scores */}
          {result.mcqScore !== undefined && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Technical (MCQ)
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {result.mcqScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                40 marks
              </div>
            </div>
          )}

          {result.aptitudeScore !== undefined && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Aptitude
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {result.aptitudeScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                30 marks
              </div>
            </div>
          )}

          {result.communicationScore !== undefined && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Communication
              </div>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {result.communicationScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                30 marks
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Info */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
          Test Information
        </h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Test Type:</span>
            <span className="font-medium">{result.testType}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Questions:</span>
            <span className="font-medium">{result.detailedResults.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Correct Answers:</span>
            <span className="font-medium">
              {result.detailedResults.filter((a) => a.isCorrect).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Submitted At:</span>
            <span className="font-medium">
              {new Date(result.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
