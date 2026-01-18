// API Route for generating student insights
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateStudentInsights } from '../../../services/studentService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    await generateStudentInsights(studentId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
