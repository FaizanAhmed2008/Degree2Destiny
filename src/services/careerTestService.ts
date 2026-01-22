/**
 * Career-Oriented Test Service
 * Specialized tests based on student's preferred roles and interests
 */

import { doc, collection, setDoc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Test, StudentTestAttempt, StudentAnswer } from '../types';

// Career-specific test definitions
const CAREER_TEST_TEMPLATES: { [key: string]: Omit<Test, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> } = {
  'Software Engineer': {
    title: 'Software Engineer Career Assessment',
    description: 'Assess your readiness for software engineering roles through practical problem-solving',
    type: 'MCQ',
    duration: 45,
    passingScore: 60,
    totalMarks: 100,
    instructions: 'This test evaluates your software engineering fundamentals, problem-solving skills, and knowledge of best practices.',
    questions: [
      {
        id: 'se_1',
        questionNumber: 1,
        question: 'What is the time complexity of binary search?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'easy',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'],
        correctAnswer: 1,
      },
      {
        id: 'se_2',
        questionNumber: 2,
        question: 'Which design pattern provides a way to create families of related objects?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'medium',
        options: ['Singleton', 'Factory', 'Abstract Factory', 'Decorator'],
        correctAnswer: 2,
      },
      {
        id: 'se_3',
        questionNumber: 3,
        question: 'What is the main advantage of using version control systems?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'easy',
        options: [
          'Faster compilation',
          'Tracking and managing code changes',
          'Better performance',
          'Reduced memory usage',
        ],
        correctAnswer: 1,
      },
    ],
    isActive: true,
  },
  'Data Scientist': {
    title: 'Data Scientist Career Assessment',
    description: 'Evaluate your data science fundamentals, statistical knowledge, and machine learning understanding',
    type: 'MCQ',
    duration: 50,
    passingScore: 60,
    totalMarks: 100,
    instructions: 'This test assesses your knowledge of statistics, machine learning algorithms, and data analysis techniques.',
    questions: [
      {
        id: 'ds_1',
        questionNumber: 1,
        question: 'What does the R-squared value represent in a regression model?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'medium',
        options: [
          'The slope of the regression line',
          'The proportion of variance explained by the model',
          'The correlation coefficient',
          'The mean absolute error',
        ],
        correctAnswer: 1,
      },
      {
        id: 'ds_2',
        questionNumber: 2,
        question: 'Which of the following is NOT a supervised learning algorithm?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'medium',
        options: ['Linear Regression', 'K-Means Clustering', 'Logistic Regression', 'Support Vector Machines'],
        correctAnswer: 1,
      },
      {
        id: 'ds_3',
        questionNumber: 3,
        question: 'What is the purpose of cross-validation in machine learning?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'easy',
        options: [
          'Reducing training time',
          'Assessing model generalization',
          'Increasing model accuracy',
          'Data preprocessing',
        ],
        correctAnswer: 1,
      },
    ],
    isActive: true,
  },
  'Product Manager': {
    title: 'Product Manager Career Assessment',
    description: 'Evaluate product thinking, user empathy, and strategic planning abilities',
    type: 'MCQ',
    duration: 40,
    passingScore: 60,
    totalMarks: 100,
    instructions: 'This test assesses your product management fundamentals, user understanding, and strategic thinking.',
    questions: [
      {
        id: 'pm_1',
        questionNumber: 1,
        question: 'What is the primary goal of user research?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'easy',
        options: [
          'To validate assumptions',
          'To understand user needs and behaviors',
          'To improve design aesthetics',
          'To reduce development time',
        ],
        correctAnswer: 1,
      },
      {
        id: 'pm_2',
        questionNumber: 2,
        question: 'Which metric best indicates user satisfaction with a product?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'medium',
        options: ['Click-through rate', 'Net Promoter Score', 'Page load time', 'Server uptime'],
        correctAnswer: 1,
      },
      {
        id: 'pm_3',
        questionNumber: 3,
        question: 'What does MVP stand for in product development?',
        type: 'MCQ',
        weight: 5,
        difficulty: 'easy',
        options: [
          'Maximum Value Product',
          'Minimum Viable Product',
          'Marketing Validation Program',
          'Model Verification Process',
        ],
        correctAnswer: 1,
      },
    ],
    isActive: true,
  },
};

