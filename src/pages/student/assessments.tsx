// Student Assessments Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { getStudentProfile } from '../../services/studentService';
import { submitAssessment } from '../../services/studentService';
import { StudentProfile, Assessment, AssessmentType } from '../../types';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const StudentAssessments = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      try {
        const studentProfile = await getStudentProfile(currentUser.uid);
        if (studentProfile) {
          setProfile(studentProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  const handleStartAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setSubmissionContent('');
  };

  const handleSubmitAssessment = async () => {
    if (!currentUser || !selectedAssessment || !submissionContent.trim()) return;

    setSubmitting(true);
    try {
      await submitAssessment(
        currentUser.uid,
        selectedAssessment.id,
        {
          assessmentId: selectedAssessment.id,
          studentId: currentUser.uid,
          content: submissionContent,
          status: 'submitted',
        }
      );
      alert('Assessment submitted successfully!');
      setSelectedAssessment(null);
      setSubmissionContent('');
      // Reload profile
      const updatedProfile = await getStudentProfile(currentUser.uid);
      if (updatedProfile) setProfile(updatedProfile);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Get all assessments from all skills
  const allAssessments: Assessment[] = [];
  profile.skills.forEach(skill => {
    skill.assessments.forEach(assessment => {
      allAssessments.push(assessment);
    });
  });

  const pendingAssessments = allAssessments.filter(a => a.status === 'not-started' || a.status === 'in-progress');
  const completedAssessments = allAssessments.filter(a => a.status === 'submitted' || a.status === 'evaluated');

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Skill Assessments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete assessments to verify and improve your skills.
            </p>
          </div>

          {selectedAssessment ? (
            <AssessmentSubmission
              assessment={selectedAssessment}
              submissionContent={submissionContent}
              setSubmissionContent={setSubmissionContent}
              onSubmit={handleSubmitAssessment}
              onCancel={() => setSelectedAssessment(null)}
              submitting={submitting}
            />
          ) : (
            <div className="space-y-6">
              {/* Pending Assessments */}
              {pendingAssessments.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Available Assessments ({pendingAssessments.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingAssessments.map((assessment) => (
                      <AssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                        onStart={() => handleStartAssessment(assessment)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Assessments */}
              {completedAssessments.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Completed Assessments ({completedAssessments.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedAssessments.map((assessment) => (
                      <AssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                        completed
                      />
                    ))}
                  </div>
                </div>
              )}

              {allAssessments.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No assessments available yet. Add skills to get assessments.
                  </p>
                  <button
                    onClick={() => router.push('/student/skills/add')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Skills
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Assessment Card Component
const AssessmentCard: React.FC<{
  assessment: Assessment;
  onStart?: () => void;
  completed?: boolean;
}> = ({ assessment, onStart, completed }) => {
  const getTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'micro-task':
        return '⚡';
      case 'bug-fix':
        return '🐛';
      case 'scenario':
        return '💭';
      case 'build-challenge':
        return '🏗️';
      default:
        return '📝';
    }
  };

  const getStatusBadge = () => {
    if (completed) {
      if (assessment.status === 'evaluated') {
        return (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
            Evaluated {assessment.score !== undefined ? `(${assessment.score}%)` : ''}
          </span>
        );
      }
      return (
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
          Submitted
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">
        {assessment.status === 'in-progress' ? 'In Progress' : 'Not Started'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getTypeIcon(assessment.type)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {assessment.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {assessment.type.replace('-', ' ')}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {assessment.description}
      </p>

      {assessment.submission?.feedback && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback:</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.submission.feedback}</p>
        </div>
      )}

      {!completed && onStart && (
        <button
          onClick={onStart}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {assessment.status === 'in-progress' ? 'Continue' : 'Start Assessment'}
        </button>
      )}
    </div>
  );
};

// Assessment Submission Component
const AssessmentSubmission: React.FC<{
  assessment: Assessment;
  submissionContent: string;
  setSubmissionContent: (content: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}> = ({ assessment, submissionContent, setSubmissionContent, onSubmit, onCancel, submitting }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {assessment.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {assessment.description}
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Instructions:</h3>
          <p className="text-sm text-indigo-800 dark:text-indigo-200 whitespace-pre-wrap">
            {assessment.instructions}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Submission
        </label>
        <textarea
          value={submissionContent}
          onChange={(e) => setSubmissionContent(e.target.value)}
          placeholder="Enter your solution, code, or response here..."
          rows={12}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          You can paste code, write explanations, or provide links to your work.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!submissionContent.trim() || submitting}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default StudentAssessments;
