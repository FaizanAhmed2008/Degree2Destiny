import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';

// Student data interface
interface StudentData {
  uid: string;
  email: string;
  skills: Array<{ id: string; name: string; score: number }>;
  readiness: number;
}

// Professor dashboard component with modern redesign
const ProfessorDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgReadiness, setAvgReadiness] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate readiness for a student based on their skills
  const calculateReadiness = (skills: Array<{ id: string; name: string; score: number }>) => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(total / skills.length);
  };

  // Load all students from Firestore
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const studentsList: StudentData[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          if (userData.role === 'student') {
            const studentUid = userDoc.id;
            
            const skillsRef = doc(db, 'students', studentUid);
            const skillsDoc = await getDoc(skillsRef);
            
            let skills: Array<{ id: string; name: string; score: number }> = [];
            if (skillsDoc.exists()) {
              skills = skillsDoc.data().skills || [];
            }

            const readiness = calculateReadiness(skills);

            studentsList.push({
              uid: studentUid,
              email: userData.email || 'N/A',
              skills,
              readiness,
            });
          }
        }

        setStudents(studentsList);
        setTotalStudents(studentsList.length);

        if (studentsList.length > 0) {
          const totalReadiness = studentsList.reduce((sum, student) => sum + student.readiness, 0);
          setAvgReadiness(Math.round(totalReadiness / studentsList.length));
        } else {
          setAvgReadiness(0);
        }
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Filter students based on search
  const filteredStudents = students.filter((student) =>
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const readyStudents = students.filter((s) => s.readiness >= 80).length;
  const developingStudents = students.filter((s) => s.readiness >= 60 && s.readiness < 80).length;
  const needsWorkStudents = students.filter((s) => s.readiness < 60).length;

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
    <ProtectedRoute allowedRoles={['professor']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Chatbot role="professor" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Professor Dashboard 👨‍🏫
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and guide your students' progress towards their career goals.
            </p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Readiness</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{avgReadiness}%</p>
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
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Ready (80%+)</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{readyStudents}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Needs Attention</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{needsWorkStudents}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Students List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200" id="students">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Students</h2>
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm"
                  />
                </div>
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {students.length === 0 ? 'No students found.' : `No students found matching "${searchTerm}"`}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.uid}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{student.email}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {student.skills.length} skills assessed
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.readiness >= 80
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : student.readiness >= 60
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {student.readiness >= 80
                              ? 'Ready'
                              : student.readiness >= 60
                              ? 'Developing'
                              : 'Needs Work'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  student.readiness >= 80
                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                    : student.readiness >= 60
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${student.readiness}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                            {student.readiness}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Class Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ready</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{readyStudents}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${totalStudents > 0 ? (readyStudents / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Developing</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{developingStudents}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${totalStudents > 0 ? (developingStudents / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Needs Work</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{needsWorkStudents}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${totalStudents > 0 ? (needsWorkStudents / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">💡 Quick Tips</h3>
                <ul className="space-y-2 text-sm text-indigo-100">
                  <li>• Focus on students below 60%</li>
                  <li>• Provide personalized feedback</li>
                  <li>• Track progress weekly</li>
                  <li>• Use AI assistant for insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorDashboard;
