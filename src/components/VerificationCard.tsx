// Verification Status Card Component
import React, { useState } from 'react';
import { StudentProfile, VerificationStatus } from '../types';
import { requestStudentVerification } from '../services/studentService';

interface VerificationCardProps {
  profile: StudentProfile;
  onVerificationRequested?: () => void;
  loading?: boolean;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  profile,
  onVerificationRequested,
  loading = false,
}) => {
  const [requesting, setRequesting] = useState(false);

  const verificationStatus = (profile.verificationStatus || 'not-requested') as VerificationStatus;

  const handleRequestVerification = async () => {
    setRequesting(true);
    try {
      await requestStudentVerification(profile.uid);
      console.log('[UI] Verification request submitted');
      alert('Verification request submitted to professors!');
      if (onVerificationRequested) {
        onVerificationRequested();
      }
    } catch (error: any) {
      console.error('[UI] Verification request failed:', error);
      alert(
        error.message || 'Failed to request verification. Please try again.'
      );
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadgeColor = (): string => {
    switch (verificationStatus) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'not-requested':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = (): string => {
    switch (verificationStatus) {
      case 'verified':
        return '✓ Your profile has been verified by a professor';
      case 'pending':
        return '⏳ Your verification request is pending. A professor will review soon.';
      case 'rejected':
        return '✗ Your verification request was rejected. Please contact your professor.';
      case 'not-requested':
        return 'Request verification to be visible to HR and recruiters';
      default:
        return '';
    }
  };

  const getStatusTimestamp = (): string | null => {
    if (verificationStatus === 'pending' && profile.requestedAt) {
      const date = new Date(
        profile.requestedAt.seconds ? profile.requestedAt.seconds * 1000 : profile.requestedAt
      );
      return `Requested: ${date.toLocaleDateString()}`;
    }
    if (verificationStatus === 'verified' && profile.verifiedAt) {
      const date = new Date(
        profile.verifiedAt.seconds ? profile.verifiedAt.seconds * 1000 : profile.verifiedAt
      );
      return `Verified: ${date.toLocaleDateString()}`;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Verification Status
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${getStatusBadgeColor()}`}
        >
          {verificationStatus.toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          {getStatusMessage()}
        </p>
        {getStatusTimestamp() && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getStatusTimestamp()}
          </p>
        )}
      </div>

      {verificationStatus === 'not-requested' && (
        <button
          onClick={handleRequestVerification}
          disabled={requesting || loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {requesting ? 'Requesting...' : 'Request Verification'}
        </button>
      )}

      {verificationStatus === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">
            You can request verification again after updating your profile with more
            comprehensive information about your skills and experience.
          </p>
          <button
            onClick={handleRequestVerification}
            disabled={requesting || loading}
            className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {requesting ? 'Requesting...' : 'Request Verification Again'}
          </button>
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-700 dark:text-green-300">
            Your profile is now visible to HR and recruiters. Great job!
          </p>
          {profile.verifiedBy && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Verified by professor: {profile.verifiedBy}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationCard;
