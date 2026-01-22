import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  Query,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import {
  Test,
  StudentTestAttempt,
  TestResult,
  StudentAnswer,
  TestStatistics,
} from '@/types/index';

const TESTS_COLLECTION = 'tests';
const STUDENT_ATTEMPTS_COLLECTION = 'studentTestAttempts';
const TEST_RESULTS_COLLECTION = 'testResults';

// ============================================
// FETCHING TESTS
// ============================================

/**
 * Fetch all active tests
 */
export const getAllTests = async (): Promise<Test[]> => {
  try {
    const q = query(
      collection(db, TESTS_COLLECTION),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Test));
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
};

/**
 * Fetch a specific test by ID
 */
export const getTestById = async (testId: string): Promise<Test | null> => {
  try {
    const docRef = doc(db, TESTS_COLLECTION, testId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Test;
  } catch (error) {
    console.error('Error fetching test:', error);
    throw error;
  }
};

/**
 * Fetch tests by type (MCQ, APTITUDE, COMMUNICATION)
 */
export const getTestsByType = async (testType: string): Promise<Test[]> => {
  try {
    const q = query(
      collection(db, TESTS_COLLECTION),
      where('type', '==', testType),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Test));
  } catch (error) {
    console.error('Error fetching tests by type:', error);
    throw error;
  }
};

// ============================================
// STUDENT TEST ATTEMPTS
// ============================================

/**
 * Start a new test attempt
 */
export const startTestAttempt = async (
  studentId: string,
  testId: string,
  test: Test
): Promise<StudentTestAttempt> => {
  try {
    const attemptId = `${studentId}_${testId}_${Date.now()}`;
    const attempt: StudentTestAttempt = {
      id: attemptId,
      studentId,
      testId,
      testType: test.type,
      startedAt: serverTimestamp(),
      answers: [],
      status: 'in-progress',
    };

    await setDoc(
      doc(db, STUDENT_ATTEMPTS_COLLECTION, attemptId),
      attempt
    );
    return attempt;
  } catch (error) {
    console.error('Error starting test attempt:', error);
    throw error;
  }
};

/**
 * Save a student's answer to a question
 */
export const saveAnswer = async (
  attemptId: string,
  answer: StudentAnswer
): Promise<void> => {
  try {
    const attemptRef = doc(db, STUDENT_ATTEMPTS_COLLECTION, attemptId);
    const attempt = await getDoc(attemptRef);
    
    if (!attempt.exists()) {
      throw new Error('Attempt not found');
    }

    const answers = attempt.data().answers || [];
    const existingIndex = answers.findIndex(
      (a: StudentAnswer) => a.questionId === answer.questionId
    );

    if (existingIndex >= 0) {
      answers[existingIndex] = answer;
    } else {
      answers.push(answer);
    }

    await updateDoc(attemptRef, { answers });
  } catch (error) {
    console.error('Error saving answer:', error);
    throw error;
  }
};

/**
 * Submit test attempt for evaluation
 */
export const submitTestAttempt = async (
  attemptId: string,
  test: Test
): Promise<TestResult> => {
  try {
    const attemptRef = doc(db, STUDENT_ATTEMPTS_COLLECTION, attemptId);
    const attemptSnap = await getDoc(attemptRef);

    if (!attemptSnap.exists()) {
      throw new Error('Attempt not found');
    }

    const attempt = attemptSnap.data() as StudentTestAttempt;

    // Evaluate the test
    const result = evaluateTest(attempt, test);

    // Update attempt status
    await updateDoc(attemptRef, {
      submittedAt: serverTimestamp(),
      status: 'evaluated',
      totalScore: result.totalScore,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.passed,
      mcqScore: result.mcqScore,
      aptitudeScore: result.aptitudeScore,
      communicationScore: result.communicationScore,
    });

    // Save result to testResults collection
    await setDoc(
      doc(db, TEST_RESULTS_COLLECTION, result.id),
      result
    );

    // Update student profile scores
    await updateStudentProfileScoresFromTest(attempt.studentId, result);

    return result;
  } catch (error) {
    console.error('Error submitting test:', error);
    throw error;
  }
};

/**
 * Get test attempt history for a student
 */
export const getStudentTestAttempts = async (
  studentId: string
): Promise<StudentTestAttempt[]> => {
  try {
    const q = query(
      collection(db, STUDENT_ATTEMPTS_COLLECTION),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as StudentTestAttempt));
  } catch (error) {
    console.error('Error fetching student test attempts:', error);
    throw error;
  }
};

/**
 * Get a specific test attempt
 */
