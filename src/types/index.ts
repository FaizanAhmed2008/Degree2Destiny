// Comprehensive type definitions for the platform

export type UserRole = 'student' | 'professor' | 'recruiter';

export type JobType = 'internship' | 'full-time' | 'part-time' | 'contract' | 'remote';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type AssessmentType = 'micro-task' | 'bug-fix' | 'scenario' | 'build-challenge';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'under-review';

export type JobReadinessLevel = 'not-ready' | 'developing' | 'ready' | 'highly-ready';

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
}

// Student Skill with Verification
export interface StudentSkill {
  id: string;
  name: string;
  category: string;
  selfLevel: SkillLevel;
  score: number; // 0-100, calculated from assessments
  proofLinks: string[]; // GitHub, portfolio, etc.
  verificationStatus: VerificationStatus;
  verifiedBy?: string; // Professor UID
  verifiedAt?: any;
  assessments: Assessment[];
  lastUpdated: any;
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
