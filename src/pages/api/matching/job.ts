// API Route for matching students to jobs
import type { NextApiRequest, NextApiResponse } from 'next';
import { matchStudentsToJobDescription } from '../../../services/matchingService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, filters } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const matches = await matchStudentsToJobDescription(jobDescription, filters);

    return res.status(200).json({ matches });
  } catch (error: any) {
    console.error('Error matching students:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
