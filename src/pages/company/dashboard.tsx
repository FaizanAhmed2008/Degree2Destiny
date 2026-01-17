import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

// Student candidate interface
interface Candidate {
  uid: string;
  email: string;
  skills: Array<{ id: string; name: string; score: number }>;
  readiness: number;
  shortlisted: boolean;
}

// Company dashboard component
const CompanyDashboard = () => {
  const { currentUser } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [minReadiness, setMinReadiness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shortlistedCount, setShortlistedCount] = useState(0);

  // Calculate readiness for a student based on their skills
  const calculateReadiness = (skills: Array<{ id: string; name: string; score: number }>) => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => sum + skill.score, 0);
    return Math.round(total / skills.length);
  };

  // Load all student candidates from Firestore
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        // Get all users with student role
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const candidatesList: Candidate[] = [];

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

            candidatesList.push({
              uid: studentUid,
              email: userData.email || 'N/A',
              skills,
              readiness,
              shortlisted: false, // TODO: Implement actual shortlist functionality with Firestore
            });
          }
        }

        // Sort by readiness (highest first)
        candidatesList.sort((a, b) => b.readiness - a.readiness);
        
        setCandidates(candidatesList);
        setFilteredCandidates(candidatesList);
      } catch (error) {
        console.error('Error loading candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, []);

  // Filter candidates based on minimum readiness
  useEffect(() => {
    const filtered = candidates.filter((candidate) => candidate.readiness >= minReadiness);
    setFilteredCandidates(filtered);
  }, [minReadiness, candidates]);

  // Count shortlisted candidates
  useEffect(() => {
    const count = filteredCandidates.filter((c) => c.shortlisted).length;
    setShortlistedCount(count);
  }, [filteredCandidates]);

  // Toggle shortlist status (mock implementation)
  const toggleShortlist = (uid: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.uid === uid
          ? { ...candidate, shortlisted: !candidate.shortlisted }
          : candidate
      )
    );
    // TODO: Save shortlist status to Firestore for persistence
  };

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
    <ProtectedRoute allowedRoles={['company']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Company Dashboard</h1>
          
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Candidates</h2>
            <div className="flex items-center space-x-4">
              <label htmlFor="readiness" className="text-sm font-medium text-gray-700">
                Minimum Readiness:
              </label>
              <input
                id="readiness"
                type="range"
                min="0"
                max="100"
                value={minReadiness}
                onChange={(e) => setMinReadiness(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-indigo-600 w-16 text-right">
                {minReadiness}%
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </p>
              {shortlistedCount > 0 && (
                <p className="text-sm font-medium text-green-600">
                  {shortlistedCount} shortlisted
                </p>
              )}
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Candidates</h2>
            {filteredCandidates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No candidates match the current filter criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.uid}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      candidate.shortlisted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {candidate.email}
                          </h3>
                          {candidate.shortlisted && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                              Shortlisted
                            </span>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Readiness</span>
                            <span className="text-lg font-bold text-gray-900">
                              {candidate.readiness}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${
                                candidate.readiness >= 80
                                  ? 'bg-green-600'
                                  : candidate.readiness >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${candidate.readiness}%` }}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {skill.name}: {skill.score}%
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleShortlist(candidate.uid)}
                        className={`ml-4 px-4 py-2 rounded-md font-medium transition-colors ${
                          candidate.shortlisted
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {candidate.shortlisted ? 'Remove from Shortlist' : 'Shortlist'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-gray-500 italic">
              Note: Shortlist functionality is currently mock. Add Firestore integration to persist shortlist data.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CompanyDashboard;
