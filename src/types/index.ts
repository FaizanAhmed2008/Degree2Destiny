// Comprehensive type definitions for the platform

export type UserRole = 'student' | 'professor' | 'recruiter';

export type JobType = 'internship' | 'full-time' | 'part-time' | 'contract' | 'remote';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type AssessmentType = 'micro-task' | 'bug-fix' | 'scenario' | 'build-challenge';

export type VerificationStatus = 'not-requested' | 'pending' | 'verified' | 'rejected' | 'under-review';

export type JobReadinessLevel = 'not-ready' | 'developing' | 'ready' | 'highly-ready';

export type StudentStatus = 'ready-to-work' | 'skill-building' | 'studying' | 'actively-looking';

export type ProfileVisibility = 'visible-to-all' | 'visible-to-hr' | 'visible-to-professor' | 'hidden';

// User Profile
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  avatar?: string;
  createdAt: any;
  updatedAt: any;
}

// Student Profile
export interface StudentProfile extends UserProfile {
  role: 'student';
  /**
   * Mandatory registration fields (Step 0).
   * These are required before a student can access any dashboard/tests.
   */
  fullName?: string;
  phoneWhatsApp?: string;
  college?: string;
  interestedRoleSkill?: string;
  registrationCompleted?: boolean;
  /**
   * Student-level verification gate used for HR access.
   * (Separate from per-skill verificationStatus.)
   * Lifecycle: NOT_REQUESTED -> PENDING -> VERIFIED/REJECTED
   */
  verificationStatus?: VerificationStatus;
  requestedAt?: any; // Timestamp when student requested verification
  verifiedAt?: any; // Timestamp when professor approved
  verifiedBy?: string; // Professor UID who verified
  // Career Information
  careerInterests: string[];
  preferredRoles: string[];
  jobType: JobType[];
  location?: string;
  // Skills
  skills: StudentSkill[];
  // Projects & Achievements
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  // Portfolio & Links
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;
  // Job Readiness
  jobReadinessScore: number;
  jobReadinessLevel: JobReadinessLevel;
  // Mock evaluation scores (40-100) - used for Destiny scoring dashboards
  // These can be randomly generated and persisted for analytics/graphs
  aptitudeScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  overallScore?: number;
  // AI Insights
  aiInsights?: AIInsights;
  // Professor Assignment
  assignedProfessorId?: string;
  // NEW: Student Status & Visibility
  studentStatus?: StudentStatus;
  profileVisibility?: ProfileVisibility;
  // NEW: Initial Assessment Results
  initialAssessmentCompleted?: boolean;
  initialAssessmentResults?: InitialAssessmentResult;
}

// Student Skill with Verification
export interface StudentSkill {
  id: string;
  name: string;
  category: string;
  selfLevel: SkillLevel;
  score: number; // 0-100, skill points - calculated from assessments
  proofLinks: string[]; // GitHub, portfolio, etc.
  verificationStatus: VerificationStatus;
  verifiedBy?: string; // Professor UID or "AI"
  verifiedAt?: any;
  assessments: Assessment[];
  lastUpdated: any;
  interviewTranscript?: InterviewTranscript; // AI interview data
  interviewEvaluation?: InterviewEvaluation; // AI evaluation results
}

// AI Interview Transcript
export interface InterviewTranscript {
  id: string;
  skillId: string;
  studentId: string;
  skillName: string;
  startedAt: any;
  completedAt?: any;
  messages: InterviewMessage[];
  status: 'in-progress' | 'completed' | 'abandoned';
}

// Interview Message
export interface InterviewMessage {
  role: 'interviewer' | 'student';
  content: string;
  timestamp: string; // ISO string timestamp
  questionNumber?: number; // For interviewer messages
}

// AI Interview Evaluation
export interface InterviewEvaluation {
  score: number; // 0-100
  skillLevel: SkillLevel;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  questionScores: Array<{
    questionNumber: number;
    question: string;
    score: number;
    feedback: string;
  }>;
  evaluatedAt: string; // ISO string timestamp
}

// Assessment
export interface Assessment {
  id: string;
  skillId: string;
  type: AssessmentType;
  title: string;
  description: string;
  instructions: string;
  submission?: AssessmentSubmission;
  score?: number; // 0-100
  maxScore: number;
  createdAt: any;
  completedAt?: any;
  status: 'not-started' | 'in-progress' | 'submitted' | 'evaluated';
}

// Assessment Submission
export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  content: string; // Code, text, file URLs, etc.
  fileUrls?: string[];
  notes?: string;
  submittedAt: any;
  evaluatedAt?: any;
  evaluatedBy?: string; // Professor UID
  feedback?: string;
  score?: number;
}

// Project
export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  startDate: any;
  endDate?: any;
  skillsDemonstrated: string[];
}

// Achievement
export interface Achievement {
  id: string;
  title: string;
  description: string;
  issuer?: string;
  date: any;
  proofUrl?: string;
}

// Certification
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: any;
  expiryDate?: any;
  credentialId?: string;
  credentialUrl?: string;
}

// Professor Profile
export interface ProfessorProfile extends UserProfile {
  role: 'professor';
  department?: string;
  institution?: string;
  assignedStudents: string[]; // Student UIDs
  verificationCount: number;
}

// Recruiter Profile
export interface RecruiterProfile extends UserProfile {
  role: 'recruiter';
  companyName: string;
  companyLogo?: string;
  position?: string;
  shortlistedCandidates: string[]; // Student UIDs
  interviewRequests: InterviewRequest[];
}

