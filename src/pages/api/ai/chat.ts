// API Route for AI Chat
import type { NextApiRequest, NextApiResponse } from 'next';
import { chatWithAI, AIPromptContext } from '../../../services/aiService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, role, contextData } = req.body;

    if (!message || !role) {
      return res.status(400).json({ error: 'Message and role are required' });
    }

    const aiContext: AIPromptContext = {
      role,
      data: contextData || {},
    };

    const response = await chatWithAI(message, aiContext);

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error('Error in AI chat API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
