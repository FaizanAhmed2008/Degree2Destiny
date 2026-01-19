// AI Service for Gemini Integration
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  } else {
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will use fallback responses.');
  }
} catch (error) {
  console.error('Error initializing Gemini AI:', error);
}

export interface AIPromptContext {
  role: 'student' | 'professor' | 'recruiter';
  data: any; // Sanitized data only
}

/**
 * Analyze student skills and generate insights
 */
export async function analyzeStudentSkills(
  studentData: {
    skills: Array<{ name: string; score: number; category: string }>;
    projects: Array<{ title: string; technologies: string[] }>;
    careerInterests: string[];
    preferredRoles: string[];
  }
): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedRoles: Array<{
    role: string;
    matchScore: number;
    reasoning: string;
  }>;
}> {
  const prompt = `You are an AI career advisor analyzing a student's profile. Analyze the following data and provide insights:

Student Skills:
${JSON.stringify(studentData.skills, null, 2)}

Projects:
${JSON.stringify(studentData.projects, null, 2)}

Career Interests: ${studentData.careerInterests.join(', ')}
Preferred Roles: ${studentData.preferredRoles.join(', ')}

Provide a JSON response with:
1. strengths: Array of top 3-5 strengths
2. weaknesses: Array of 3-5 areas needing improvement
3. recommendations: Array of 5-7 actionable recommendations
4. suggestedRoles: Array of 3-5 role suggestions with matchScore (0-100) and reasoning

Format your response as valid JSON only, no markdown.`;

  try {
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
      suggestedRoles: parsed.suggestedRoles || [],
    };
  } catch (error) {
    console.error('Error analyzing student skills:', error);
    // Return default structure on error
    return {
      strengths: [],
      weaknesses: [],
      recommendations: ['Continue building projects and gaining experience'],
      suggestedRoles: [],
    };
  }
}

/**
 * Generate learning roadmap for a student
 */
export async function generateLearningRoadmap(
  skillGaps: string[],
  targetRole: string
): Promise<Array<{
  skill: string;
  priority: 'high' | 'medium' | 'low';
  steps: string[];
  resources: Array<{ title: string; url: string; type: string }>;
  estimatedTime: string;
}>> {
  const prompt = `Create a personalized learning roadmap for a student targeting the role: ${targetRole}

Skill Gaps to Address:
${skillGaps.join(', ')}

Provide a JSON array of learning items, each with:
- skill: skill name
- priority: "high", "medium", or "low"
- steps: array of 3-5 actionable steps
- resources: array of 2-3 learning resources (with title, url, type)
- estimatedTime: estimated time to complete (e.g., "2 weeks", "1 month")

Format as valid JSON array only.`;

  try {
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating learning roadmap:', error);
    return [];
  }
}

/**
 * Generate professor feedback draft
 */
export async function generateProfessorFeedback(
  assessmentSubmission: {
    content: string;
    assessmentTitle: string;
    studentSkillLevel: string;
  }
): Promise<{
  feedback: string;
  score: number;
  strengths: string[];
  improvements: string[];
}> {
  const prompt = `You are a professor providing feedback on a student's assessment submission.

Assessment: ${assessmentSubmission.assessmentTitle}
Student Skill Level: ${assessmentSubmission.studentSkillLevel}
Submission: ${assessmentSubmission.content.substring(0, 2000)}

Provide constructive feedback in JSON format:
- feedback: Detailed feedback (3-5 sentences)
- score: Score out of 100
- strengths: Array of 2-3 strengths observed
- improvements: Array of 2-3 areas for improvement

Format as valid JSON only.`;

  try {
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating professor feedback:', error);
    return {
      feedback: 'Please review the submission and provide detailed feedback.',
      score: 70,
      strengths: [],
      improvements: [],
    };
  }
}

/**
 * Match students to job descriptions
 */
export async function matchStudentsToJob(
  jobDescription: string,
  students: Array<{
    id: string;
    skills: Array<{ name: string; score: number }>;
    readinessScore: number;
  }>
): Promise<Array<{
  studentId: string;
  matchScore: number;
  reasons: string[];
}>> {
  const prompt = `Match students to this job description:

Job Description:
${jobDescription}

Students:
${JSON.stringify(students, null, 2)}

For each student, provide:
- studentId: student ID
- matchScore: 0-100 match score
- reasons: Array of 3-5 reasons for the match

Format as JSON array.`;

  try {
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error matching students to job:', error);
    return [];
  }
}

/**
 * Generate improvement suggestions for a skill
 */
export async function generateImprovementSuggestions(
  skillName: string,
  currentScore: number,
  targetScore: number
): Promise<{
  actionItems: string[];
  resources: Array<{ title: string; url: string; type: string }>;
  timeline: string;
}> {
  const prompt = `Generate improvement suggestions for a student's skill:

Skill: ${skillName}
Current Score: ${currentScore}/100
Target Score: ${targetScore}/100

Provide:
- actionItems: Array of 5-7 actionable steps
- resources: Array of 3-5 learning resources
- timeline: Estimated timeline to reach target

Format as JSON.`;

  try {
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    return {
      actionItems: ['Practice regularly', 'Build projects', 'Seek feedback'],
      resources: [],
      timeline: '2-3 months',
    };
  }
}

/**
 * Chat with AI assistant (context-aware)
 */
export async function chatWithAI(
  message: string,
  context: AIPromptContext
): Promise<string> {
  const roleContext = {
    student: 'You are an AI career advisor helping a student improve their skills and career prospects.',
    professor: 'You are an AI assistant helping a professor manage and guide students.',
    recruiter: 'You are an AI assistant helping a recruiter find the best candidates.',
  };

  const prompt = `${roleContext[context.role]}

User Message: ${message}

Context Data:
${JSON.stringify(context.data, null, 2)}

Provide a helpful, concise response (2-4 sentences).`;

  try {
    if (!model) {
      // Return helpful fallback message if Gemini is not configured
      return 'I apologize, but the AI assistant is not fully configured. Please ensure NEXT_PUBLIC_GEMINI_API_KEY is set in your environment variables. For now, I can help with basic questions about the platform.';
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    // Provide more helpful error messages
    if (error.message?.includes('API_KEY')) {
      return 'I apologize, but there was an issue with the AI service configuration. Please check your API key settings.';
    }
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return 'I apologize, but the AI service is currently experiencing high demand. Please try again in a moment.';
    }
    return 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.';
  }
}
