// Enhanced Student Dashboard with AI Insights
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import SkillCard from '../../components/SkillCard';
import AIInsightsCard from '../../components/AIInsightsCard';
import VerificationCard from '../../components/VerificationCard';
import { getStudentProfile, generateStudentInsights, onStudentVerificationUpdate } from '../../services/studentService';
import { StudentProfile, StudentSkill, AIInsights } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

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

        const registrationOk = Boolean(
          (studentProfile as any).registrationCompleted || studentProfile.onboardingCompleted
        );
        if (!registrationOk) {
          router.push('/student/onboarding');
          return;
        }

        setProfile(studentProfile);

        // Generate insights if not available or stale
        if (!studentProfile.aiInsights || 
            (studentProfile.aiInsights.lastAnalyzed && 
             typeof studentProfile.aiInsights.lastAnalyzed.toMillis === 'function' &&
             Date.now() - studentProfile.aiInsights.lastAnalyzed.toMillis() > 7 * 24 * 60 * 60 * 1000)) {
          // Generate insights in background
          generateStudentInsights(currentUser.uid).catch(console.error);
        }

        // Set up real-time listener for verification status updates
        const unsubscribe = onStudentVerificationUpdate(
          currentUser.uid,
          (updatedStudent) => {
            console.log('[State Sync] Student profile updated via real-time listener');
            setProfile(updatedStudent);
          },
          (error) => {
            console.error('[State Sync Error] Failed to listen for updates:', error);
          }
        );

        // Cleanup listener on unmount
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('[Firestore Read Error] Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = loadProfile();
    return () => {
      // Handle cleanup if it's a promise
      if (cleanup instanceof Promise) {
        cleanup.catch(console.error);
      }
    };
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
    // For demo: redirect to under development page
    router.push('/under-development');
  };

  const handleVerifySkill = (skillId: string) => {
    // For demo: redirect to under development page
    router.push('/under-development');
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

  const filteredSkills = (profile.skills || []).filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skillsNeedingImprovement = (profile.skills || []).filter((skill) => skill.score < 70);
  const topSkills = (profile.skills || []).filter((skill) => skill.score >= 80);
  const verifiedSkills = (profile.skills || []).filter((skill) => skill.verificationStatus === 'verified');

  // Prepare chart data for readiness trend (mock for now)
  const readinessTrend = [
    { date: 'Week 1', score: profile.jobReadinessScore - 10 },
    { date: 'Week 2', score: profile.jobReadinessScore - 5 },
    { date: 'Week 3', score: profile.jobReadinessScore },
    { date: 'Week 4', score: profile.jobReadinessScore },
  ];

  // Prepare data for Destiny scoring charts (mock scores are generated & persisted in studentService)
  const aptitudeScore = profile.aptitudeScore ?? 0;
  const technicalScore = profile.technicalScore ?? 0;
  const communicationScore = profile.communicationScore ?? 0;
  const overallScore = profile.overallScore ?? Math.round((aptitudeScore + technicalScore + communicationScore) / 3 || 0);

  const scoreBreakdownData = [
    { name: 'Aptitude', score: aptitudeScore },
    { name: 'Technical', score: technicalScore },
    { name: 'Communication', score: communicationScore },
  ];

  const overallPerformanceData = [
    { metric: 'Overall', value: overallScore },
    { metric: 'Readiness', value: profile.jobReadinessScore },
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
              Welcome back, {profile.displayName || userProfile?.email?.split('@')[0] || 'Student'}! 👋
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

              {/* Destiny Performance Scores Charts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Destiny Performance Scores
                </h2>
                
                {scoreBreakdownData && scoreBreakdownData.length > 0 && aptitudeScore >= 0 && technicalScore >= 0 && communicationScore >= 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Bar Chart for Individual Scores */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Aptitude / Technical / Communication
                      </p>
                      <div className="h-64">
                        {scoreBreakdownData.every(item => item.score >= 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreBreakdownData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="name" 
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280' }}
                              />
                              <YAxis 
                                stroke="#6b7280" 
                                domain={[0, 100]}
                                tick={{ fill: '#6b7280' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1F2937', 
                                  border: '1px solid #374151',
                                  borderRadius: '8px',
                                  color: '#F3F4F6'
                                }}
                              />
                              <Bar dataKey="score" fill="#6366f1" name="Score" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            Chart data unavailable
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Radar Chart for Overall Performance */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Overall Performance Analysis
                      </p>
                      <div className="h-64">
                        {overallScore >= 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={scoreBreakdownData.concat([{ name: 'Overall', score: overallScore }])}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis 
                                dataKey="name" 
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                              />
                              <PolarRadiusAxis 
                                angle={90} 
                                domain={[0, 100]}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                              />
                              <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#6366f1"
                                fill="#6366f1"
                                fillOpacity={0.6}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1F2937', 
                                  border: '1px solid #374151',
                                  borderRadius: '8px',
                                  color: '#F3F4F6'
                                }}
                              />
                              <Legend />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            Chart data unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Loading performance scores...
                    </p>
                  </div>
                )}

                {/* Score Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Aptitude</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {aptitudeScore}%
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Technical</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {technicalScore}%
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Communication</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {communicationScore}%
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {overallScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Overview - Single Clean Graph */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Top Skills</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.jobReadinessScore >= 80
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : profile.jobReadinessScore >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    Overall Readiness: {profile.jobReadinessScore}%
                  </span>
                </div>

                {profile.skills.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={profile.skills
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 8)
                          .map(skill => ({
                            name: skill.name,
                            points: skill.score,
                            verified: skill.verificationStatus === 'verified',
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#9CA3AF" domain={[0, 100]} label={{ value: 'Skill Points', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="points" fill="#6366f1" name="Skill Points" />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No skills added yet. Add your skills to see your progress!
                    </p>
                  </div>
                )}
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
                      {searchTerm ? `No skills found matching "${searchTerm}"` : 'No skills added yet. Skills will appear here once added during onboarding.'}
                    </p>
                    <button
                      onClick={() => router.push('/under-development')}
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
              {/* Verification Status Card */}
              <VerificationCard 
                profile={profile}
                loading={loading}
                onVerificationRequested={() => {
                  console.log('[UI] Verification requested, profile will auto-update via real-time listener');
                }}
              />

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/student/skills-manage')}
                    className="w-full text-left p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <p className="font-medium text-indigo-900 dark:text-indigo-300">Manage Skills</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Add, edit, or remove skills</p>
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
              {profile.preferredRoles && Array.isArray(profile.preferredRoles) && profile.preferredRoles.length > 0 && (
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
