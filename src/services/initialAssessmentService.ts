/**
 * Initial Assessment Service
 * Handles creation and management of mandatory initial assessments during student registration
 *
 * FIXED: Now includes role-based technical questions
 */

import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { StudentProfile, InitialAssessmentResult } from "../types";
import { getTechnicalQuestionsForRole } from "./roleBasedQuestionsService";

// Pre-defined initial assessment questions
export const INITIAL_ASSESSMENT_QUESTIONS = {
  aptitude: [
    {
      id: "apt_1",
      question: "What is the result of 15 × 8 ÷ 4 + 5?",
      options: ["35", "40", "45", "50"],
      correct: 1,
      difficulty: "easy",
    },
    {
      id: "apt_2",
      question:
        "If a train travels 60 km/h and needs to cover 180 km, how long will it take?",
      options: ["2 hours", "3 hours", "4 hours", "5 hours"],
      correct: 1,
      difficulty: "easy",
    },
    {
      id: "apt_3",
      question: "Which number comes next in the series: 2, 5, 10, 17, ?",
      options: ["24", "26", "28", "30"],
      correct: 1,
      difficulty: "medium",
    },
  ],
  communication: [
    {
      id: "comm_1",
      question: "Describe your ideal workplace environment in 50+ characters.",
      scenario: "You are interviewing for a software development position.",
      minLength: 50,
      type: "essay",
    },
    {
      id: "comm_2",
      question:
        "How would you explain a complex technical concept to a non-technical person?",
      scenario: 'Imagine explaining "cloud computing" to your grandmother.',
      minLength: 50,
      type: "essay",
    },
  ],
  logicalReasoning: [
    {
      id: "logic_1",
      question:
        "If all cats are animals and all animals have four legs, what can we conclude about cats?",
      options: [
        "Cats have four legs",
        "Not all cats have four legs",
        "Some animals are cats",
        "Animals are cats",
      ],
      correct: 0,
      difficulty: "medium",
    },
    {
      id: "logic_2",
      question:
        "In a race, Tom finished ahead of Jerry, and Jerry finished ahead of Spike. Who finished last?",
      options: ["Tom", "Jerry", "Spike", "Cannot be determined"],
      correct: 2,
      difficulty: "easy",
    },
  ],
};

/**
 * Create initial assessment for a new student with role-specific technical questions
 * FIXED: Now includes role-based technical section
 */
export async function createInitialAssessment(
  studentId: string,
): Promise<string> {
  try {
    const assessmentId = `initial_${studentId}_${Date.now()}`;
    const assessmentRef = doc(db, "initialAssessments", assessmentId);

    // Get student's role to fetch role-specific technical questions
    const studentRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentRef);
    const role = studentSnap.data()?.preferredRoles?.[0] || "";
    const technicalQuestions = getTechnicalQuestionsForRole(role);

    await setDoc(assessmentRef, {
      studentId,
      assessmentId,
      role, // FIXED: Store role for reference
      startedAt: serverTimestamp(),
      completedAt: null,
      aptitudeQuestions: INITIAL_ASSESSMENT_QUESTIONS.aptitude,
      technicalQuestions: technicalQuestions, // FIXED: Role-based technical questions
      communicationQuestions: INITIAL_ASSESSMENT_QUESTIONS.communication,
      answers: {
        aptitude: [],
        technical: [], // FIXED: New section for technical answers
        communication: [],
      },
      scores: {
        aptitude: null,
        technical: null, // FIXED: New score type
        communication: null,
        total: null,
      },
      status: "in-progress",
    });

    return assessmentId;
  } catch (error) {
    console.error("Error creating initial assessment:", error);
    throw error;
  }
}

/**
 * Submit initial assessment with answers - NOW INCLUDES TECHNICAL SECTION
 * FIXED: Role-based technical questions are scored
 */
