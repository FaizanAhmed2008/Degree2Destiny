import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';

// Skill interface
interface Skill {
  id: string;
  name: string;
  score: number; // 0-100
}

// Student dashboard component with modern redesign
const StudentDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [readiness, setReadiness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate readiness percentage (average of all skill scores)
  const calculateReadiness = (skillList: Skill[]) => {
    if (skillList.length === 0) return 0;
    const total = skillList.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(total / skillList.length);
  };

  // Load or initialize skills for the student
  useEffect(() => {
    const loadSkills = async () => {
      if (!currentUser) return;

      try {
        const skillsRef = doc(db, 'students', currentUser.uid);
        const skillsDoc = await getDoc(skillsRef);

        if (skillsDoc.exists()) {
          const data = skillsDoc.data();
          setSkills(data.skills || []);
        } else {
          const mockSkills: Skill[] = [
            { id: '1', name: 'Programming', score: 65 },
            { id: '2', name: 'Communication', score: 70 },
            { id: '3', name: 'Problem Solving', score: 60 },
            { id: '4', name: 'Teamwork', score: 75 },
            { id: '5', name: 'Leadership', score: 55 },
          ];
          
          await setDoc(skillsRef, { skills: mockSkills });
          setSkills(mockSkills);
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        const mockSkills: Skill[] = [
          { id: '1', name: 'Programming', score: 65 },
          { id: '2', name: 'Communication', score: 70 },
          { id: '3', name: 'Problem Solving', score: 60 },
          { id: '4', name: 'Teamwork', score: 75 },
          { id: '5', name: 'Leadership', score: 55 },
        ];
        setSkills(mockSkills);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [currentUser]);

  // Update readiness when skills change
  useEffect(() => {
    setReadiness(calculateReadiness(skills));
  }, [skills]);

  // Filter skills based on search
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get skills that need improvement
  const skillsNeedingImprovement = skills.filter((skill) => skill.score < 70);
  const topSkills = skills.filter((skill) => skill.score >= 80);

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

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Chatbot role="student" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userProfile?.email.split('@')[0] || 'Student'}! 👋
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
                  <p className="text-indigo-100 text-sm font-medium">Readiness Score</p>
                  <p className="text-3xl font-bold mt-1">{readiness}%</p>
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
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{skills.length}</p>
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Top Skills</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{topSkills.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Readiness & Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Readiness Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Role Readiness</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    readiness >= 80
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : readiness >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {readiness >= 80 ? 'Ready' : readiness >= 60 ? 'Developing' : 'Needs Work'}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div
                      className={`h-6 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500 ${
                        readiness >= 80
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : readiness >= 60
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${readiness}%` }}
                    >
                      {readiness}%
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your overall readiness score based on all skill assessments. Companies use this to evaluate your fit for roles.
                </p>
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
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No skills found matching "{searchTerm}"</p>
                ) : (
                  <div className="space-y-4">
                    {filteredSkills.map((skill) => (
                      <div key={skill.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{skill.name}</span>
                          <span className={`text-sm font-bold ${
                            skill.score >= 80
                              ? 'text-green-600 dark:text-green-400'
                              : skill.score >= 60
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {skill.score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              skill.score >= 80
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : skill.score >= 60
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions & Tips */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                    <p className="font-medium text-indigo-900 dark:text-indigo-300">Improve Skills</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Get personalized recommendations</p>
                  </button>
                  <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <p className="font-medium text-blue-900 dark:text-blue-300">View Progress</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Track your growth over time</p>
                  </button>
                  <button className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <p className="font-medium text-purple-900 dark:text-purple-300">Career Path</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">Explore career opportunities</p>
                  </button>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">💡 Pro Tip</h3>
                <p className="text-sm text-purple-100">
                  Focus on improving skills below 70% to boost your overall readiness score. Use the AI chatbot for personalized guidance!
                </p>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">Skill assessment completed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">Readiness score updated</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
