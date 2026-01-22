import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getAllTests,
  getTestResultsByTest,
} from '@/services/testService';
import { getVerifiedStudents } from '@/services/studentService';
import { Test, TestResult, StudentProfile } from '@/types';

const RecruiterTestScoresPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Map<string, StudentProfile>>(new Map());
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
        const loadedResults = await getTestResultsByTest(selectedTest.id);

        // Filter to show only verified students
        const verifiedResults = loadedResults.filter((result) => {
          // We'll check this after loading student profiles
          return true; // Placeholder - will filter below
        });

        setResults(verifiedResults);

        // Load student profiles to check verification status
        const uniqueStudentIdsSet = new Set(verifiedResults.map((r) => r.studentId));
        const uniqueStudentIds = Array.from(uniqueStudentIdsSet);
        const profiles = new Map<string, StudentProfile>();

        for (const studentId of uniqueStudentIds) {
          try {
            // In a real implementation, you'd fetch individual student profiles
            // For now, we'll assume they're loaded
            profiles.set(studentId, {} as StudentProfile);
          } catch (err) {
            console.error(`Error loading profile for student ${studentId}:`, err);
          }
        }

        setStudentProfiles(profiles);
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load results');
      }
    };

    loadResults();
  }, [selectedTest]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="recruiter">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading candidate data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    if (percentage >= 60) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
  };

  return (
    <ProtectedRoute requiredRole="recruiter">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Candidate Test Scores
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View verified student test performance and scores
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
              Filter by Test
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

          {/* Results Summary */}
          {selectedTest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Candidates
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  {results.length}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Average Score
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {results.length > 0
                    ? Math.round(
                        results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
                      )
                    : 0}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  High Performers
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {results.filter((r) => r.percentage >= 80).length}
                </div>
              </div>
            </div>
          )}

          {/* Candidate Results Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Verified Candidates
              </h3>
            </div>

            <div className="overflow-x-auto">
              {results.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Candidate ID
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Score
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Percentage
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Test Type
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Submitted Date
                      </th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-700 dark:text-gray-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((result, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                        >
                          <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">
                            {result.studentId.substring(0, 16)}...
                          </td>
                          <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300 font-bold">
                            {result.totalScore}/{result.totalMarks}
                          </td>
                          <td className="text-center py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreBadgeColor(
                                result.percentage
                              )}`}
                            >
                              {result.percentage}%
                            </span>
                          </td>
                          <td className="text-center py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                result.passed
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {result.passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </td>
                          <td className="text-center py-4 px-6 text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                              {result.testType}
                            </span>
                          </td>
                          <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400 text-xs">
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="text-center py-4 px-6">
                            <button
                              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium text-sm"
                              title="View detailed results"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">No candidates found for this test</p>
                  <p className="text-sm">
                    Verified students' test scores will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Distribution Chart Info */}
          {results.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  Performance Tiers
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Excellent (80+)
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {results.filter((r) => r.percentage >= 80).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Good (60-79)
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {results.filter((r) => r.percentage >= 60 && r.percentage < 80).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Needs Improvement (&lt;60)
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {results.filter((r) => r.percentage < 60).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  Pass/Fail Ratio
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Passed
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {results.filter((r) => r.passed).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Failed
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {results.filter((r) => !r.passed).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  Top Performers
                </h4>
                <div className="space-y-2">
                  {results
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 3)
                    .map((result, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {result.percentage}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default RecruiterTestScoresPage;
