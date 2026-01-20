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

      if (!skillName || !skillLevel) {
        return res.status(400).json({ error: 'Skill name and level are required' });
      }

      const result = await startInterviewSession(skillName, skillLevel);
      return res.status(200).json(result);
    }

    if (action === 'answer') {
      const { sessionId, answer } = req.body as AnswerInterviewRequest;

      if (!sessionId || !answer) {
        return res.status(400).json({ error: 'Session ID and answer are required' });
      }

      const result = await sendInterviewAnswer(sessionId, answer);
      return res.status(200).json(result);
    }

    if (action === 'transcript') {
      const { sessionId } = req.body as { sessionId: string };

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const transcript = getInterviewTranscript(sessionId);
      return res.status(200).json({ transcript });
    }

    if (action === 'end') {
      const { sessionId } = req.body as { sessionId: string };

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      endInterviewSession(sessionId);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    console.error('Error in interview API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