/**
 * Create a career-oriented test for a student
 */
export async function createCareerOrientedTest(
  studentId: string,
  careerRole: string
): Promise<Test | null> {
  try {
    const template = CAREER_TEST_TEMPLATES[careerRole];
    if (!template) {
      console.error(`No test template found for role: ${careerRole}`);
      return null;
    }

    const testId = `career_${studentId}_${careerRole.replace(/\s+/g, '_')}_${Date.now()}`;
    const testRef = doc(db, 'careerTests', testId);

    const test: Test = {
      id: testId,
      ...template,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: 'system',
    };

    await setDoc(testRef, test);
    console.log(`Career test created for ${careerRole}`);

    return test;
  } catch (error) {
    console.error('Error creating career test:', error);
    throw error;
  }
}

/**
 * Get available career tests for a student
 */
export async function getAvailableCareerTests(
  careerRoles: string[]
): Promise<Test[]> {
  try {
    const tests: Test[] = [];

    for (const role of careerRoles) {
      const template = CAREER_TEST_TEMPLATES[role];
      if (template) {
        tests.push({
          id: `career_template_${role}`,
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        });
      }
    }

    return tests;
  } catch (error) {
    console.error('Error getting career tests:', error);
    throw error;
  }
}

/**
 * Calculate role fit score based on test performance
 */
export function calculateRoleFitScore(
  testResults: StudentAnswer[],
  careerRole: string
): {
  score: number;
  recommendation: string;
  strengths: string[];
  areasForImprovement: string[];
} {
  const totalQuestions = testResults.length;
  const correctAnswers = testResults.filter((ans) => ans.isCorrect).length;
  const percentage = (correctAnswers / totalQuestions) * 100;

  let recommendation = '';
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];

  if (percentage >= 80) {
    recommendation = `Excellent! You're highly prepared for ${careerRole} roles. Consider applying to companies immediately.`;
    strengths.push(`Strong knowledge of ${careerRole} fundamentals`);
    strengths.push('Well-rounded skill set');
  } else if (percentage >= 60) {
    recommendation = `Good foundation! With targeted practice, you'll be ready for ${careerRole} positions.`;
    strengths.push(`Solid understanding of ${careerRole} concepts`);
    areasForImprovement.push('Advanced topics and edge cases');
  } else if (percentage >= 40) {
    recommendation = `You have the basics. Focus on strengthening key ${careerRole} skills before applying.`;
    areasForImprovement.push('Core fundamentals');
    areasForImprovement.push('Problem-solving approach');
  } else {
    recommendation = `Start with foundational courses to prepare for ${careerRole} roles.`;
    areasForImprovement.push('Most key concepts need reinforcement');
  }

  return {
    score: Math.round(percentage),
    recommendation,
    strengths,
    areasForImprovement,
  };
}

/**
 * Get skill recommendations for career role based on test gaps
 */
export function getSkillGapsForRole(
  testResults: StudentAnswer[],
  careerRole: string
): string[] {
  const failedQuestions = testResults.filter((ans) => !ans.isCorrect);

  const skillGaps: { [key: string]: string[] } = {
    'Software Engineer': [
      'Data Structures and Algorithms',
      'System Design',
      'Design Patterns',
      'Database Management',
      'Software Development Lifecycle',
    ],
    'Data Scientist': [
      'Statistics and Probability',
      'Machine Learning Algorithms',
      'Data Preprocessing',
      'Feature Engineering',
      'Model Evaluation',
    ],
    'Product Manager': [
      'User Research and Empathy',
      'Product Strategy',
      'Metrics and Analytics',
      'Roadmap Planning',
      'Cross-functional Communication',
    ],
  };

  const roleGaps = skillGaps[careerRole] || [];
  const gapCount = Math.ceil((failedQuestions.length / testResults.length) * roleGaps.length);

  return roleGaps.slice(0, gapCount);
}
