import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ResultsSummary } from '@/components/test/ResultsSummary';
import { getTestResult } from '@/services/testService';
import { TestResult } from '@/types';

const TestResultsPage: React.FC = () => {
  const router = useRouter();
  const { resultId } = router.query;
  const { currentUser } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        if (!resultId) return;

        const loadedResult = await getTestResult(resultId as string);
        if (!loadedResult) {
          setError('Result not found');
          return;
        }

        // Verify user owns this result
        if (loadedResult.studentId !== currentUser?.uid) {
          setError('Unauthorized');
          return;
        }

        setResult(loadedResult);
      } catch (err) {
        console.error('Error loading result:', err);
        setError('Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    if (resultId && currentUser) {
      loadResult();
    }
  }, [resultId, currentUser]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading results...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !result) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
            <p className="text-gray-700 dark:text-gray-300">{error || 'Failed to load result'}</p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Test Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {result.testTitle}
            </p>
          </div>

          {/* Results Summary */}
          <ResultsSummary result={result} />

          {/* Detailed Answer Review */}
          <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
              Detailed Answer Review
            </h3>

            <div className="space-y-6">
              {result.detailedResults.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    answer.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                  }`}
                >
                  {/* Question */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        Question {answer.questionNumber}
                      </h4>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded ${
                          answer.isCorrect
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{answer.questionText}</p>
                  </div>

                  {/* Score */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Marks Obtained:{' '}
                      <span className="font-bold text-gray-800 dark:text-white">
                        {answer.marksObtained}/{answer.maxMarks}
                      </span>
                    </span>
                  </div>

                  {/* Student's Answer */}
                  {answer.type === 'MCQ' || answer.type === 'APTITUDE' ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your Answer:
                      </div>
                      <p className="p-2 bg-white dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                        {answer.selectedOption !== undefined
                          ? `Option ${String.fromCharCode(65 + answer.selectedOption)}`
                          : 'Not answered'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your Answer:
                      </div>
                      <p className="p-2 bg-white dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {answer.writtenAnswer || 'Not answered'}
                      </p>
                    </div>
                  )}

                  {/* Feedback */}
                  {answer.feedback && (
                    <div className="mt-4 p-3 bg-white dark:bg-gray-700/50 rounded text-sm">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Feedback:
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/student/tests')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Take Another Test
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TestResultsPage;
