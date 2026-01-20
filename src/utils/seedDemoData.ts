// Demo Data Seeding Utility
// This utility helps create demo students with varied skill points for presentation

import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { StudentProfile, StudentSkill } from '../types';

// Sample skills with varied points
const SAMPLE_SKILLS = [
  { name: 'React', category: 'Frontend', points: [65, 75, 85, 90, 55] },
  { name: 'Node.js', category: 'Backend', points: [70, 60, 80, 75, 65] },
  { name: 'Python', category: 'Programming', points: [80, 70, 65, 85, 75] },
  { name: 'JavaScript', category: 'Programming', points: [75, 85, 70, 80, 90] },
  { name: 'TypeScript', category: 'Programming', points: [60, 70, 80, 65, 55] },
  { name: 'MongoDB', category: 'Database', points: [65, 75, 70, 60, 80] },
  { name: 'SQL', category: 'Database', points: [70, 80, 75, 85, 65] },
  { name: 'Docker', category: 'DevOps', points: [55, 65, 70, 60, 75] },
  { name: 'AWS', category: 'Cloud', points: [60, 70, 65, 75, 55] },
  { name: 'Git', category: 'Tools', points: [85, 90, 80, 75, 70] },
];

const SAMPLE_NAMES = [
  'Alex Johnson',
  'Sarah Chen',
  'Michael Brown',
  'Emily Davis',
  'James Wilson',
];

const SAMPLE_ROLES = [
  ['Full Stack Developer', 'Frontend Developer'],
  ['Backend Developer', 'API Developer'],
  ['Frontend Developer', 'UI/UX Developer'],
  ['DevOps Engineer', 'Cloud Engineer'],
  ['Software Engineer', 'Full Stack Developer'],
];

/**
 * Generate demo student data
 * This function creates sample students with varied skill points for demo purposes
 */
export async function seedDemoStudents() {
  console.log('Starting demo data seeding...');
  
  const studentPromises = SAMPLE_NAMES.map(async (name, index) => {
    const email = `demo.student${index + 1}@degree2destiny.com`;
    const uid = `demo-student-${index + 1}`;
    
    // Create varied skills for each student
    const skills: StudentSkill[] = [];
    SAMPLE_SKILLS.forEach((skillTemplate, skillIndex) => {
      const score = skillTemplate.points[index] || Math.floor(Math.random() * 40) + 60;
      
      skills.push({
        id: `skill-${uid}-${skillIndex}`,
        name: skillTemplate.name,
        category: skillTemplate.category,
        selfLevel: score >= 80 ? 'advanced' : score >= 65 ? 'intermediate' : 'beginner',
        score: score,
        proofLinks: [],
        verificationStatus: Math.random() > 0.5 ? 'verified' : 'pending',
        assessments: [],
        lastUpdated: serverTimestamp(),
      });
    });

    // Calculate readiness score
    const avgScore = Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length);
    const readinessScore = Math.min(100, avgScore + Math.floor(Math.random() * 10));
    
    // Determine readiness level
    let readinessLevel: 'not-ready' | 'developing' | 'ready' | 'highly-ready' = 'developing';
    if (readinessScore >= 85) readinessLevel = 'highly-ready';
    else if (readinessScore >= 70) readinessLevel = 'ready';
    else if (readinessScore >= 50) readinessLevel = 'developing';
    else readinessLevel = 'not-ready';

    // Generate mock Destiny scores
    const aptitudeScore = 40 + Math.floor(Math.random() * 61);
    const technicalScore = 40 + Math.floor(Math.random() * 61);
    const communicationScore = 40 + Math.floor(Math.random() * 61);
    const overallScore = Math.round((aptitudeScore + technicalScore + communicationScore) / 3);

    const studentData: Partial<StudentProfile> = {
      uid,
      email,
      role: 'student',
      displayName: name,
      careerInterests: ['Software Development', 'Web Development'],
      preferredRoles: SAMPLE_ROLES[index] || ['Software Developer'],
      jobType: ['full-time', 'internship'],
      skills,
      projects: [],
      achievements: [],
      certifications: [],
      onboardingCompleted: true,
      onboardingStep: 3,
      jobReadinessScore: readinessScore,
      jobReadinessLevel: readinessLevel,
      aptitudeScore,
      technicalScore,
      communicationScore,
      overallScore,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'students', uid), studentData);
      console.log(`✓ Created demo student: ${name}`);
    } catch (error) {
      console.error(`✗ Failed to create ${name}:`, error);
    }
  });

  await Promise.all(studentPromises);
  console.log('Demo data seeding completed!');
}

/**
 * Instructions for manual seeding:
 * 
 * 1. Import this function in a component or page
 * 2. Call seedDemoStudents() from a button click or useEffect
 * 3. Check Firebase console to verify data
 * 
 * Example usage:
 * ```tsx
 * import { seedDemoStudents } from '../utils/seedDemoData';
 * 
 * // In your component
 * <button onClick={seedDemoStudents}>Seed Demo Data</button>
 * ```
 */
