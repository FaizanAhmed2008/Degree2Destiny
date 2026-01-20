// API Route to save interview transcripts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { InterviewTranscript } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studentId, skillId, transcript } = req.body;

    if (!studentId || !skillId || !transcript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update student document with interview transcript
    const studentRef = doc(db, 'students', studentId);
    
    await updateDoc(studentRef, {
      [`interviewTranscripts.${skillId}`]: transcript,
      updatedAt: serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true,
      message: 'Transcript saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving interview transcript:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to save transcript' 
    });
  }
}
