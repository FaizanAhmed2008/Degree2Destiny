import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TestHeader } from "@/components/test/TestHeader";
import { MCQQuestion } from "@/components/test/MCQQuestion";
import { AptitudeQuestion } from "@/components/test/AptitudeQuestion";
import { CommunicationQuestion } from "@/components/test/CommunicationQuestion";
import {
  getTestById,
  startTestAttempt,
  saveAnswer,
  submitTestAttempt,
  getTestAttempt,
} from "@/services/testService";
import { Test, StudentTestAttempt, StudentAnswer, TestQuestion } from "@/types";

const TestPage: React.FC = () => {
  const router = useRouter();
  const { testId } = router.query;
  const { currentUser } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<StudentTestAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load test and existing attempt
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!testId || !currentUser) return;

        const loadedTest = await getTestById(testId as string);
        if (!loadedTest) {
          setError("Test not found");
          return;
        }

        setTest(loadedTest);

        // Try to resume existing attempt
        const attemptId = `${currentUser.uid}_${testId}_*`;
        // Note: In production, you'd need to query for incomplete attempts properly
        // For now, we'll create a new attempt
        const newAttempt = await startTestAttempt(
          currentUser.uid,
          testId as string,
          loadedTest,
        );
        setAttempt(newAttempt);
        setCurrentQuestionIndex(0); // Reset to first question
      } catch (err) {
        console.error("Error loading test:", err);
        setError("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    // CRITICAL FIX: Only load when router is ready AND testId is available
    if (!router.isReady) return; // Don't load until router ready
    if (!testId || !currentUser) {
      setLoading(false);
      return;
    }

    loadTest();
  }, [router.isReady, testId, currentUser]); // Include router.isReady in deps

  const handleSelectOption = async (optionIndex: number) => {
    if (!attempt || !test) return;

    const question = test.questions[currentQuestionIndex];
    const answer: StudentAnswer = {
      questionId: question.id,
      questionNumber: question.questionNumber,
      questionText: question.question,
      type: test.type,
      selectedOption: optionIndex,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(attempt.id, answer);
      setAttempt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: [
            ...prev.answers.filter((a) => a.questionId !== question.id),
            answer,
          ],
        };
      });
    } catch (err) {
      console.error("Error saving answer:", err);
      setError("Failed to save answer");
    }
  };

  const handleUpdateAnswer = async (writtenAnswer: string) => {
    if (!attempt || !test) return;

    const question = test.questions[currentQuestionIndex];
    const answer: StudentAnswer = {
      questionId: question.id,
      questionNumber: question.questionNumber,
      questionText: question.question,
      type: test.type,
      writtenAnswer,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(attempt.id, answer);
      setAttempt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: [
            ...prev.answers.filter((a) => a.questionId !== question.id),
            answer,
          ],
        };
      });
    } catch (err) {
      console.error("Error saving answer:", err);
      setError("Failed to save answer");
    }
  };

  const handleNext = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !test) return;

    if (
      !window.confirm(
        "Are you sure you want to submit the test? This cannot be undone.",
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitTestAttempt(attempt.id, test);
      router.push(`/student/test-results/${result.id}`);
    } catch (err) {
      console.error("Error submitting test:", err);
      setError("Failed to submit test");
      setSubmitting(false);
    }
  };

  const handleTimeUp = async () => {
    if (attempt && test) {
      await submitTestAttempt(attempt.id, test);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading test...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !test || !attempt) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              Error
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {error || "Failed to load test"}
            </p>
            <button
              onClick={() => router.push("/student/dashboard")}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = attempt.answers.find(
    (a) => a.questionId === currentQuestion.id,
  );

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TestHeader
          testTitle={test.title}
          duration={test.duration}
          totalQuestions={test.questions.length}
          currentQuestion={currentQuestionIndex + 1}
          onTimeUp={handleTimeUp}
        />

        <div className="max-w-4xl mx-auto p-4">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Question Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-8 mb-6">
            {test.type === "MCQ" && (
              <MCQQuestion
                question={currentQuestion}
                selectedOption={currentAnswer?.selectedOption}
                onSelectOption={handleSelectOption}
              />
            )}

            {test.type === "APTITUDE" && (
              <AptitudeQuestion
                question={currentQuestion}
                selectedOption={currentAnswer?.selectedOption}
                onSelectOption={handleSelectOption}
              />
            )}

            {test.type === "COMMUNICATION" && (
              <CommunicationQuestion
                question={currentQuestion}
                writtenAnswer={currentAnswer?.writtenAnswer}
                onUpdateAnswer={handleUpdateAnswer}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ← Previous
            </button>

            <div className="flex-1 text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {test.questions.length}
                </span>
              </div>
            </div>

            {currentQuestionIndex === test.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
              >
                Next →
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
              Question Navigator
            </h4>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {test.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`p-2 rounded font-medium text-sm transition ${
                    index === currentQuestionIndex
                      ? "bg-blue-500 text-white"
                      : attempt.answers.some(
                            (a) => a.questionNumber === index + 1,
                          )
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <span>Not Answered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TestPage;
