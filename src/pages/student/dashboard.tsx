// Enhanced Student Dashboard with AI Insights
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import SkillCard from '../../components/SkillCard';
import AIInsightsCard from '../../components/AIInsightsCard';
import { getStudentProfile, generateStudentInsights } from '../../services/studentService';
import { StudentProfile, StudentSkill, AIInsights } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        const studentProfile = await getStudentProfile(currentUser.uid);
        
        if (!studentProfile) {
          // New student - redirect to onboarding
          router.push('/student/onboarding');
          return;
        }

        if (!studentProfile.onboardingCompleted) {
          router.push('/student/onboarding');
          return;
        }

        setProfile(studentProfile);

        // Generate insights if not available or stale
        if (!studentProfile.aiInsights || 
            (studentProfile.aiInsights.lastAnalyzed && 
             Date.now() - studentProfile.aiInsights.lastAnalyzed.toMillis() > 7 * 24 * 60 * 60 * 1000)) {
          // Generate insights in background
          generateStudentInsights(currentUser.uid).catch(console.error);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, router]);

  const handleRefreshInsights = async () => {
    if (!currentUser) return;
    setInsightsLoading(true);
    try {
      await generateStudentInsights(currentUser.uid);
      const updatedProfile = await getStudentProfile(currentUser.uid);
      if (updatedProfile) setProfile(updatedProfile);
    } catch (error) {
      console.error('Error refreshing insights:', error);
      alert('Failed to refresh insights. Please try again.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleImproveSkill = (skillId: string) => {
    router.push(`/student/skills/${skillId}/improve`);
  };

  const handleVerifySkill = (skillId: string) => {
    router.push(`/student/skills/${skillId}/verify`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Redirecting
  }

  const filteredSkills = profile.skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skillsNeedingImprovement = profile.skills.filter((skill) => skill.score < 70);
  const topSkills = profile.skills.filter((skill) => skill.score >= 80);
  const verifiedSkills = profile.skills.filter((skill) => skill.verificationStatus === 'verified');

  // Prepare chart data for readiness trend (mock for now)
  const readinessTrend = [
    { date: 'Week 1', score: profile.jobReadinessScore - 10 },
    { date: 'Week 2', score: profile.jobReadinessScore - 5 },
    { date: 'Week 3', score: profile.jobReadinessScore },
    { date: 'Week 4', score: profile.jobReadinessScore },
  ];

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Chatbot role="student" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {profile.displayName || userProfile?.email.split('@')[0] || 'Student'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your progress and improve your skills to reach your career goals.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Job Readiness</p>
                  <p className="text-3xl font-bold mt-1">{profile.jobReadinessScore}%</p>
                  <p className="text-xs text-indigo-200 mt-1 capitalize">
                    {profile.jobReadinessLevel.replace('-', ' ')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Skills</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{profile.skills.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Verified Skills</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{verifiedSkills.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Need Improvement</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{skillsNeedingImprovement.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Insights */}
              {profile.aiInsights && (
                <AIInsightsCard
                  insights={profile.aiInsights}
                  onRefresh={handleRefreshInsights}
                  loading={insightsLoading}
                />
              )}

              {/* Readiness Progress */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Readiness Progress</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.jobReadinessScore >= 80
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : profile.jobReadinessScore >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {profile.jobReadinessLevel.replace('-', ' ')}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div
                      className={`h-6 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500 ${
                        profile.jobReadinessScore >= 80
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : profile.jobReadinessScore >= 60
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${profile.jobReadinessScore}%` }}
                    >
                      {profile.jobReadinessScore}%
                    </div>
                  </div>
                </div>
                {/* Readiness Trend Chart */}
                <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readinessTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Skills List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200" id="skills">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Skills</h2>
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm"
                  />
                </div>
                {filteredSkills.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm ? `No skills found matching "${searchTerm}"` : 'No skills added yet'}
                    </p>
                    <button
                      onClick={() => router.push('/student/skills/add')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add Your First Skill
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSkills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onImprove={handleImproveSkill}
                        onVerify={handleVerifySkill}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/student/skills/add')}
                    className="w-full text-left p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <p className="font-medium text-indigo-900 dark:text-indigo-300">Add Skill</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Add a new skill to track</p>
                  </button>
                  <button
                    onClick={() => router.push('/student/assessments')}
                    className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <p className="font-medium text-blue-900 dark:text-blue-300">Take Assessment</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Complete skill assessments</p>
                  </button>
                  <button
                    onClick={() => router.push('/student/profile')}
                    className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <p className="font-medium text-purple-900 dark:text-purple-300">Update Profile</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">Edit your profile information</p>
                  </button>
                </div>
              </div>

              {/* Career Goals */}
              {profile.preferredRoles && profile.preferredRoles.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Career Goals</h3>
                  <div className="space-y-2">
                    {profile.preferredRoles.map((role, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Skills */}
              {topSkills.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Skills</h3>
                  <div className="space-y-2">
                    {topSkills.slice(0, 5).map((skill) => (
                      <div key={skill.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{skill.name}</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">{skill.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
