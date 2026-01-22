import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getAllTests,
  getStudentTestResults,
} from '@/services/testService';
import { Test, TestResult } from '@/types';

const StudentTestsPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [tests, setTests] = useState<Test[]>([]);
  const [previousResults, setPreviousResults] = useState<Map<string, TestResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Load tests and previous results
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!currentUser) return;

        const [loadedTests, studentResults] = await Promise.all([
          getAllTests(),
          getStudentTestResults(currentUser.uid),
        ]);

        setTests(loadedTests);

        // Create a map of test results for quick lookup
        const resultsMap = new Map<string, TestResult>();
        studentResults.forEach((result) => {
          // Keep only the latest attempt for each test
          if (!resultsMap.has(result.testId) || 
              new Date(result.submittedAt) > new Date(resultsMap.get(result.testId)!.submittedAt)) {
            resultsMap.set(result.testId, result);
          }
        });

        setPreviousResults(resultsMap);
      } catch (err) {
        console.error('Error loading tests:', err);
        setError('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleStartTest = (testId: string) => {
    router.push(`/student/test/${testId}`);
  };

  const handleViewResults = (resultId: string) => {
    router.push(`/student/test-results/${resultId}`);
  };

  const filteredTests = filterType
    ? tests.filter((test) => test.type === filterType)
    : tests;

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading available tests...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Available Tests
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test your skills and get evaluated instantly
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All Tests
            </button>
            {['MCQ', 'APTITUDE', 'COMMUNICATION'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Tests Grid */}
          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredTests.map((test) => {
                const previousResult = previousResults.get(test.id);

                return (
                  <div
                    key={test.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {test.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {test.description}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Test Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                            Type
                          </div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {test.type}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                            Duration
                          </div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {test.duration} min
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                            Questions
                          </div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {test.questions.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                            Pass Score
                          </div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {test.passingScore}%
                          </div>
                        </div>
                      </div>

                      {/* Previous Result */}
                      {previousResult && (
                        <div className={`p-3 rounded-lg border ${
                          previousResult.passed
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                        }`}>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Your Previous Score
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${
                              previousResult.passed
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {previousResult.percentage}%
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              previousResult.passed
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                            }`}>
                              {previousResult.passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Instructions Preview */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                          Instructions
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-3">
                          {test.instructions}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        {previousResult ? 'Retake Test' : 'Start Test'}
                      </button>
                      {previousResult && (
                        <button
                          onClick={() => handleViewResults(previousResult.id)}
                          className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition"
                        >
                          View Result
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                No Tests Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for available tests
              </p>
            </div>
          )}

          {/* Test Tips */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Test Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex gap-3">
                <div className="text-2xl">⏱️</div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Manage Time
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the timer to keep track and pace yourself
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Read Carefully
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Read all options before selecting an answer
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">🔍</div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Review
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the question navigator to review answers
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Submit
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click submit when ready to see instant results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentTestsPage;
