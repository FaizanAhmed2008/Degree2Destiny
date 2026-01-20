// API Route for AI Skill Interview
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  startInterviewSession,
  sendInterviewAnswer,
  getInterviewTranscript,
  endInterviewSession,
} from '../../../services/aiInterviewService';
import { SkillLevel } from '../../../types';

interface StartInterviewRequest {
  skillName: string;
  skillLevel: SkillLevel;
}

interface AnswerInterviewRequest {
  sessionId: string;
  answer: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.query.action as string;

  try {
    if (action === 'start') {
      const { skillName, skillLevel } = req.body as StartInterviewRequest;

      if (!skillName || typeof skillName !== 'string' || skillName.trim().length === 0) {
        return res.status(400).json({ error: 'Valid skill name is required' });
      }

      if (!skillLevel || !['beginner', 'intermediate', 'advanced', 'expert'].includes(skillLevel)) {
        return res.status(400).json({ error: 'Valid skill level is required' });
      }

      const result = await startInterviewSession(skillName.trim(), skillLevel);
      return res.status(200).json(result);
    }

    if (action === 'answer') {
      const { sessionId, answer } = req.body as AnswerInterviewRequest;

      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
        return res.status(400).json({ error: 'Valid session ID is required' });
      }

      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        return res.status(400).json({ error: 'Answer cannot be empty' });
      }

      if (answer.length > 10000) {
        return res.status(400).json({ error: 'Answer is too long' });
      }

      const result = await sendInterviewAnswer(sessionId, answer);
      return res.status(200).json(result);
    }

    if (action === 'transcript') {
      const { sessionId } = req.body as { sessionId: string };

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Valid session ID is required' });
      }

      const transcript = getInterviewTranscript(sessionId);
      return res.status(200).json({ transcript });
    }

    if (action === 'end') {
      const { sessionId } = req.body as { sessionId: string };

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Valid session ID is required' });
      }

      endInterviewSession(sessionId);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    console.error('[AI Interview API] Error:', error);
    const errorMessage = error?.message || 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}
