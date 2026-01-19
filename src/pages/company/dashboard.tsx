import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';

// Student candidate interface
interface Candidate {
  uid: string;
  displayName?: string;
  email: string;
  skills: Array<{ id: string; name: string; score: number }>;
  readiness: number;
  shortlisted: boolean;
}

// Company dashboard component with modern redesign
const CompanyDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [minReadiness, setMinReadiness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

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
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const candidatesList: Candidate[] = [];

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

            // Prefer stored displayName, fall back to email prefix
            const displayName =
              userData.displayName ||
              (userData.email ? String(userData.email).split('@')[0] : undefined);

            candidatesList.push({
              uid: studentUid,
              displayName,
              email: userData.email || 'N/A',
              skills,
              readiness,
              shortlisted: false,
            });
          }
        }

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

  // Filter candidates based on minimum readiness and search term
  useEffect(() => {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.readiness >= minReadiness &&
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
  }, [minReadiness, candidates, searchTerm]);

  // Count shortlisted candidates
  useEffect(() => {
    const count = filteredCandidates.filter((c) => c.shortlisted).length;
    setShortlistedCount(count);
  }, [filteredCandidates]);

  // Toggle shortlist status
  const toggleShortlist = (uid: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.uid === uid
          ? { ...candidate, shortlisted: !candidate.shortlisted }
          : candidate
      )
    );
  };

  // Get candidates for internships (60-80% readiness)
  const internCandidates = candidates.filter(
    (c) => c.readiness >= 60 && c.readiness < 80
  );
  const topCandidates = candidates.filter((c) => c.readiness >= 80);

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
    <ProtectedRoute allowedRoles={['company']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Chatbot role="company" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Company Dashboard 🏢
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find the best talent and discover promising candidates for your team.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Candidates</p>
                  <p className="text-3xl font-bold mt-1">{candidates.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Top Candidates</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{topCandidates.length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">For Internships</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{internCandidates.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Shortlisted</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{shortlistedCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Filter Candidates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="readiness" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Readiness: {minReadiness}%
                </label>
                <input
                  id="readiness"
                  type="range"
                  min="0"
                  max="100"
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search by Email
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </p>
              {shortlistedCount > 0 && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {shortlistedCount} shortlisted
                </p>
              )}
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200" id="candidates">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Candidates</h2>
            {filteredCandidates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No candidates match the current filter criteria.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.uid}
                    className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                      candidate.shortlisted 
                        ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(candidate.displayName || candidate.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {candidate.displayName || candidate.email}
                            </h3>
                            {candidate.shortlisted && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-green-600 dark:bg-green-700 text-white rounded-full">
                                Shortlisted
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Readiness</span>
                            <span className={`text-lg font-bold ${
                              candidate.readiness >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : candidate.readiness >= 60
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {candidate.readiness}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                candidate.readiness >= 80
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : candidate.readiness >= 60
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                  : 'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${candidate.readiness}%` }}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills
                              .sort((a, b) => b.score - a.score)
                              .slice(0, 3)
                              .map((skill) => (
                                <span
                                  key={skill.id}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                                >
                                  {skill.name}: {skill.score}%
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleShortlist(candidate.uid)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        candidate.shortlisted
                          ? 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600'
                          : 'bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                      }`}
                    >
                      {candidate.shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CompanyDashboard;
