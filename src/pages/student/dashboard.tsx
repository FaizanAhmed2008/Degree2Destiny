import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

// Skill interface
interface Skill {
  id: string;
  name: string;
  score: number; // 0-100
}

// Student dashboard component
const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [readiness, setReadiness] = useState(0);
  const [loading, setLoading] = useState(true);

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
          // Load existing skills from Firestore
          const data = skillsDoc.data();
          setSkills(data.skills || []);
        } else {
          // Initialize with mock skills if no data exists
          // TODO: Replace this mock data with AI/ML-generated skill assessment
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
        // Fallback to mock data on error
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
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>
          
          {/* Readiness Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Role Readiness</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div
                    className={`h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      readiness >= 80
                        ? 'bg-green-600'
                        : readiness >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${readiness}%` }}
                  >
                    {readiness}%
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{readiness}%</div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Average of all your skill scores. Companies can see this when filtering candidates.
            </p>
          </div>

          {/* Skills List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Skills</h2>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        skill.score >= 80
                          ? 'bg-green-600'
                          : skill.score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500 italic">
              Note: Skill scores are currently mock data. AI/ML integration can be added here to assess actual skills.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
