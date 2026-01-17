import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

// Student data interface
interface StudentData {
  uid: string;
  email: string;
  skills: Array<{ id: string; name: string; score: number }>;
  readiness: number;
}

// Professor dashboard component
const ProfessorDashboard = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgReadiness, setAvgReadiness] = useState(0);

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
        // Get all users with student role
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const studentsList: StudentData[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Only include students
          if (userData.role === 'student') {
            const studentUid = userDoc.id;
            
            // Get student's skills data
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

        // Calculate average readiness
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Professor Dashboard</h1>
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Students</h3>
              <p className="text-3xl font-bold text-indigo-600">{totalStudents}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Average Readiness</h3>
              <p className="text-3xl font-bold text-green-600">{avgReadiness}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Students &gt; 80%</h3>
              <p className="text-3xl font-bold text-purple-600">
                {students.filter((s) => s.readiness >= 80).length}
              </p>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">All Students</h2>
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No students found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Readiness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skills Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full ${
                                  student.readiness >= 80
                                    ? 'bg-green-600'
                                    : student.readiness >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${student.readiness}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {student.readiness}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.skills.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              student.readiness >= 80
                                ? 'bg-green-100 text-green-800'
                                : student.readiness >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {student.readiness >= 80
                              ? 'Ready'
                              : student.readiness >= 60
                              ? 'Developing'
                              : 'Needs Work'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorDashboard;
