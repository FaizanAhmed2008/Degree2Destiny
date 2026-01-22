import React from 'react';
import { TestQuestion } from '@/types';

interface AptitudeQuestionProps {
  question: TestQuestion;
  selectedOption: number | undefined;
  onSelectOption: (optionIndex: number) => void;
  disabled?: boolean;
}

export const AptitudeQuestion: React.FC<AptitudeQuestionProps> = ({
  question,
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {question.question}
        </h3>
        <div className="flex space-x-2">
          <span className="text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
            {question.difficulty}
          </span>
          <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded">
            {question.weight} marks
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <label
            key={index}
            className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={index}
              checked={selectedOption === index}
              onChange={() => onSelectOption(index)}
              disabled={disabled}
              className="mt-1"
            />
            <span className="text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
