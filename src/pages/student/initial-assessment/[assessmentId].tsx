import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Navbar from "../../../components/Navbar";
import {
  submitInitialAssessment,
  INITIAL_ASSESSMENT_QUESTIONS,
} from "../../../services/initialAssessmentService";
import { getTechnicalQuestionsForRole } from "../../../services/roleBasedQuestionsService";
import { getStudentProfile } from "../../../services/studentService";

const InitialAssessmentPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { assessmentId } = router.query;

  // FIXED: Changed from 3 tabs to 3 sequential sections with enforcement
  const [currentSection, setCurrentSection] = useState<
    "aptitude" | "technical" | "communication"
  >("aptitude");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentRole, setStudentRole] = useState("");
  const [technicalQuestions, setTechnicalQuestions] = useState<any[]>([]);

  // Answers storage - FIXED: Changed from logic to technical
  const [aptitudeAnswers, setAptitudeAnswers] = useState<(number | null)[]>(
    new Array(INITIAL_ASSESSMENT_QUESTIONS.aptitude.length).fill(null),
  );
  const [technicalAnswers, setTechnicalAnswers] = useState<(number | null)[]>(
    [],
  );
  const [communicationAnswers, setCommunicationAnswers] = useState<string[]>(
    new Array(INITIAL_ASSESSMENT_QUESTIONS.communication.length).fill(""),
  );

  useEffect(() => {
    // CRITICAL FIX: Only proceed when router is ready
    if (!router.isReady) return;
    if (!currentUser || !assessmentId) return;

    // Load student profile to get role
    const loadStudentRole = async () => {
      try {
        const profile = await getStudentProfile(currentUser.uid);
        if (
          profile &&
          profile.preferredRoles &&
          profile.preferredRoles.length > 0
        ) {
          const role = profile.preferredRoles[0];
          setStudentRole(role);
          const techQuestions = getTechnicalQuestionsForRole(role);
          setTechnicalQuestions(techQuestions);
          setTechnicalAnswers(new Array(techQuestions.length).fill(null));
        }
      } catch (err) {
        console.error("Error loading student role:", err);
      }
      setLoading(false);
    };

    loadStudentRole();
  }, [router.isReady, currentUser, assessmentId]);

  const handleAptitudeSelect = (optionIdx: number) => {
    const newAnswers = [...aptitudeAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAptitudeAnswers(newAnswers);
  };

  const handleTechnicalSelect = (optionIdx: number) => {
    const newAnswers = [...technicalAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setTechnicalAnswers(newAnswers);
  };

  const handleCommunicationChange = (text: string) => {
    const newAnswers = [...communicationAnswers];
    newAnswers[currentQuestionIdx] = text;
    setCommunicationAnswers(newAnswers);
  };

  // Check if current section is complete (FIXED: Mandatory section enforcement)
  const isSectionComplete = (): boolean => {
    if (currentSection === "aptitude") {
      return aptitudeAnswers.every((ans) => ans !== null);
    } else if (currentSection === "technical") {
      return technicalAnswers.every((ans) => ans !== null);
    } else {
      return communicationAnswers.every((ans) => ans.length >= 50);
    }
  };

  // Move to next section (FIXED: Sequence enforcement)
  const handleNextSection = () => {
    if (!isSectionComplete()) {
      setError(
        `Please answer all questions in the ${currentSection} section before proceeding.`,
      );
      return;
    }
    setError(null);

    if (currentSection === "aptitude") {
      setCurrentSection("technical");
    } else if (currentSection === "technical") {
      setCurrentSection("communication");
    }
    setCurrentQuestionIdx(0);
  };

  // Move to previous section (FIXED: Sequence enforcement)
  const handlePreviousSection = () => {
    if (currentSection === "communication") {
      setCurrentSection("technical");
    } else if (currentSection === "technical") {
      setCurrentSection("aptitude");
    }
    setCurrentQuestionIdx(0);
  };

  // Navigate within section
  const handleNext = () => {
    let maxQuestions = 0;
    if (currentSection === "aptitude")
      maxQuestions = INITIAL_ASSESSMENT_QUESTIONS.aptitude.length;
    else if (currentSection === "technical")
      maxQuestions = technicalQuestions.length;
    else maxQuestions = INITIAL_ASSESSMENT_QUESTIONS.communication.length;

    if (currentQuestionIdx < maxQuestions - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  // Check if current question is answered
  const isAnswered = (): boolean => {
    if (currentSection === "aptitude") {
      return aptitudeAnswers[currentQuestionIdx] !== null;
    } else if (currentSection === "technical") {
      return technicalAnswers[currentQuestionIdx] !== null;
    } else {
      return communicationAnswers[currentQuestionIdx].length >= 50;
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !assessmentId) return;

    // FIXED: Validate all sections complete before submit
    if (
      !aptitudeAnswers.every((ans) => ans !== null) ||
      !technicalAnswers.every((ans) => ans !== null) ||
      !communicationAnswers.every((ans) => ans.length >= 50)
    ) {
      setError("Please complete all sections before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // FIXED: Submit with technical section
      await submitInitialAssessment(currentUser.uid, assessmentId as string, {
        aptitude: aptitudeAnswers,
        technical: technicalAnswers,
        communication: communicationAnswers,
      });

      setCompleted(true);
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
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

  // Get current question
  let question: any = null;
  let totalQ = 0;

  if (currentSection === "aptitude") {
    question = INITIAL_ASSESSMENT_QUESTIONS.aptitude[currentQuestionIdx];
    totalQ = INITIAL_ASSESSMENT_QUESTIONS.aptitude.length;
  } else if (currentSection === "technical") {
    question = technicalQuestions[currentQuestionIdx];
    totalQ = technicalQuestions.length;
  } else {
    question = INITIAL_ASSESSMENT_QUESTIONS.communication[currentQuestionIdx];
    totalQ = INITIAL_ASSESSMENT_QUESTIONS.communication.length;
  }

  const sectionTitles = {
    aptitude: "📐 Aptitude",
    technical: `💻 Technical (${studentRole})`,
    communication: "💬 Communication",
  };

  const sectionProgress = {
    aptitude:
      (aptitudeAnswers.filter((a) => a !== null).length /
        INITIAL_ASSESSMENT_QUESTIONS.aptitude.length) *
      100,
    technical:
      technicalQuestions.length > 0
        ? (technicalAnswers.filter((a) => a !== null).length /
            technicalQuestions.length) *
          100
        : 0,
    communication:
      (communicationAnswers.filter((a) => a.length >= 50).length /
        INITIAL_ASSESSMENT_QUESTIONS.communication.length) *
      100,
  };

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
              This assessment evaluates your aptitude, technical knowledge, and
              communication skills.
            </p>
          </div>

          {/* Section Navigation - FIXED: Sequential instead of free tabs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(["aptitude", "technical", "communication"] as const).map(
              (section) => (
                <div
                  key={section}
                  className={`p-4 rounded-lg text-center transition-all ${
                    currentSection === section
                      ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400"
                      : section === "aptitude" ||
                          (section === "technical" && isSectionComplete()) ||
                          (section === "communication" &&
                            technicalAnswers.every((a) => a !== null))
                        ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-50"
                  }`}
                >
                  <div className="font-semibold mb-2">
                    {sectionTitles[section]}
                  </div>
                  <div className="text-sm">
                    {section === "aptitude" &&
                      `${aptitudeAnswers.filter((a) => a !== null).length}/${INITIAL_ASSESSMENT_QUESTIONS.aptitude.length}`}
                    {section === "technical" &&
                      `${technicalAnswers.filter((a) => a !== null).length}/${technicalQuestions.length}`}
                    {section === "communication" &&
                      `${communicationAnswers.filter((a) => a.length >= 50).length}/${INITIAL_ASSESSMENT_QUESTIONS.communication.length}`}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Question {currentQuestionIdx + 1} of {totalQ}
              </h2>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIdx + 1) / totalQ) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <p className="text-lg text-gray-800 dark:text-gray-200 mb-6 font-medium">
              {question?.question}
            </p>

            {question?.scenario && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 mb-6 rounded">
                <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold">
                  Scenario:
                </p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  {question.scenario}
                </p>
              </div>
            )}

            {/* Answer Section */}
            {currentSection === "communication" ? (
              <>
                <textarea
                  value={communicationAnswers[currentQuestionIdx]}
                  onChange={(e) => handleCommunicationChange(e.target.value)}
                  placeholder="Type your answer here (minimum 50 characters)..."
                  className="w-full min-h-32 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-600 dark:bg-gray-700 dark:text-white resize-none"
                />
                <p
                  className={`text-sm mt-2 ${communicationAnswers[currentQuestionIdx].length >= 50 ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {communicationAnswers[currentQuestionIdx].length}/50+
                  characters
                </p>
              </>
            ) : (
              <div className="space-y-3">
                {question?.options?.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (currentSection === "aptitude")
                        handleAptitudeSelect(idx);
                      else handleTechnicalSelect(idx);
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                      (currentSection === "aptitude"
                        ? aptitudeAnswers
                        : technicalAnswers)[currentQuestionIdx] === idx
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:border-indigo-400"
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
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handlePreviousSection}
              disabled={currentSection === "aptitude"}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              ← Previous Section
            </button>

            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIdx === 0}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
              >
                ← Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIdx === totalQ - 1 || !isAnswered()}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
              >
                Next →
              </button>
            </div>

            {currentSection === "communication" &&
            currentQuestionIdx === totalQ - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !isSectionComplete()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
              >
                {submitting ? "Submitting..." : "✓ Submit Assessment"}
              </button>
            ) : (
              <button
                onClick={handleNextSection}
                disabled={!isSectionComplete()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
              >
                Next Section →
              </button>
            )}
          </div>

          {/* Progress Summary */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {(["aptitude", "technical", "communication"] as const).map(
              (section) => (
                <div
                  key={section}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center"
                >
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {sectionTitles[section]}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${sectionProgress[section]}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {section === "aptitude" &&
                      `${aptitudeAnswers.filter((a) => a !== null).length}/${INITIAL_ASSESSMENT_QUESTIONS.aptitude.length}`}
                    {section === "technical" &&
                      `${technicalAnswers.filter((a) => a !== null).length}/${technicalQuestions.length}`}
                    {section === "communication" &&
                      `${communicationAnswers.filter((a) => a.length >= 50).length}/${INITIAL_ASSESSMENT_QUESTIONS.communication.length}`}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InitialAssessmentPage;
