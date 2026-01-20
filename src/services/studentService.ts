// Student Service - Business logic for student operations
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { StudentProfile, StudentSkill, Assessment, AssessmentSubmission, JobReadinessLevel } from '../types';
import { analyzeStudentSkills, generateLearningRoadmap, generateImprovementSuggestions } from './aiService';

// Utility to generate a random score between 40 and 100 (inclusive)
const generateRandomScore = () => Math.floor(40 + Math.random() * 61);

/**
 * Calculate job readiness score from skills
 */
export function calculateJobReadinessScore(skills: StudentSkill[]): number {
  if (skills.length === 0) return 0;
  
  // Weight verified skills more heavily
  const totalScore = skills.reduce((sum, skill) => {
    const baseScore = skill.score;
    const verifiedBonus = skill.verificationStatus === 'verified' ? 10 : 0;
    return sum + baseScore + verifiedBonus;
  }, 0);
  
  return Math.min(100, Math.round(totalScore / skills.length));
}

/**
 * Determine job readiness level
 */
export function getJobReadinessLevel(score: number): JobReadinessLevel {
  if (score >= 85) return 'highly-ready';
  if (score >= 70) return 'ready';
  if (score >= 50) return 'developing';
  return 'not-ready';
}

/**
 * Get or create student profile
 */
export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  try {
    const studentRef = doc(db, 'students', uid);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      return null;
    }

    let student = studentDoc.data() as StudentProfile;

    // Ensure mock Destiny scores exist and persist them if missing
    // This keeps the data generation in one place and makes graphs consistent
    if (
      student.aptitudeScore === undefined ||
      student.technicalScore === undefined ||
      student.communicationScore === undefined ||
      student.overallScore === undefined
    ) {
      const aptitudeScore = student.aptitudeScore ?? generateRandomScore();
      const technicalScore = student.technicalScore ?? generateRandomScore();
      const communicationScore = student.communicationScore ?? generateRandomScore();
      const overallScore = Math.round((aptitudeScore + technicalScore + communicationScore) / 3);

      await updateDoc(studentRef, {
        aptitudeScore,
        technicalScore,
        communicationScore,
        overallScore,
        updatedAt: serverTimestamp(),
      });

      student = {
        ...student,
        aptitudeScore,
        technicalScore,
        communicationScore,
        overallScore,
      };
    }

    return student;
  } catch (error) {
    console.error('Error getting student profile:', error);
    return null;
  }
}

/**
 * Create or update student profile
 */
export async function saveStudentProfile(profile: Partial<StudentProfile>): Promise<void> {
  if (!profile.uid) throw new Error('Student UID is required');
  
  try {
    const studentRef = doc(db, 'students', profile.uid);
    const existingDoc = await getDoc(studentRef);
    
    const updateData = {
      ...profile,
      updatedAt: serverTimestamp(),
    };
    
    if (!existingDoc.exists()) {
      updateData.createdAt = serverTimestamp();
      updateData.onboardingCompleted = false;
      updateData.onboardingStep = 0;
      updateData.jobReadinessScore = 0;
      updateData.jobReadinessLevel = 'not-ready';
      updateData.skills = [];
      updateData.projects = [];
      updateData.achievements = [];
      updateData.certifications = [];
    }
    
    await setDoc(studentRef, updateData, { merge: true });
  } catch (error) {
    console.error('Error saving student profile:', error);
    throw error;
  }
}

/**
 * Add or update a skill
 */
export async function saveStudentSkill(
  studentId: string,
  skill: StudentSkill
): Promise<void> {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student profile not found');
    }
    
    const studentData = studentDoc.data() as StudentProfile;
    const skills = studentData.skills || [];
    
    const existingIndex = skills.findIndex(s => s.id === skill.id);
    if (existingIndex >= 0) {
      skills[existingIndex] = { ...skill, lastUpdated: serverTimestamp() };
    } else {
      skills.push({ ...skill, lastUpdated: serverTimestamp() });
    }
    
    // Recalculate readiness score
    const readinessScore = calculateJobReadinessScore(skills);
    const readinessLevel = getJobReadinessLevel(readinessScore);
    
    await updateDoc(studentRef, {
      skills,
      jobReadinessScore: readinessScore,
      jobReadinessLevel: readinessLevel,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving student skill:', error);
    throw error;
  }
}

/**
 * Delete a skill by id (and recalculate readiness)
 */
export async function deleteStudentSkill(studentId: string, skillId: string): Promise<void> {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error('Student profile not found');
    }

    const studentData = studentDoc.data() as StudentProfile;
    const skills = studentData.skills || [];
    const updatedSkills = skills.filter(s => s.id !== skillId);

    // Recalculate readiness score
    const readinessScore = calculateJobReadinessScore(updatedSkills);
    const readinessLevel = getJobReadinessLevel(readinessScore);

    await updateDoc(studentRef, {
      skills: updatedSkills,
      jobReadinessScore: readinessScore,
      jobReadinessLevel: readinessLevel,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting student skill:', error);
    throw error;
  }
}

/**
 * Submit an assessment
 */
export async function submitAssessment(
  studentId: string,
  assessmentId: string,
  submission: Omit<AssessmentSubmission, 'id' | 'submittedAt'>
): Promise<void> {
  try {
    const submissionRef = doc(collection(db, 'assessmentSubmissions'));
    const submissionData: AssessmentSubmission = {
      ...submission,
      id: submissionRef.id,
      submittedAt: serverTimestamp(),
    };
    
    await setDoc(submissionRef, submissionData);
    
    // Update assessment status
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      const studentData = studentDoc.data() as StudentProfile;
      const skills = studentData.skills || [];
      
      // Find and update the assessment
      for (const skill of skills) {
        const assessments = skill.assessments || [];
        const assessmentIndex = assessments.findIndex(a => a.id === assessmentId);
        if (assessmentIndex >= 0) {
          assessments[assessmentIndex].status = 'submitted';
          assessments[assessmentIndex].submission = submissionData;
          skill.assessments = assessments;
          
          await saveStudentSkill(studentId, skill);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error submitting assessment:', error);
    throw error;
  }
}

/**
 * Generate AI insights for student
 */
export async function generateStudentInsights(studentId: string): Promise<void> {
  try {
    const studentProfile = await getStudentProfile(studentId);
    if (!studentProfile) throw new Error('Student not found');
    
    const insights = await analyzeStudentSkills({
      skills: (studentProfile.skills || []).map(s => ({
        name: s.name,
        score: s.score,
        category: s.category,
      })),
      projects: (studentProfile.projects || []).map(p => ({
        title: p.title,
        technologies: p.technologies || [],
      })),
      careerInterests: studentProfile.careerInterests || [],
      preferredRoles: studentProfile.preferredRoles || [],
    });
    
    // Generate learning roadmap
    const weaknesses = insights.weaknesses;
    const targetRole = insights.suggestedRoles[0]?.role || studentProfile.preferredRoles[0] || 'Software Developer';
    const roadmap = await generateLearningRoadmap(weaknesses, targetRole);
    
    // Update student profile with insights
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      aiInsights: {
        ...insights,
        learningRoadmap: roadmap,
        lastAnalyzed: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error generating student insights:', error);
    throw error;
  }
}

/**
 * Get improvement suggestions for a skill
 */
export async function getSkillImprovementSuggestions(
  skillName: string,
  currentScore: number,
  targetScore: number = 80
): Promise<{
  actionItems: string[];
  resources: Array<{ title: string; url: string; type: string }>;
  timeline: string;
}> {
  return await generateImprovementSuggestions(skillName, currentScore, targetScore);
}