export const getTestAttempt = async (
  attemptId: string
): Promise<StudentTestAttempt | null> => {
  try {
    const docRef = doc(db, STUDENT_ATTEMPTS_COLLECTION, attemptId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as StudentTestAttempt;
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    throw error;
  }
};

// ============================================
// TEST RESULTS
// ============================================

/**
 * Get test result for a student
 */
export const getTestResult = async (resultId: string): Promise<TestResult | null> => {
  try {
    const docRef = doc(db, TEST_RESULTS_COLLECTION, resultId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as TestResult;
  } catch (error) {
    console.error('Error fetching test result:', error);
    throw error;
  }
};

/**
 * Get all test results for a student
 */
export const getStudentTestResults = async (
  studentId: string
): Promise<TestResult[]> => {
  try {
    const q = query(
      collection(db, TEST_RESULTS_COLLECTION),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as TestResult));
  } catch (error) {
    console.error('Error fetching student test results:', error);
    throw error;
  }
};

/**
 * Get test results for all students (professor/recruiter view)
 */
export const getTestResultsByTest = async (
  testId: string
): Promise<TestResult[]> => {
  try {
    const q = query(
      collection(db, TEST_RESULTS_COLLECTION),
      where('testId', '==', testId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as TestResult));
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
};

// ============================================
// EVALUATION LOGIC
// ============================================

/**
 * Evaluate a test attempt
 * Handles MCQ, Aptitude, and Communication tests
 */
export const evaluateTest = (
  attempt: StudentTestAttempt,
  test: Test
): TestResult => {
  let mcqScore = 0;
  let aptitudeScore = 0;
  let communicationScore = 0;
  let totalScore = 0;
  let maxScore = 0;

  // Evaluate answers based on test type
  const evaluatedAnswers = attempt.answers.map((answer) => {
    const question = test.questions.find((q) => q.id === answer.questionId);

    if (!question) {
      return answer;
    }

    let isCorrect = false;
    let marksObtained = 0;

    if (test.type === 'MCQ' || test.type === 'APTITUDE') {
      // Objective tests: Direct comparison
      isCorrect = answer.selectedOption === question.correctAnswer;
      marksObtained = isCorrect ? question.weight : 0;
    } else if (test.type === 'COMMUNICATION') {
      // Communication test: Rule-based evaluation
      const evaluation = evaluateCommunicationAnswer(
        answer.writtenAnswer || '',
        question
      );
      isCorrect = evaluation.passed;
      marksObtained = evaluation.marksObtained;
    }

    // Add to category score
    maxScore += question.weight;

    if (test.type === 'MCQ') {
      mcqScore += marksObtained;
    } else if (test.type === 'APTITUDE') {
      aptitudeScore += marksObtained;
    } else if (test.type === 'COMMUNICATION') {
      communicationScore += marksObtained;
    }

    totalScore += marksObtained;

    return {
      ...answer,
      isCorrect,
      marksObtained,
      maxMarks: question.weight,
    };
  });

  // Normalize scores to configured total marks (usually 100)
  const percentage =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= (test.passingScore || 50);

  const result: TestResult = {
    id: attempt.id,
    studentId: attempt.studentId,
    testId: attempt.testId,
    testTitle: test.title,
    testType: test.type,
    mcqScore: test.type === 'MCQ' ? mcqScore : undefined,
    aptitudeScore: test.type === 'APTITUDE' ? aptitudeScore : undefined,
    communicationScore: test.type === 'COMMUNICATION' ? communicationScore : undefined,
    totalScore,
    totalMarks: maxScore,
    percentage,
    passed,
    attemptedAt: attempt.startedAt,
    submittedAt: new Date(),
    detailedResults: evaluatedAnswers,
  };

  return result;
};

/**
 * Evaluate a Communication test answer
 * Rule-based logic without AI
 */
const evaluateCommunicationAnswer = (
  writtenAnswer: string,
  question: any
): { passed: boolean; marksObtained: number } => {
  const minLength = question.minLength || 50; // Minimum 50 characters
  const answerTrimmed = writtenAnswer.trim();

  // Check 1: Minimum length
  if (answerTrimmed.length < minLength) {
    return { passed: false, marksObtained: 0 };
  }

  // Check 2: Non-empty and structured
  // Basic checks for structure (paragraphs, sentences)
  const hasPunctuation = /[.!?]/.test(answerTrimmed);
  const hasMultipleSentences = (answerTrimmed.match(/[.!?]/g) || []).length >= 2;

  if (!hasPunctuation) {
    return { passed: false, marksObtained: Math.ceil(question.weight * 0.3) };
  }

  // Check 3: Relevance (basic keyword matching if scenario provided)
  let relevanceScore = 0.7; // Default relevance
  if (question.scenario) {
    const keywords = extractKeywords(question.scenario);
    const answerKeywordMatch = keywords.filter((k) =>
      answerTrimmed.toLowerCase().includes(k.toLowerCase())
    ).length;
    relevanceScore = Math.min(1, 0.7 + (answerKeywordMatch * 0.1));
  }

  // Check 4: Completeness
  let completenessScore = 0.7;
  if (hasMultipleSentences) {
    completenessScore = 0.9;
  }

  // Calculate final score
  const qualityScore = (relevanceScore + completenessScore) / 2;
  const marksObtained = Math.round(question.weight * qualityScore);

  return {
    passed: marksObtained >= question.weight * 0.5, // Pass if >= 50% marks
    marksObtained,
  };
};

/**
 * Extract keywords from a scenario string
 */
const extractKeywords = (text: string): string[] => {
  // Simple keyword extraction: remove common words
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were',
  ]);

  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word));

  const wordsSet = new Set(words);
  return Array.from(wordsSet); // Remove duplicates
};

