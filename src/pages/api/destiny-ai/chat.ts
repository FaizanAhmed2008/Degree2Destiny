// Destiny AI chat API – thin wrapper around existing AI chat handler
import type { NextApiRequest, NextApiResponse } from 'next';
import { chatWithAI, AIPromptContext } from '../../../services/aiService';

export default async function destinyAIHandler(
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

    console.log('[Destiny AI] /api/destiny-ai/chat request', {
      role,
      hasContext: !!contextData,
      messagePreview: String(message).slice(0, 80),
    });

    const aiContext: AIPromptContext = {
      role,
      data: contextData || {},
    };

    const response = await chatWithAI(message, aiContext);

    console.log('[Destiny AI] /api/destiny-ai/chat success', {
      role,
      responsePreview: String(response).slice(0, 120),
    });

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error('[Destiny AI] Error in chat API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

