// Professor Verification Requests Component
import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { approveStudentVerification, rejectStudentVerification } from '../services/studentService';

interface VerificationRequestsProps {
  requests: StudentProfile[];
  onProcessed?: () => void;
  loading?: boolean;
  professorId?: string;
}

export const VerificationRequests: React.FC<VerificationRequestsProps> = ({
  requests,
  onProcessed,
  loading = false,
  professorId = 'professor-uid-placeholder',
}) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const handleApprove = async (studentId: string) => {
    setProcessing(studentId);
    try {
      await approveStudentVerification(studentId, professorId);
      console.log('[Firestore Write] Student verification approved', { studentId, professorId });
      alert('Student verification approved!');
      if (onProcessed) {
        onProcessed();
      }
    } catch (error: any) {
      console.error('[Firestore Write Error] Failed to approve verification:', error);
      alert(error.message || 'Failed to approve verification. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (studentId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    setProcessing(studentId);
    try {
      await rejectStudentVerification(studentId, professorId, reason || undefined);
      console.log('[Firestore Write] Student verification rejected', { studentId, professorId });
      alert('Student verification rejected.');
      if (onProcessed) {
        onProcessed();
      }
    } catch (error: any) {
      console.error('[Firestore Write Error] Failed to reject verification:', error);
      alert(error.message || 'Failed to reject verification. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Verification Requests
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No pending verification requests.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Verification Requests ({requests.length})
      </h2>

      <div className="space-y-3">
        {requests.map((student) => (
          <div
            key={student.uid}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Request Header */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() =>
                setExpandedStudentId(
                  expandedStudentId === student.uid ? null : student.uid
                )
              }
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {student.fullName || student.displayName || 'Unknown Student'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {student.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full">
                  PENDING
                </span>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                    expandedStudentId === student.uid ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedStudentId === student.uid && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* Student Information */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">College</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.college || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.phoneWhatsApp || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Skills Summary */}
                {student.skills && student.skills.length > 0 && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                      Skills ({student.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.slice(0, 5).map((skill) => (
                        <div
                          key={skill.id}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center gap-1"
                        >
                          {skill.name}
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {skill.score}/100
                          </span>
                        </div>
                      ))}
                      {student.skills.length > 5 && (
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                          +{student.skills.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Readiness */}
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                    Job Readiness Score
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          student.jobReadinessScore >= 80
                            ? 'bg-green-600'
                            : student.jobReadinessScore >= 60
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${student.jobReadinessScore}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white w-12 text-right">
                      {student.jobReadinessScore}%
                    </span>
                  </div>
                </div>

                {/* Request Timestamp */}
                {student.requestedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requested on{' '}
                    {new Date(
                      student.requestedAt.seconds
                        ? student.requestedAt.seconds * 1000
                        : student.requestedAt
                    ).toLocaleDateString()}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => handleApprove(student.uid)}
                    disabled={processing === student.uid || loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {processing === student.uid ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(student.uid)}
                    disabled={processing === student.uid || loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {processing === student.uid ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerificationRequests;
