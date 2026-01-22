import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import { submitInitialAssessment, INITIAL_ASSESSMENT_QUESTIONS } from '../../../services/initialAssessmentService';

const InitialAssessmentPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { assessmentId } = router.query;

  const [currentTab, setCurrentTab] = useState<'aptitude' | 'communication' | 'logic'>('aptitude');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Answers storage
  const [aptitudeAnswers, setAptitudeAnswers] = useState<(number | null)[]>(
    new Array(INITIAL_ASSESSMENT_QUESTIONS.aptitude.length).fill(null)
  );
  const [communicationAnswers, setCommunicationAnswers] = useState<string[]>(
    new Array(INITIAL_ASSESSMENT_QUESTIONS.communication.length).fill('')
  );
  const [logicAnswers, setLogicAnswers] = useState<(number | null)[]>(
    new Array(INITIAL_ASSESSMENT_QUESTIONS.logicalReasoning.length).fill(null)
  );

  useEffect(() => {
    if (!router.isReady || !currentUser || !assessmentId) return;
    setLoading(false);
  }, [router.isReady, currentUser, assessmentId]);

  const handleAptitudeSelect = (optionIdx: number) => {
    const newAnswers = [...aptitudeAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAptitudeAnswers(newAnswers);
  };

  const handleCommunicationChange = (text: string) => {
    const newAnswers = [...communicationAnswers];
    newAnswers[currentQuestionIdx] = text;
    setCommunicationAnswers(newAnswers);
  };

  const handleLogicSelect = (optionIdx: number) => {
    const newAnswers = [...logicAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setLogicAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!currentUser || !assessmentId) return;

    setSubmitting(true);
    try {
      await submitInitialAssessment(currentUser.uid, assessmentId as string, {
        aptitude: aptitudeAnswers,
        communication: communicationAnswers,
        logicalReasoning: logicAnswers,
      });

      setCompleted(true);
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!router.isReady || loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p>Loading assessment...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (completed) {
    return (
      <ProtectedRoute requiredRole="student">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-green-900">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
              Assessment Complete!
            </h1>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Your results have been saved. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getCurrentQuestion = () => {
    if (currentTab === 'aptitude') {
      return INITIAL_ASSESSMENT_QUESTIONS.aptitude[currentQuestionIdx];
    } else if (currentTab === 'communication') {
      return INITIAL_ASSESSMENT_QUESTIONS.communication[currentQuestionIdx];
    } else {
      return INITIAL_ASSESSMENT_QUESTIONS.logicalReasoning[currentQuestionIdx];
    }
  };

  const getCurrentAnswers = () => {
    if (currentTab === 'aptitude') return aptitudeAnswers;
    if (currentTab === 'communication') return communicationAnswers;
    return logicAnswers;
  };

  const getTotalQuestions = () => {
    if (currentTab === 'aptitude') return INITIAL_ASSESSMENT_QUESTIONS.aptitude.length;
    if (currentTab === 'communication') return INITIAL_ASSESSMENT_QUESTIONS.communication.length;
    return INITIAL_ASSESSMENT_QUESTIONS.logicalReasoning.length;
  };

  const question = getCurrentQuestion();
  const totalQ = getTotalQuestions();
  const answersArray = getCurrentAnswers();
  const isAnswered = currentTab === 'communication' 
    ? communicationAnswers[currentQuestionIdx]?.length > 0 
    : answersArray[currentQuestionIdx] !== null;

  return (
    <ProtectedRoute requiredRole="student">
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Initial Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This assessment helps us understand your current skills and level.
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['aptitude', 'communication', 'logic'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setCurrentTab(tab as any);
                  setCurrentQuestionIdx(0);
                }}
                className={`p-4 rounded-lg font-semibold transition-all ${
                  currentTab === tab
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'aptitude' && '📐 Aptitude'}
                {tab === 'communication' && '💬 Communication'}
                {tab === 'logic' && '🧠 Logic'}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Question {currentQuestionIdx + 1} of {totalQ}
              </h2>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / totalQ) * 100}%` }}
                ></div>
              </div>
            </div>

            <p className="text-lg text-gray-800 dark:text-gray-200 mb-6 font-medium">
              {question.question}
            </p>

            {(question as any).scenario && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mb-6 rounded">
                <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold">Scenario:</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">{(question as any).scenario}</p>
              </div>
            )}

            {/* Answer Section */}
            {currentTab === 'communication' ? (
              <textarea
                value={communicationAnswers[currentQuestionIdx]}
                onChange={(e) => handleCommunicationChange(e.target.value)}
                placeholder="Type your answer here (minimum 50 characters)..."
                className="w-full min-h-32 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            ) : (
              <div className="space-y-3">
                {(question as any).options?.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (currentTab === 'aptitude') handleAptitudeSelect(idx);
                      else handleLogicSelect(idx);
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                      (currentTab === 'aptitude' ? aptitudeAnswers : logicAnswers)[currentQuestionIdx] === idx
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <span className="inline-block w-6 h-6 rounded-full border-2 mr-3 text-center leading-4">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentTab === 'communication' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {communicationAnswers[currentQuestionIdx].length}/50+ characters
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              ← Previous
            </button>

            {currentQuestionIdx === totalQ - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
              >
                {submitting ? 'Submitting...' : '✓ Submit Assessment'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                disabled={!isAnswered}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
              >
                Next →
              </button>
            )}
          </div>

          {/* Progress Indicators */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['aptitude', 'communication', 'logic'].map((tab) => {
              const qs = tab === 'aptitude' ? aptitudeAnswers : tab === 'communication' ? communicationAnswers : logicAnswers;
              const answered = tab === 'communication' 
                ? qs.filter((a: any) => typeof a === 'string' && a.length > 0).length 
                : qs.filter((a: any) => a !== null).length;
              const total = tab === 'aptitude' ? INITIAL_ASSESSMENT_QUESTIONS.aptitude.length : tab === 'communication' ? INITIAL_ASSESSMENT_QUESTIONS.communication.length : INITIAL_ASSESSMENT_QUESTIONS.logicalReasoning.length;
              return (
                <div key={tab} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {tab === 'aptitude' && '📐 Aptitude'}
                    {tab === 'communication' && '💬 Communication'}
                    {tab === 'logic' && '🧠 Logic'}
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {answered}/{total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InitialAssessmentPage;
