import React from 'react';
import { TestQuestion } from '@/types';

interface CommunicationQuestionProps {
  question: TestQuestion;
  writtenAnswer: string | undefined;
  onUpdateAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const CommunicationQuestion: React.FC<CommunicationQuestionProps> = ({
  question,
  writtenAnswer,
  onUpdateAnswer,
  disabled = false,
}) => {
  const characterCount = (writtenAnswer || '').length;
  const minLength = question.minLength || 50;
  const isMinimumMet = characterCount >= minLength;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {question.question}
        </h3>
        <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded">
          {question.weight} marks
        </span>
      </div>

      {question.scenario && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Scenario:
          </p>
          <p className="text-gray-700 dark:text-gray-300">{question.scenario}</p>
        </div>
      )}

      <textarea
        value={writtenAnswer || ''}
        onChange={(e) => onUpdateAnswer(e.target.value)}
        disabled={disabled}
        placeholder={`Write your answer here (minimum ${minLength} characters)...`}
        className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            isMinimumMet
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {characterCount}/{minLength} characters
        </span>
        {isMinimumMet && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ Minimum requirement met
          </span>
        )}
      </div>
    </div>
  );
};
