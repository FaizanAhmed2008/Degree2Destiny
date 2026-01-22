// Matching Service - Match students to roles and recruiters
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { StudentProfile, MatchingResult, RecruiterProfile } from '../types';

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
    
    // Rule-based matching (no AI)
    const matches = students.map(student => {
      // Calculate skill matches
      const skillMatches: { [skill: string]: number } = {};
      (student.skills || []).forEach(skill => {
        skillMatches[skill.name] = skill.score;
      });
      
      // Simple matching: base on readiness score and verified skills
      const verifiedSkillCount = student.profile.skills?.filter(s => s.verificationStatus === 'verified').length || 0;
      const avgSkillScore = student.skills?.length ? 
        student.skills.reduce((sum, s) => sum + s.score, 0) / student.skills.length : 0;
      
      const matchScore = (student.readinessScore * 0.5) + (avgSkillScore * 0.3) + (verifiedSkillCount * 5);
      
      return {
        studentId: student.id,
        matchScore: Math.min(100, matchScore),
        reasons: [
          `Readiness Score: ${student.readinessScore}`,
          `Average Skill Level: ${Math.round(avgSkillScore)}`,
          `Verified Skills: ${verifiedSkillCount}`,
        ],
        skillMatches,
        recommendedFor: student.profile.preferredRoles || [],
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    return matches;
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
      let isMatch = true;
      
      // Check readiness
      if (criteria.minReadiness && profile.jobReadinessScore < criteria.minReadiness) {
        isMatch = false;
      }
      
      // Check verified skills
      if (criteria.verifiedOnly) {
        const hasVerified = (profile.skills || []).some(s => s.verificationStatus === 'verified');
        if (!hasVerified) isMatch = false;
      }
      
      // Check skills
      if (criteria.skills && criteria.skills.length > 0) {
        const hasRequiredSkills = criteria.skills.some(skillName => {
          const skill = (profile.skills || []).find(s => 
            s.name.toLowerCase().includes(skillName.toLowerCase())
          );
          return skill && skill.score >= (criteria.minScore || 60);
        });
        if (!hasRequiredSkills) isMatch = false;
      }
      
      // Check job type
      if (criteria.jobType && criteria.jobType.length > 0) {
        const matchesJobType = criteria.jobType.some(jt => 
          (profile.jobType || []).includes(jt as any)
        );
        if (!matchesJobType) isMatch = false;
      }
      
      // Check preferred roles
      if (criteria.preferredRoles && criteria.preferredRoles.length > 0) {
        const matchesRole = (profile.preferredRoles || []).some(role => 
          criteria.preferredRoles!.some(pr => 
            role.toLowerCase().includes(pr.toLowerCase())
          )
        );
        if (!matchesRole) isMatch = false;
      }
      
      if (isMatch) {
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
