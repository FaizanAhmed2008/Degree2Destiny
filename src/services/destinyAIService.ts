/**
 * Enhanced Destiny AI Service
 * Provides AI-powered insights tailored to student skills, goals, and career interests
 */

import { StudentProfile, StudentSkill } from '../types';

interface DestinyAIQuestion {
  id: string;
  question: string;
  category: 'skill-assessment' | 'career-fit' | 'growth' | 'motivation';
  difficulty: 'easy' | 'medium' | 'hard';
  relevantSkills?: string[];
}

interface DestinyAIInsight {
  type: 'strength' | 'opportunity' | 'recommendation' | 'warning';
  message: string;
  relevance: number; // 0-100
}

/**
 * Generate personalized Destiny AI questions based on student profile
 */
export function generateDestinyAIQuestions(profile: StudentProfile): DestinyAIQuestion[] {
  const questions: DestinyAIQuestion[] = [];
  
  // Skill-specific questions
  if (profile.skills && profile.skills.length > 0) {
    profile.skills.slice(0, 3).forEach((skill) => {
      questions.push({
        id: `skill_${skill.id}`,
        question: `How do you apply your ${skill.name} skills in real-world projects? Give a specific example.`,
        category: 'skill-assessment',
        difficulty: 'medium',
        relevantSkills: [skill.name],
      });
    });
  }

  // Career-fit questions
  if (profile.preferredRoles && profile.preferredRoles.length > 0) {
    const role = profile.preferredRoles[0];
    questions.push({
      id: 'career_1',
      question: `Why are you interested in a ${role} role? What attracts you to this career path?`,
      category: 'career-fit',
      difficulty: 'medium',
    });

    questions.push({
      id: 'career_2',
      question: `What challenges do you anticipate in transitioning to a ${role} role, and how would you overcome them?`,
      category: 'career-fit',
      difficulty: 'hard',
    });
  }

  // Growth-oriented questions
  questions.push({
    id: 'growth_1',
    question: 'What is one skill you want to master in the next 6 months, and why?',
    category: 'growth',
    difficulty: 'medium',
  });

  questions.push({
    id: 'motivation_1',
    question: 'Describe a technical challenge you solved recently. What did you learn from it?',
    category: 'motivation',
    difficulty: 'hard',
  });

  return questions;
}

/**
 * Generate AI insights based on student profile
 */
