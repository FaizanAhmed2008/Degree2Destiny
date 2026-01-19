import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';

const RecruiterProfile = () => {
  const { userProfile, currentUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');

  if (!userProfile || !currentUser) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['recruiter', 'company']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile.email.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {displayName || userProfile.email.split('@')[0]}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">{userProfile.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
                    {userProfile.role === 'recruiter' ? 'Recruiter' : 'Company'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company/Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{displayName || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{userProfile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {userProfile.createdAt && typeof userProfile.createdAt.toDate === 'function'
                      ? new Date(userProfile.createdAt.toDate()).toLocaleDateString()
                      : 'Recently'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <p className="font-medium text-gray-900 dark:text-white">Notification Settings</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your notifications</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <p className="font-medium text-gray-900 dark:text-white">Hiring Preferences</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set your hiring criteria</p>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/recruiter/dashboard')}
                className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-left"
              >
                <p className="font-medium text-indigo-900 dark:text-indigo-300">View Dashboard</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Browse candidates</p>
              </button>
              <button
                onClick={() => router.push('/recruiter/dashboard#candidates')}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
              >
                <p className="font-medium text-green-900 dark:text-green-300">Find Candidates</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">Search and filter</p>
              </button>
              <button className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors text-left">
                <p className="font-medium text-teal-900 dark:text-teal-300">Shortlisted</p>
                <p className="text-sm text-teal-700 dark:text-teal-400 mt-1">View saved candidates</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default RecruiterProfile;