export async function submitInitialAssessment(
  studentId: string,
  assessmentId: string,
  answers: {
    aptitude: (number | null)[];
    technical: (number | null)[]; // FIXED: Added technical section
    communication: string[];
  },
): Promise<InitialAssessmentResult> {
  try {
    // Calculate aptitude score
    const aptitudeAnswers = INITIAL_ASSESSMENT_QUESTIONS.aptitude;
    const aptitudeCorrect = answers.aptitude.filter(
      (ans, idx) => ans === aptitudeAnswers[idx]?.correct,
    ).length;
    const aptitudeScore = Math.round(
      (aptitudeCorrect / aptitudeAnswers.length) * 100,
    );

    // Calculate technical score (FIXED)
    let technicalScore = 0;
    if (answers.technical && answers.technical.length > 0) {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      const role = studentSnap.data()?.preferredRoles?.[0] || "";
      const technicalQuestions = getTechnicalQuestionsForRole(role);

      const technicalCorrect = answers.technical.filter(
        (ans, idx) => ans === technicalQuestions[idx]?.correct,
      ).length;
      technicalScore = Math.round(
        (technicalCorrect / technicalQuestions.length) * 100,
      );
    }

    // Score communication based on length and quality
    const commScore = Math.min(
      100,
      (answers.communication.reduce(
        (sum, ans) => sum + Math.min(ans.length, 200),
        0,
      ) /
        (answers.communication.length * 200)) *
        100,
    );

    const totalScore = Math.round(
      (aptitudeScore + technicalScore + commScore) / 3,
    );

    // Save results
    const resultRef = doc(
      db,
      "initialAssessmentResults",
      `result_${studentId}`,
    );
    const result: InitialAssessmentResult = {
      attemptId: assessmentId,
      completedAt: serverTimestamp() as any,
      aptitudeScore,
      technicalScore, // FIXED: New score
      communicationScore: Math.round(commScore),
      totalScore,
      feedback: generateFeedback(aptitudeScore, technicalScore, commScore),
    };

    await setDoc(resultRef, result);

    // Update student profile with results
    const studentRefForUpdate = doc(db, "students", studentId);

    try {
      const studentDocSnap = await getDoc(studentRefForUpdate);
      if (studentDocSnap.exists()) {
        await updateDoc(studentRefForUpdate, {
          initialAssessmentCompleted: true,
          aptitudeScore: Math.max(
            studentDocSnap.data().aptitudeScore || 0,
            aptitudeScore,
          ),
          technicalScore: Math.max(
            studentDocSnap.data().technicalScore || 0,
            technicalScore,
          ), // FIXED
          communicationScore: Math.max(
            studentDocSnap.data().communicationScore || 0,
            Math.round(commScore),
          ),
          overallScore: totalScore,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(
        "Error updating student profile with assessment scores:",
        e,
      );
      // Don't throw - assessment results were saved successfully
    }

    return result;
  } catch (error) {
    console.error("Error submitting initial assessment:", error);
    throw error;
  }
}

/**
 * Generate feedback based on scores - NOW INCLUDES TECHNICAL SCORE
 */
function generateFeedback(
  aptitudeScore: number,
  technicalScore: number,
  commScore: number,
): string {
  const avg = (aptitudeScore + technicalScore + commScore) / 3;

  if (avg >= 80) {
    return "Excellent performance! You have demonstrated strong foundational skills across all areas.";
  } else if (avg >= 60) {
    return "Good start! You have solid skills. Consider focusing on areas where you scored lower to improve further.";
  } else if (avg >= 40) {
    return "You have basic skills in the assessed areas. We recommend building on these skills with targeted practice.";
  } else {
    return "We recommend dedicating time to strengthen your skills in aptitude, technical concepts, and communication. Resources are available to help you improve.";
  }
}

/**
 * Get initial assessment results for a student
 */
export async function getInitialAssessmentResults(
  studentId: string,
): Promise<InitialAssessmentResult | null> {
  try {
    const resultRef = doc(
      db,
      "initialAssessmentResults",
      `result_${studentId}`,
    );
    const resultDoc = await getDoc(resultRef);

    if (resultDoc.exists()) {
      return resultDoc.data() as InitialAssessmentResult;
    }
    return null;
  } catch (error) {
    console.error("Error getting initial assessment results:", error);
    return null;
  }
}
