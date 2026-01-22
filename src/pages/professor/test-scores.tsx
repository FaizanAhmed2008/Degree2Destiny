import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getAllTests,
  getTestResultsByTest,
  calculateTestStatistics,
} from '@/services/testService';
import { Test, TestResult, TestStatistics } from '@/types';

const ProfessorTestScoresPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tests
  useEffect(() => {
    const loadTests = async () => {
      try {
        const loadedTests = await getAllTests();
        setTests(loadedTests);
        if (loadedTests.length > 0) {
          setSelectedTest(loadedTests[0]);
        }
      } catch (err) {
        console.error('Error loading tests:', err);
        setError('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  // Load results when test is selected
  useEffect(() => {
    const loadResults = async () => {
      if (!selectedTest) return;

      try {
        const [loadedResults, stats] = await Promise.all([
          getTestResultsByTest(selectedTest.id),
          calculateTestStatistics(selectedTest.id),
        ]);

        setResults(loadedResults);
        setStatistics(stats);
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load results');
      }
    };

    loadResults();
  }, [selectedTest]);

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 80) return 'text-green-600 dark:text-green-400';
    if (passRate >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return 'text-red-600 dark:text-red-400'; // Hard
    if (difficulty >= 40) return 'text-orange-600 dark:text-orange-400'; // Medium
    return 'text-green-600 dark:text-green-400'; // Easy
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="professor">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading test data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="professor">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Test Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View detailed test scores and student performance analysis
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Test Selection */}
          <div className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Select Test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={`p-4 rounded-lg border-2 transition text-left ${
                    selectedTest?.id === test.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {test.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {test.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {test.duration} mins • {test.questions.length} questions
                  </p>
                </button>
              ))}
            </div>
          </div>

          {selectedTest && statistics && (
            <>
              {/* Statistics Overview */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Attempts
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">
                    {statistics.totalAttempts}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pass Rate
                  </div>
                  <div className={`text-3xl font-bold ${getPassRateColor(statistics.passRate)}`}>
                    {statistics.passRate}%
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average Score
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(statistics.averageScore)}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Highest Score
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {statistics.highestScore}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Lowest Score
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {statistics.lowestScore}
                  </div>
                </div>
              </div>

              {/* Question Difficulty Analysis */}
              <div className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Question Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Question
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Correct
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Success Rate
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Difficulty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.questionAnalysis.map((qa, index) => {
                        const successRate =
                          qa.totalAttempts > 0
                            ? Math.round((qa.correctCount / qa.totalAttempts) * 100)
                            : 0;
                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              Q{index + 1}: {qa.question.substring(0, 50)}...
                            </td>
                            <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">
                              {qa.correctCount}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">
                              {qa.totalAttempts}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {successRate}%
                              </span>
                            </td>
                            <td className={`text-center py-3 px-4 font-medium ${getDifficultyColor(qa.difficulty)}`}>
                              {qa.difficulty}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Results */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Student Results
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Student ID
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Score
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Percentage
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length > 0 ? (
                        results.map((result, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              {result.studentId.substring(0, 12)}...
                            </td>
                            <td className="text-center py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                              {result.totalScore}/{result.totalMarks}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span
                                className={`font-semibold ${
                                  result.percentage >= 70
                                    ? 'text-green-600 dark:text-green-400'
                                    : result.percentage >= 50
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {result.percentage}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  result.passed
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                }`}
                              >
                                {result.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                              {new Date(result.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No results found for this test
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorTestScoresPage;
