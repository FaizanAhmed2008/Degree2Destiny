// AI Interview Service - Interview conversation and evaluation
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  InterviewTranscript,
  InterviewEvaluation,
  InterviewMessage,
  SkillLevel,
} from '../types';

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    '';

  if (apiKey && apiKey.trim() !== '') {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
} catch (error) {
  console.error('[AI Interview] Error initializing Gemini:', error);
}

// Store active interview sessions in memory
const interviewSessions: {
  [sessionId: string]: {
    chat: any;
    transcript: InterviewMessage[];
    questionCount: number;
    skillName: string;
    skillLevel: SkillLevel;
  };
} = {};

/**
 * Sanitize user input
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 5000)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
}

/**
 * Start a new AI interview session
 */
export async function startInterviewSession(
  skillName: string,
  skillLevel: SkillLevel
): Promise<{
  sessionId: string;
  firstQuestion: string;
}> {
  if (!model) {
    throw new Error('Gemini AI model not initialized');
  }

  const sessionId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const systemPrompt = `You are a professional technical interviewer for the ${skillName} skill.

CRITICAL RULES (MUST FOLLOW EXACTLY):
1. You MUST ask exactly ONE clear question per message. NO multi-part questions.
2. Questions must be specific and focused.
3. Ask progressively: Q1-2 basic, Q3-4 intermediate, Q5 advanced.
4. Only provide evaluation AFTER the 5th answer.
5. ONLY provide evaluation in pure JSON (no extra text).

QUESTION PROGRESSION:
- Q1: What is ${skillName}? Core concepts and use cases.
- Q2: Key features and characteristics of ${skillName}.
- Q3: Practical problem using ${skillName}. Solve it.
- Q4: Scenario: How would you handle [edge case] with ${skillName}?
- Q5: Advanced: Design a system using ${skillName} that handles [complexity].

AFTER Q5 ANSWER, provide ONLY this JSON (no text before or after):
{
  "score": <0-100>,
  "skillLevel": "beginner|intermediate|advanced",
  "strengths": ["s1", "s2", "s3"],
  "weaknesses": ["w1", "w2"],
  "feedback": "concise feedback",
  "questionScores": [
    {"questionNumber": 1, "question": "...", "score": <0-100>, "feedback": "..."},
    {"questionNumber": 2, "question": "...", "score": <0-100>, "feedback": "..."},
    {"questionNumber": 3, "question": "...", "score": <0-100>, "feedback": "..."},
    {"questionNumber": 4, "question": "...", "score": <0-100>, "feedback": "..."},
    {"questionNumber": 5, "question": "...", "score": <0-100>, "feedback": "..."}
  ]
}

Candidate level: ${skillLevel}

BEGIN INTERVIEW - START WITH Q1 ONLY:`;

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [
          {
            text: `What is ${skillName}? Explain its core concepts, what it is used for, and the main problems it solves.`,
          },
        ],
      },
    ],
  });

  const firstQuestion = `What is ${skillName}? Explain its core concepts, what it is used for, and the main problems it solves.`;

  interviewSessions[sessionId] = {
    chat,
    transcript: [
      {
        role: 'interviewer',
        content: firstQuestion,
        questionNumber: 1,
        timestamp: new Date().toISOString(),
      },
    ],
    questionCount: 1,
    skillName,
    skillLevel,
  };

  return {
    sessionId,
    firstQuestion,
  };
}

/**
 * Send answer and get next question
 */
export async function sendInterviewAnswer(
  sessionId: string,
  answer: string
): Promise<{
  isComplete: boolean;
  nextQuestion?: string;
  evaluation?: InterviewEvaluation;
  transcript: InterviewMessage[];
}> {
  const session = interviewSessions[sessionId];
  if (!session) {
    throw new Error('Interview session not found');
  }

  if (!answer || typeof answer !== 'string') {
    throw new Error('Invalid answer provided');
  }

  const sanitizedAnswer = sanitizeInput(answer);
  if (!sanitizedAnswer) {
    throw new Error('Answer cannot be empty');
  }

  // Add student's answer to transcript
  session.transcript.push({
    role: 'student',
    content: sanitizedAnswer,
    timestamp: new Date().toISOString(),
  });

  let aiResponse: string;
  try {
    const response = await session.chat.sendMessage(sanitizedAnswer);
    aiResponse = response.response.text();
  } catch (error: any) {
    console.error('[AI Interview] Error sending message to Gemini:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  }

  if (!aiResponse || typeof aiResponse !== 'string') {
    throw new Error('Invalid response from AI');
  }

  // Check if this is the evaluation (JSON format with score)
  const isEvaluation = aiResponse.trim().startsWith('{') && aiResponse.includes('"score"');

  if (isEvaluation) {
    try {
      // Extract JSON - handle case where it might have extra text
      let jsonStr = aiResponse;
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('JSON brackets not found');
      }

      jsonStr = aiResponse.substring(jsonStart, jsonEnd + 1);

      // Validate JSON
      const evaluation = JSON.parse(jsonStr) as InterviewEvaluation;

      // Validate required fields
      if (
        typeof evaluation.score !== 'number' ||
        !evaluation.skillLevel ||
        !Array.isArray(evaluation.strengths) ||
        !Array.isArray(evaluation.weaknesses)
      ) {
        throw new Error('Invalid evaluation structure');
      }

      evaluation.evaluatedAt = new Date().toISOString();

      // Add evaluation to transcript
      session.transcript.push({
        role: 'interviewer',
        content: 'Interview completed. Evaluation provided.',
        timestamp: new Date().toISOString(),
      });

      return {
        isComplete: true,
        evaluation,
        transcript: session.transcript,
      };
    } catch (parseError: any) {
      console.error('[AI Interview] Failed to parse evaluation:', parseError, aiResponse);
      throw new Error(
        'Failed to parse evaluation results. The interview could not be completed properly.'
      );
    }
  }

  // This is a new question
  if (session.questionCount >= 5) {
    throw new Error(
      'Interview exceeded maximum questions. Please complete the current session.'
    );
  }

  session.questionCount++;

  // Validate question format
  const questionTrimmed = aiResponse.trim();
  if (questionTrimmed.length === 0) {
    throw new Error('AI provided empty question');
  }

  if (questionTrimmed.length > 2000) {
    throw new Error('AI question too long');
  }

  session.transcript.push({
    role: 'interviewer',
    content: questionTrimmed,
    questionNumber: session.questionCount,
    timestamp: new Date().toISOString(),
  });

  return {
    isComplete: false,
    nextQuestion: questionTrimmed,
    transcript: session.transcript,
  };
}

/**
 * Get interview transcript
 */
export function getInterviewTranscript(sessionId: string): InterviewMessage[] {
  const session = interviewSessions[sessionId];
  return session?.transcript || [];
}

/**
 * End interview session (cleanup)
 */
export function endInterviewSession(sessionId: string): void {
  delete interviewSessions[sessionId];
}

/**
 * Map evaluation score to skill level
 */
export function mapScoreToSkillLevel(score: number): SkillLevel {
  if (score >= 80) return 'advanced';
  if (score >= 60) return 'intermediate';
  if (score >= 40) return 'beginner';
  return 'beginner';
}
