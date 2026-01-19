import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import { useAuth } from '../../context/AuthContext';
import { getStudentProfile } from '../../services/studentService';
import { StudentProfile } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

const StudentProfilePublicPage = () => {
  const router = useRouter();
  const { studentId } = router.query;
  const { currentUser, userProfile } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || typeof studentId !== 'string') return;

    const load = async () => {
      try {
        const data = await getStudentProfile(studentId);
        if (!data) {
          setError('Student profile not found.');
        } else {
          setProfile(data);
        }
      } catch (e) {
        console.error('Error loading student profile page:', e); // FIXED HERE
        setError('Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  // Enforce access rules:
  // - Professor / Recruiter / Company can view any student
  // - Student can only view their own profile
  useEffect(() => {
    if (!userProfile || !currentUser || !studentId || typeof studentId !== 'string') return;

    if (userProfile.role === 'student' && currentUser.uid !== studentId) {
      router.replace('/student/dashboard');
    }
  }, [userProfile, currentUser, studentId, router]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student', 'professor', 'recruiter', 'company']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-gray-900 dark:text-white">Loading student profile...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute allowedRoles={['student', 'professor', 'recruiter', 'company']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-red-600 dark:text-red-400">
              {error || 'Student profile not available.'}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const name = profile.displayName || profile.email.split('@')[0];

  const aptitudeScore = profile.aptitudeScore ?? 0;
  const technicalScore = profile.technicalScore ?? 0;
  const communicationScore = profile.communicationScore ?? 0;
  const overallScore =
    profile.overallScore ??
    Math.round((aptitudeScore + technicalScore + communicationScore) / 3 || 0);

  const scoreBreakdownData = [
    { name: 'Aptitude', score: aptitudeScore },
    { name: 'Technical', score: technicalScore },
    { name: 'Communication', score: communicationScore },
  ];

  const overallTrendData = [
    { label: 'Destiny Overall', value: overallScore },
    { label: 'Readiness', value: profile.jobReadinessScore },
  ];

  const resumeUrl =
    (profile as any).resumeUrl ||
    profile.portfolioUrl ||
    profile.githubUrl ||
    profile.linkedinUrl ||
    null;

  return (
    <ProtectedRoute allowedRoles={['student', 'professor', 'recruiter', 'company']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <Chatbot role={userProfile?.role || 'student'} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Job Readiness: {profile.jobReadinessScore}% ({profile.jobReadinessLevel})
                  </p>
                </div>
              </div>

              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  View Resume
                </a>
              )}
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: scores + skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Destiny scores */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Destiny Performance Scores
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Aptitude / Technical / Communication
                    </p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreBreakdownData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="score" fill="#6366f1" name="Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Overall vs Readiness
                    </p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overallTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="label" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" domain={[0, 100]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#22c55e"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
                {(!profile.skills || profile.skills.length === 0) ? (
                  <p className="text-gray-500 dark:text-gray-400">No skills recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {skill.category} • {skill.verificationStatus}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {skill.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: basic profile details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Basic Profile Details
                </h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {profile.location || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Preferred Roles</dt>
                    <dd className="text-right text-gray-900 dark:text-white">
                      {(profile.preferredRoles || []).join(', ') || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Job Types</dt>
                    <dd className="text-right text-gray-900 dark:text-white">
                      {(profile.jobType || []).join(', ') || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Career Interests</dt>
                    <dd className="text-right text-gray-900 dark:text-white">
                      {(profile.careerInterests || []).join(', ') || 'Not specified'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  External Links
                </h2>
                <ul className="space-y-2 text-sm">
                  {profile.portfolioUrl && (
                    <li>
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Portfolio
                      </a>
                    </li>
                  )}
                  {profile.githubUrl && (
                    <li>
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        GitHub
                      </a>
                    </li>
                  )}
                  {profile.linkedinUrl && (
                    <li>
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        LinkedIn
                      </a>
                    </li>
                  )}
                  {!profile.portfolioUrl && !profile.githubUrl && !profile.linkedinUrl && (
                    <li className="text-gray-500 dark:text-gray-400">No external links added.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentProfilePublicPage;

