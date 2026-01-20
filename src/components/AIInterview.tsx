// AI Interview Component
import React, { useState, useEffect, useRef } from 'react';
import { SkillLevel, InterviewEvaluation } from '../types';

interface AIInterviewProps {
  skillName: string;
  skillLevel: SkillLevel;
  onComplete: (evaluation: InterviewEvaluation, transcript: any[]) => void;
  onCancel: () => void;
}

const AIInterview: React.FC<AIInterviewProps> = ({
  skillName,
  skillLevel,
  onComplete,
  onCancel,
}) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'interviewer' | 'student'; content: string; questionNumber?: number }>
  >([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState<string>('');
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize interview
  useEffect(() => {
    initializeInterview();
  }, []);

  const initializeInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interviews/ai-interview?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName, skillLevel }),
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentQuestion(data.firstQuestion);
      setMessages([
        {
          role: 'interviewer',
          content: data.firstQuestion,
          questionNumber: 1,
        },
      ]);
      setQuestionCount(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Please provide an answer');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Add user answer to messages
      setMessages((prev) => [
        ...prev,
        {
          role: 'student',
          content: userAnswer,
        },
      ]);

      // Send answer to API
      const response = await fetch('/api/interviews/ai-interview?action=answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answer: userAnswer,
        }),
      });

      if (!response.ok) throw new Error('Failed to process answer');

      const data = await response.json();

      if (data.isComplete) {
        // Interview complete
        setIsInterviewComplete(true);
        setEvaluation(data.evaluation);
        setMessages((prev) => [
          ...prev,
          {
            role: 'interviewer',
            content: data.evaluation.feedback,
          },
        ]);
      } else {
        // Add next question
        setMessages((prev) => [
          ...prev,
          {
            role: 'interviewer',
            content: data.nextQuestion,
            questionNumber: data.nextQuestion ? questionCount + 1 : undefined,
          },
        ]);
        setQuestionCount((prev) => prev + 1);
        setCurrentQuestion(data.nextQuestion);
      }

      setUserAnswer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (evaluation) {
      onComplete(evaluation, messages);
    }
  };

  const handleCancel = () => {
    if (sessionId) {
      fetch('/api/interviews/ai-interview?action=end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-900 px-6 py-4 text-white">
          <h2 className="text-2xl font-bold">
            {skillName} - Technical Interview
          </h2>
          <p className="text-indigo-100 mt-1">
            {isInterviewComplete
              ? 'Interview Complete - Review Your Results'
              : `Question ${questionCount} of 5`}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-gray-700">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'interviewer' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  msg.role === 'interviewer'
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {msg.questionNumber && (
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    Q{msg.questionNumber}
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {isInterviewComplete && evaluation && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-3">
                Interview Results
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 dark:text-green-200 font-semibold">
                    Overall Score:
                  </span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {evaluation.score}/100
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-green-800 dark:text-green-200 font-semibold">
                    Skill Level:
                  </span>
                  <span className="capitalize px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-semibold">
                    {evaluation.skillLevel}
                  </span>
                </div>

                <div>
                  <p className="text-green-800 dark:text-green-200 font-semibold mb-1">
                    Strengths:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {evaluation.strengths.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-green-700 dark:text-green-300"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-green-800 dark:text-green-200 font-semibold mb-1">
                    Areas for Improvement:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {evaluation.weaknesses.map((w: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-green-700 dark:text-green-300"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-green-800 dark:text-green-200 font-semibold mb-1">
                    Feedback:
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {evaluation.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Input Area */}
        {!isInterviewComplete ? (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && !loading) {
                  handleSubmitAnswer();
                }
              }}
              placeholder="Type your answer here... (Ctrl+Enter to submit)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              rows={3}
              disabled={loading}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmitAnswer}
                disabled={loading || !userAnswer.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Processing...' : 'Submit Answer'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700 flex gap-3">
            <button
              onClick={handleFinish}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save & Complete
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-medium"
            >
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterview;