// Interview Request
export interface InterviewRequest {
  id: string;
  recruiterId: string;
  studentId: string;
  position: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requestedAt: any;
  respondedAt?: any;
  scheduledAt?: any;
}

// Message
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
  read: boolean;
}

// Conversation
export interface Conversation {
  id: string;
  participants: string[]; // [recruiterId, studentId]
  lastMessage?: Message;
  lastMessageAt?: any;
  unreadCount: { [userId: string]: number };
}

// AI Insights
export interface AIInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedRoles: SuggestedRole[];
  learningRoadmap: LearningRoadmapItem[];
  improvementSuggestions: ImprovementSuggestion[];
  lastAnalyzed: any;
}

// Suggested Role
export interface SuggestedRole {
  role: string;
  matchScore: number; // 0-100
  reasoning: string;
  requiredSkills: string[];
  missingSkills: string[];
}

// Learning Roadmap Item
export interface LearningRoadmapItem {
  id: string;
  skill: string;
  priority: 'high' | 'medium' | 'low';
  steps: string[];
  resources: Resource[];
  estimatedTime: string;
}

// Resource
export interface Resource {
  title: string;
  url: string;
  type: 'course' | 'tutorial' | 'documentation' | 'video' | 'article';
}

// Improvement Suggestion
export interface ImprovementSuggestion {
  skill: string;
  currentScore: number;
  targetScore: number;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

// Matching Result
export interface MatchingResult {
  studentId: string;
  matchScore: number;
  reasons: string[];
  skillMatches: { [skill: string]: number };
  recommendedFor: string[]; // Job roles
}

// Professor Feedback
export interface ProfessorFeedback {
  id: string;
  studentId: string;
  professorId: string;
  skillId: string;
  assessmentId?: string;
  feedback: string;
  score?: number;
  verificationStatus: VerificationStatus;
  createdAt: any;
  aiAssisted: boolean;
}

// Analytics
export interface StudentAnalytics {
  studentId: string;
  readinessTrend: { date: any; score: number }[];
  skillProgress: { skillId: string; progress: { date: any; score: number }[] }[];
  assessmentCompletionRate: number;
  verificationRate: number;
}
// ============================================
// TEST MODULE TYPES
// ============================================

export type TestType = 'MCQ' | 'APTITUDE' | 'COMMUNICATION';

// Test Question Base
export interface TestQuestion {
  id: string;
  questionNumber: number;
  question: string;
  type: TestType;
  weight: number; // Marks weightage for this question
  difficulty: 'easy' | 'medium' | 'hard';
  // For MCQ and Aptitude tests
  options?: string[]; // Array of options
  correctAnswer?: number; // Index of correct option (0-based)
  // For Communication tests
  scenario?: string; // Additional context/scenario
  minLength?: number; // Minimum character length for valid answer
}

// Complete Test Definition
export interface Test {
  id: string;
  title: string;
  description: string;
  type: TestType;
  duration: number; // in minutes
  passingScore: number; // Percentage (e.g., 50)
  totalMarks: number; // 100 (default)
  instructions: string;
  questions: TestQuestion[];
  createdAt: any;
  updatedAt: any;
  createdBy: string; // Admin/Professor UID
  isActive: boolean;
}

// Student's Test Attempt
export interface StudentTestAttempt {
  id: string;
  studentId: string;
  testId: string;
  testType: TestType;
  startedAt: any;
  submittedAt?: any;
  answers: StudentAnswer[]; // Answers to questions
  // Scores
  mcqScore?: number;
  aptitudeScore?: number;
  communicationScore?: number;
  totalScore?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  // Status
  status: 'in-progress' | 'submitted' | 'evaluated';
}

// Student's Answer to a Question
export interface StudentAnswer {
  questionId: string;
  questionNumber: number;
  questionText: string;
  type: TestType;
  // For MCQ and Aptitude: selected option index
  selectedOption?: number;
  // For Communication: written answer
  writtenAnswer?: string;
  // Evaluation
  isCorrect?: boolean;
  marksObtained?: number;
  maxMarks?: number;
  feedback?: string;
  // Metadata
  answeredAt?: any;
  timeTaken?: number; // seconds
}

// Test Result Summary
export interface TestResult {
  id: string;
  studentId: string;
  testId: string;
  testTitle: string;
  testType: TestType;
  mcqScore?: number;
  aptitudeScore?: number;
  communicationScore?: number;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  attemptedAt: any;
  submittedAt: any;
  detailedResults: StudentAnswer[];
  feedback?: string;
}

// Test Statistics (for analytics)
export interface TestStatistics {
  testId: string;
  testTitle: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number; // Percentage
  highestScore: number;
  lowestScore: number;
  averageTimeTaken: number; // in seconds
  questionAnalysis: {
    questionId: string;
    question: string;
    correctCount: number;
    totalAttempts: number;
    difficulty: number; // percentage of students who got it wrong
  }[];
}

// Initial Assessment Result (taken during registration)
export interface InitialAssessmentResult {
  attemptId: string;
  completedAt: any;
  aptitudeScore: number;
  communicationScore: number;
  logicalReasoningScore: number;
  totalScore: number;
  feedback: string;
}

// Career Oriented Test Question
export interface CareerOrientedTestQuestion extends TestQuestion {
  careerRole: string;
  skillsRequired: string[];
  interestAreas: string[];
}

// Career Oriented Test
export interface CareerOrientedTest extends Test {
  careerRoles: string[];
  skillsAssessed: string[];
  interestAreas: string[];
}

// Skill-Specific Test Result
export interface SkillTestResult extends TestResult {
  skillId: string;
  skillName: string;
  skillCategory: string;
}