export function generateDestinyAIInsights(profile: StudentProfile): DestinyAIInsight[] {
  const insights: DestinyAIInsight[] = [];

  // Skill-based insights
  if (!profile.skills || profile.skills.length === 0) {
    insights.push({
      type: 'warning',
      message: 'You haven\'t added any skills yet. Start by adding your technical skills to help us understand your strengths.',
      relevance: 95,
    });
  } else {
    const verifiedSkills = profile.skills.filter(s => s.verificationStatus === 'verified');
    if (verifiedSkills.length >= 3) {
      insights.push({
        type: 'strength',
        message: `Great job! You have ${verifiedSkills.length} verified skills. This demonstrates commitment to skill validation.`,
        relevance: 90,
      });
    }

    const advancedSkills = profile.skills.filter(s => s.selfLevel === 'advanced' || s.selfLevel === 'expert');
    if (advancedSkills.length > 0) {
      insights.push({
        type: 'strength',
        message: `You have ${advancedSkills.length} advanced skill(s). Consider leading projects or mentoring others in these areas.`,
        relevance: 85,
      });
    }
  }

  // Career readiness insights
  if (profile.jobReadinessScore >= 80) {
    insights.push({
      type: 'recommendation',
      message: 'You\'re highly job-ready! Consider applying to companies or networking to accelerate your opportunities.',
      relevance: 80,
    });
  } else if (profile.jobReadinessScore >= 60) {
    insights.push({
      type: 'recommendation',
      message: 'You\'re on the right track. Focus on strengthening skills in your chosen role to reach higher readiness.',
      relevance: 75,
    });
  } else if (profile.jobReadinessScore >= 40) {
    insights.push({
      type: 'opportunity',
      message: 'Solid foundation! Consider taking skill-specific assessments to identify areas for improvement.',
      relevance: 70,
    });
  }

  // Profile completion insights
  const profileCompletion = calculateProfileCompleteness(profile);
  if (profileCompletion < 50) {
    insights.push({
      type: 'opportunity',
      message: 'Complete your profile to help recruiters and professors understand you better. Add projects, certifications, and links.',
      relevance: 80,
    });
  }

  // Role-based insights
  if (profile.preferredRoles && profile.preferredRoles.length > 0) {
    const primaryRole = profile.preferredRoles[0];
    insights.push({
      type: 'recommendation',
      message: `You're targeting ${primaryRole} roles. Focus on developing the most in-demand skills for this role.`,
      relevance: 85,
    });
  }

  // Skill gap insights
  if (profile.skills && profile.skills.length > 0) {
    const lowScoringSkills = profile.skills.filter(s => s.score < 50);
    if (lowScoringSkills.length > 0) {
      insights.push({
        type: 'opportunity',
        message: `You have ${lowScoringSkills.length} skill(s) that could use improvement. Practice and take assessments to strengthen them.`,
        relevance: 75,
      });
    }
  }

  // Sort by relevance
  return insights.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile: StudentProfile): number {
  let completedFields = 0;
  const totalFields = 8;

  if (profile.fullName) completedFields++;
  if (profile.phoneWhatsApp) completedFields++;
  if (profile.college) completedFields++;
  if (profile.interestedRoleSkill) completedFields++;
  if (profile.skills && profile.skills.length > 0) completedFields++;
  if (profile.projects && profile.projects.length > 0) completedFields++;
  if (profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl) completedFields++;
  if (profile.careerInterests && profile.careerInterests.length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Evaluate student answers to Destiny AI questions
 */
export function evaluateDestinyAIAnswers(
  answers: { questionId: string; answer: string }[],
  profile: StudentProfile
): { score: number; feedback: string; recommendedActions: string[] } {
  let score = 0;
  const feedbacks: string[] = [];
  const recommendedActions: string[] = [];

  answers.forEach((ans) => {
    const answerLength = ans.answer.trim().length;
    
    // Length-based scoring
    if (answerLength >= 200) {
      score += 25;
      feedbacks.push('Excellent - thorough and detailed response.');
    } else if (answerLength >= 100) {
      score += 15;
      feedbacks.push('Good - solid response with adequate detail.');
    } else if (answerLength >= 50) {
      score += 8;
      feedbacks.push('Basic - consider providing more detail.');
    } else {
      feedbacks.push('Brief - expand on your thoughts for better evaluation.');
    }

    // Check for specific keywords indicating quality
    const qualityKeywords = [
      'learned',
      'challenge',
      'overcome',
      'improve',
      'achieve',
      'accomplished',
      'develop',
      'mastered',
    ];
    const hasQualityKeywords = qualityKeywords.some((kw) =>
      ans.answer.toLowerCase().includes(kw)
    );

    if (hasQualityKeywords) {
      score += 5;
      feedbacks.push('Great - demonstrates growth mindset.');
    }
  });

  const normalizedScore = Math.min(100, Math.round((score / (answers.length * 25)) * 100));

  if (normalizedScore >= 80) {
    recommendedActions.push('Your responses show excellent self-awareness. Consider applying to senior/lead roles.');
    recommendedActions.push('Share your journey in interviews - your growth mindset is attractive to employers.');
  } else if (normalizedScore >= 60) {
    recommendedActions.push('Good foundation. Focus on building 1-2 stronger skills for your target role.');
    recommendedActions.push('Take skill-specific assessments to validate your abilities.');
  } else {
    recommendedActions.push('Keep developing your skills. Practice consistently and measure progress.');
    recommendedActions.push('Seek mentorship to accelerate your learning.');
  }

  return {
    score: normalizedScore,
    feedback: feedbacks.join(' '),
    recommendedActions,
  };
}

/**
 * Get role-specific skill recommendations
 */
export function getSkillRecommendationsForRole(role: string): {
  essentialSkills: string[];
  importantSkills: string[];
  niceToHaveSkills: string[];
} {
  const recommendations: {
    [key: string]: {
      essential: string[];
      important: string[];
      niceToHave: string[];
    };
  } = {
    'Software Engineer': {
      essential: ['Programming Languages', 'Data Structures', 'Algorithms', 'Version Control'],
      important: ['System Design', 'Testing', 'Debugging', 'SQL'],
      niceToHave: ['Cloud Platforms', 'Containerization', 'CI/CD', 'Leadership'],
    },
    'Data Scientist': {
      essential: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization'],
      important: ['SQL', 'Data Cleaning', 'Linear Algebra', 'Communication'],
      niceToHave: ['Deep Learning', 'Big Data Tools', 'Business Acumen'],
    },
    'Product Manager': {
      essential: ['Product Strategy', 'User Research', 'Analytics', 'Communication'],
      important: ['Technical Literacy', 'Project Management', 'Problem Solving', 'Leadership'],
      niceToHave: ['Marketing', 'Design Thinking', 'Business Acumen'],
    },
    'UX Designer': {
      essential: ['UI/UX Design', 'Prototyping', 'User Research', 'Design Tools'],
      important: ['Communication', 'Problem Solving', 'Visual Design', 'Accessibility'],
      niceToHave: ['Animation', 'Frontend Development', 'A/B Testing'],
    },
    'DevOps Engineer': {
      essential: ['Linux', 'Cloud Platforms', 'Docker', 'Infrastructure as Code'],
      important: ['Networking', 'Scripting', 'Monitoring', 'Security'],
      niceToHave: ['Kubernetes', 'Terraform', 'GitLab/GitHub CI'],
    },
  };

  const roleRec = recommendations[role];
  if (roleRec) {
    return {
      essentialSkills: roleRec.essential,
      importantSkills: roleRec.important,
      niceToHaveSkills: roleRec.niceToHave,
    };
  }

  // Default if role not found
  return {
    essentialSkills: ['Problem Solving', 'Communication', 'Technical Skills'],
    importantSkills: ['Teamwork', 'Learning Mindset', 'Adaptability'],
    niceToHaveSkills: ['Leadership', 'Mentoring'],
  };
}