// ============================================
// ANALYTICS
// ============================================

/**
 * Calculate test statistics
 */
export const calculateTestStatistics = async (
  testId: string
): Promise<TestStatistics | null> => {
  try {
    const results = await getTestResultsByTest(testId);
    const test = await getTestById(testId);

    if (!test || results.length === 0) {
      return null;
    }

    const totalAttempts = results.length;
    const scores = results.map((r) => r.totalScore);
    const percentages = results.map((r) => r.percentage);
    const passCount = results.filter((r) => r.passed).length;

    const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttempts;
    const passRate = Math.round((passCount / totalAttempts) * 100);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate question-wise analysis
    const questionAnalysis = test.questions.map((question) => {
      let correctCount = 0;
      let totalAnswered = 0;

      results.forEach((result) => {
        const answer = result.detailedResults.find(
          (a) => a.questionId === question.id
        );
        if (answer) {
          totalAnswered++;
          if (answer.isCorrect) correctCount++;
        }
      });

      const difficulty =
        totalAnswered > 0
          ? Math.round(((totalAnswered - correctCount) / totalAnswered) * 100)
          : 0;

      return {
        questionId: question.id,
        question: question.question,
        correctCount,
        totalAttempts: totalAnswered,
        difficulty,
      };
    });

    // Average time taken (if available)
    const timeTakenValues = results
      .flatMap((r) => r.detailedResults.map((a) => a.timeTaken || 0))
      .filter((t) => t > 0);
    const averageTimeTaken =
      timeTakenValues.length > 0
        ? Math.round(
            timeTakenValues.reduce((a, b) => a + b, 0) / timeTakenValues.length
          )
        : 0;

    return {
      testId,
      testTitle: test.title,
      totalAttempts,
      averageScore,
      passRate,
      highestScore,
      lowestScore,
      averageTimeTaken,
      questionAnalysis,
    };
  } catch (error) {
    console.error('Error calculating test statistics:', error);
    throw error;
  }
};

/**
 * Update student profile scores based on test results
 */
export const updateStudentProfileScoresFromTest = async (
  studentId: string,
  testResult: TestResult
): Promise<void> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      console.warn('Student profile not found:', studentId);
      return;
    }

    const currentProfile = studentSnap.data();
    const currentAptitude = currentProfile.aptitudeScore || 0;
    const currentCommunication = currentProfile.communicationScore || 0;
    const currentTechnical = currentProfile.technicalScore || 0;

    // Update with highest scores achieved
    const updates: any = {
      updatedAt: serverTimestamp(),
    };

    // Update individual scores if this test result is higher
    if (testResult.aptitudeScore !== undefined) {
      updates.aptitudeScore = Math.max(currentAptitude, testResult.aptitudeScore);
    }
    if (testResult.communicationScore !== undefined) {
      updates.communicationScore = Math.max(currentCommunication, testResult.communicationScore);
    }
    // For technical skills, sum MCQ score as technical score
    if (testResult.mcqScore !== undefined) {
      updates.technicalScore = Math.max(currentTechnical, Math.round(testResult.mcqScore));
    }

    // Calculate overall score
    const newAptitude = updates.aptitudeScore ?? currentAptitude;
    const newCommunication = updates.communicationScore ?? currentCommunication;
    const newTechnical = updates.technicalScore ?? currentTechnical;
    updates.overallScore = Math.round((newAptitude + newCommunication + newTechnical) / 3);

    await updateDoc(studentRef, updates);
  } catch (error) {
    console.error('Error updating student profile scores:', error);
    // Don't throw - test was submitted successfully even if profile update fails
  }
};
