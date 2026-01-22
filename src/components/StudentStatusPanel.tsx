import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { deleteStudentAccount, updateStudentStatus, updateProfileVisibility } from '../services/studentService';
import { deleteUser } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

interface StudentStatusPanelProps {
  studentId: string;
  currentStatus?: 'ready-to-work' | 'skill-building' | 'studying' | 'actively-looking';
  currentVisibility?: 'visible-to-all' | 'visible-to-hr' | 'visible-to-professor' | 'hidden';
  onStatusUpdated?: () => void;
  onAccountDeleted?: () => void;
}

const statusOptions = [
  { value: 'ready-to-work', label: '💼 Ready to Work', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
  { value: 'actively-looking', label: '🔍 Actively Looking', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { value: 'skill-building', label: '📚 Skill Building', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
  { value: 'studying', label: '🎓 Studying', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
];

const visibilityOptions = [
  { value: 'visible-to-all', label: 'Visible to All', icon: '👥' },
  { value: 'visible-to-hr', label: 'Visible to HR Only', icon: '🏢' },
  { value: 'visible-to-professor', label: 'Visible to Professor Only', icon: '👨‍🏫' },
  { value: 'hidden', label: 'Hidden', icon: '🔒' },
];

const StudentStatusPanel: React.FC<StudentStatusPanelProps> = ({
  studentId,
  currentStatus = 'studying',
  currentVisibility = 'visible-to-all',
  onStatusUpdated,
  onAccountDeleted,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [visibility, setVisibility] = useState(currentVisibility);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const handleStatusChange = async (newStatus: typeof status) => {
    setLoading(true);
    setMessage('');
    try {
      await updateStudentStatus(studentId, newStatus);
      setStatus(newStatus);
      setMessage('Status updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      onStatusUpdated?.();
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (newVisibility: typeof visibility) => {
    setLoading(true);
    setMessage('');
    try {
      await updateProfileVisibility(studentId, newVisibility);
      setVisibility(newVisibility);
      setMessage('Visibility updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      onStatusUpdated?.();
    } catch (error) {
      console.error('Error updating visibility:', error);
      setMessage('Failed to update visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Settings</h2>

      {message && (
        <div className={`p-3 rounded-md mb-4 ${
          message.includes('successfully')
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Student Status */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Your Current Status
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value as typeof status)}
              disabled={loading}
              className={`p-3 rounded-lg transition-all duration-200 border-2 font-medium ${
                status === option.value
                  ? `${option.color} border-current`
                  : `border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400`
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This status helps HR and professors understand your current availability and goals.
        </p>
      </div>

      {/* Profile Visibility */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Profile Visibility
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibilityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleVisibilityChange(option.value as typeof visibility)}
              disabled={loading}
              className={`p-3 rounded-lg transition-all duration-200 border-2 font-medium text-left ${
                visibility === option.value
                  ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              } disabled:opacity-50`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="block mt-1">{option.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Choose who can see your profile. Professors and HR will respect these settings.
        </p>
      </div>

      {/* Delete Account Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={async () => {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.')) {
              return;
            }

            setDeleting(true);
            setMessage('');
            try {
              await deleteStudentAccount(studentId);
              
              // Delete Firebase Auth user
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }

              setMessage('Account deleted successfully. Redirecting...');
              setTimeout(() => {
                router.push('/');
                onAccountDeleted?.();
              }, 2000);
            } catch (error) {
              console.error('Error deleting account:', error);
              setMessage('Failed to delete account. Please contact support.');
              setDeleting(false);
            }
          }}
          disabled={deleting}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
        >
          {deleting ? '🗑️ Deleting...' : '🗑️ Delete Account'}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
      </div>
    </div>
  );
};

export default StudentStatusPanel;
