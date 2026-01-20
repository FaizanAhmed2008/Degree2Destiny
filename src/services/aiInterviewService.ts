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
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
  };
} = {};

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

  const systemPrompt = `You are a professional technical interviewer assessing a candidate's ${skillName} skill. 

Your task:
1. Ask exactly 5 questions total to evaluate the candidate's knowledge
2. Start with basic conceptual questions (Q1-Q2)
3. Progress to intermediate problem-solving (Q3-Q4)
4. End with an advanced scenario (Q5)
5. Ask follow-up questions if answers are weak or incomplete
6. Evaluate based on technical depth, problem-solving, and clarity
7. Keep questions focused on ${skillName} and related concepts

Candidate's self-reported level: ${skillLevel}

Interview Format:
- Ask one question at a time
- Wait for the answer before proceeding
- After Q5 and final answer, provide evaluation in JSON format

When providing evaluation (ONLY after all 5 questions are answered), return EXACTLY this JSON format:
{
  "score": <0-100 number>,
  "skillLevel": "<beginner|intermediate|advanced>",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "feedback": "detailed feedback",
  "questionScores": [
    {"questionNumber": 1, "question": "Q1 text", "score": <0-100>, "feedback": "feedback"},
    {"questionNumber": 2, "question": "Q2 text", "score": <0-100>, "feedback": "feedback"},
    {"questionNumber": 3, "question": "Q3 text", "score": <0-100>, "feedback": "feedback"},
    {"questionNumber": 4, "question": "Q4 text", "score": <0-100>, "feedback": "feedback"},
    {"questionNumber": 5, "question": "Q5 text", "score": <0-100>, "feedback": "feedback"}
  ]
}

Start the interview now with your first question about ${skillName}.`;

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
            text: `Thank you for providing the context. I'm ready to conduct a ${skillLevel}-level interview for the ${skillName} skill. Let me start with our first question.\n\n**Question 1: Basic Concepts**\nCan you explain what ${skillName} is and describe its key characteristics or core principles? What problems does it solve?`,
          },
        ],
      },
    ],
  });

  const firstQuestion = `Can you explain what ${skillName} is and describe its key characteristics or core principles? What problems does it solve?`;

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

  // Add student's answer to transcript
  session.transcript.push({
    role: 'student',
    content: answer,
    timestamp: new Date().toISOString(),
  });

  // Send answer to Gemini
  const response = await session.chat.sendMessage(answer);
  const aiResponse = response.response.text();

  // Check if we've completed 5 questions and received evaluation
  const isEvaluationResponse = aiResponse.includes('{') && aiResponse.includes('"score"');

  if (isEvaluationResponse) {
    // Extract JSON evaluation
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse evaluation response');
    }

    const evaluation = JSON.parse(jsonMatch[0]) as InterviewEvaluation;
    evaluation.evaluatedAt = new Date().toISOString();

    // Add evaluation message to transcript
    session.transcript.push({
      role: 'interviewer',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    });

    return {
      isComplete: true,
      evaluation,
      transcript: session.transcript,
    };
  }

  // Extract next question (increment question count)
  session.questionCount++;

  session.transcript.push({
    role: 'interviewer',
    content: aiResponse,
    questionNumber: session.questionCount,
    timestamp: new Date().toISOString(),
  });

  return {
    isComplete: false,
    nextQuestion: aiResponse,
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
