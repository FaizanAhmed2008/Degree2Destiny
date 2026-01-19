// Matching Service - Match students to roles and recruiters
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { StudentProfile, MatchingResult, RecruiterProfile } from '../types';
import { matchStudentsToJob } from './aiService';

/**
 * Match students to a job description
 */
export async function matchStudentsToJobDescription(
  jobDescription: string,
  filters?: {
    minReadiness?: number;
    verifiedOnly?: boolean;
    preferredRoles?: string[];
  }
): Promise<MatchingResult[]> {
  try {
    // Get all students
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);
    
    const students: Array<{
      id: string;
      skills: Array<{ name: string; score: number }>;
      readinessScore: number;
      profile: StudentProfile;
    }> = [];
    
    studentsSnapshot.forEach((doc) => {
      const profile = doc.data() as StudentProfile;
      
      // Apply filters
      if (filters?.minReadiness && profile.jobReadinessScore < filters.minReadiness) {
        return;
      }
      
      if (filters?.verifiedOnly) {
        const hasVerifiedSkills = (profile.skills || []).some(
          s => s.verificationStatus === 'verified'
        );
        if (!hasVerifiedSkills) return;
      }
      
      if (filters?.preferredRoles && filters.preferredRoles.length > 0) {
        const matchesRole = (profile.preferredRoles || []).some(
          role => filters.preferredRoles!.some(pr => 
            role.toLowerCase().includes(pr.toLowerCase()) || 
            pr.toLowerCase().includes(role.toLowerCase())
          )
        );
        if (!matchesRole) return;
      }
      
      students.push({
        id: profile.uid,
        skills: (profile.skills || []).map(s => ({
          name: s.name,
          score: s.score,
        })),
        readinessScore: profile.jobReadinessScore,
        profile,
      });
    });
    
    // Use AI to match
    const aiMatches = await matchStudentsToJob(jobDescription, students);
    
    // Combine AI matches with profile data
    return aiMatches.map(match => {
      const student = students.find(s => s.id === match.studentId);
      if (!student) {
        return {
          studentId: match.studentId,
          matchScore: match.matchScore,
          reasons: match.reasons,
          skillMatches: {},
          recommendedFor: [],
        };
      }
      
      // Calculate skill matches
      const skillMatches: { [skill: string]: number } = {};
      (student.skills || []).forEach(skill => {
        skillMatches[skill.name] = skill.score;
      });
      
      return {
        studentId: match.studentId,
        matchScore: match.matchScore,
        reasons: match.reasons,
        skillMatches,
        recommendedFor: student.profile.preferredRoles || [],
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error matching students to job:', error);
    return [];
  }
}

/**
 * Find students matching recruiter criteria
 */
export async function findMatchingStudents(
  criteria: {
    skills?: string[];
    minScore?: number;
    minReadiness?: number;
    verifiedOnly?: boolean;
    jobType?: string[];
    preferredRoles?: string[];
  }
): Promise<StudentProfile[]> {
  try {
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);
    
    const matches: StudentProfile[] = [];
    
    studentsSnapshot.forEach((doc) => {
      const profile = doc.data() as StudentProfile;
      let matches = true;
      
      // Check readiness
      if (criteria.minReadiness && profile.jobReadinessScore < criteria.minReadiness) {
        matches = false;
      }
      
      // Check verified skills
      if (criteria.verifiedOnly) {
        const hasVerified = (profile.skills || []).some(s => s.verificationStatus === 'verified');
        if (!hasVerified) matches = false;
      }
      
      // Check skills
      if (criteria.skills && criteria.skills.length > 0) {
        const hasRequiredSkills = criteria.skills.some(skillName => {
          const skill = (profile.skills || []).find(s => 
            s.name.toLowerCase().includes(skillName.toLowerCase())
          );
          return skill && skill.score >= (criteria.minScore || 60);
        });
        if (!hasRequiredSkills) matches = false;
      }
      
      // Check job type
      if (criteria.jobType && criteria.jobType.length > 0) {
        const matchesJobType = criteria.jobType.some(jt => 
          (profile.jobType || []).includes(jt as any)
        );
        if (!matchesJobType) matches = false;
      }
      
      // Check preferred roles
      if (criteria.preferredRoles && criteria.preferredRoles.length > 0) {
        const matchesRole = (profile.preferredRoles || []).some(role => 
          criteria.preferredRoles!.some(pr => 
            role.toLowerCase().includes(pr.toLowerCase())
          )
        );
        if (!matchesRole) matches = false;
      }
      
      if (matches) {
        matches.push(profile);
      }
    });
    
    // Sort by readiness score
    return matches.sort((a, b) => b.jobReadinessScore - a.jobReadinessScore);
  } catch (error) {
    console.error('Error finding matching students:', error);
    return [];
  }
}

/**
 * Recommend students to recruiter
 */
export async function recommendStudentsToRecruiter(
  recruiterId: string,
  limit: number = 10
): Promise<StudentProfile[]> {
  try {
    const recruiterRef = doc(db, 'recruiters', recruiterId);
    const recruiterDoc = await getDoc(recruiterRef);
    
    if (!recruiterDoc.exists()) {
      return [];
    }
    
    // Get all students, sorted by readiness
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);
    
    const students: StudentProfile[] = [];
    studentsSnapshot.forEach((doc) => {
      const profile = doc.data() as StudentProfile;
      // Filter out already shortlisted
      const recruiterData = recruiterDoc.data() as RecruiterProfile;
      const shortlisted = recruiterData.shortlistedCandidates || [];
      if (!shortlisted.includes(profile.uid)) {
        students.push(profile);
      }
    });
    
    // Sort by readiness and return top N
    return students
      .sort((a, b) => b.jobReadinessScore - a.jobReadinessScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error recommending students:', error);
    return [];
  }
}
