// Enhanced Recruiter Dashboard
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import { findMatchingStudents, recommendStudentsToRecruiter } from '../../services/matchingService';
import { StudentProfile } from '../../types';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const RecruiterDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<StudentProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  
  // Filters
  const [minReadiness, setMinReadiness] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState('');
  const [minSkillPoints, setMinSkillPoints] = useState(0);
  const [maxSkillPoints, setMaxSkillPoints] = useState(100);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    const loadCandidates = async () => {
      if (!currentUser) return;
      
      try {
        // Load recruiter profile to get shortlisted candidates
        const recruiterRef = doc(db, 'recruiters', currentUser.uid);
        const recruiterDoc = await getDoc(recruiterRef);
        
        if (recruiterDoc.exists()) {
          const recruiterData = recruiterDoc.data();
          setShortlistedIds(recruiterData.shortlistedCandidates || []);
        } else {
          // Create recruiter profile if doesn't exist
          await setDoc(recruiterRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            shortlistedCandidates: [],
            interviewRequests: [],
            createdAt: serverTimestamp(),
          });
        }

        // Get recommended students
        const recommended = await recommendStudentsToRecruiter(currentUser.uid, 50);
        setCandidates(recommended);
        setFilteredCandidates(recommended);
      } catch (error) {
        console.error('Error loading candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...candidates];

    // Apply filters
    if (minReadiness > 0) {
      filtered = filtered.filter(c => (c.jobReadinessScore ?? 0) >= minReadiness);
    }

    if (verifiedOnly) {
      filtered = filtered.filter(c => 
        (c.skills || []).some(s => s.verificationStatus === 'verified')
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.preferredRoles || []).some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(c =>
        (c.skills || []).length > 0 && selectedSkills.some(skill =>
          (c.skills || []).some(s => s.name.toLowerCase().includes(skill.toLowerCase()) && (s.score ?? 0) >= 60)
        )
      );
    }

    if (jobTypeFilter.length > 0) {
      filtered = filtered.filter(c =>
        (c.jobType || []).length > 0 && jobTypeFilter.some(jt => (c.jobType || []).includes(jt as any))
      );
    }

    // Skill point filtering
    if (skillFilter.trim()) {
      filtered = filtered.filter(c =>
        (c.skills || []).some(skill => {
          const nameMatches = skill.name.toLowerCase().includes(skillFilter.toLowerCase());
          const pointsInRange = (skill.score ?? 0) >= minSkillPoints && (skill.score ?? 0) <= maxSkillPoints;
          return nameMatches && pointsInRange;
        })
      );
    } else if (minSkillPoints > 0 || maxSkillPoints < 100) {
      filtered = filtered.filter(c =>
        (c.skills || []).some(skill => 
          (skill.score ?? 0) >= minSkillPoints && (skill.score ?? 0) <= maxSkillPoints
        )
      );
    }

    // Verification status filtering
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(c =>
        (c.skills || []).some(skill => skill.verificationStatus === verificationFilter)
      );
    }

    setFilteredCandidates(filtered);
  }, [candidates, minReadiness, verifiedOnly, searchTerm, selectedSkills, jobTypeFilter, skillFilter, minSkillPoints, maxSkillPoints, verificationFilter]);

  const toggleShortlist = async (studentId: string) => {
    if (!currentUser) return;

    try {
      const recruiterRef = doc(db, 'recruiters', currentUser.uid);
      const isShortlisted = shortlistedIds.includes(studentId);

      if (isShortlisted) {
        await updateDoc(recruiterRef, {
          shortlistedCandidates: arrayRemove(studentId),
        });
        setShortlistedIds(prev => prev.filter(id => id !== studentId));
      } else {
        await updateDoc(recruiterRef, {
          shortlistedCandidates: arrayUnion(studentId),
        });
        setShortlistedIds(prev => [...prev, studentId]);
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
      alert('Failed to update shortlist. Please try again.');
    }
  };

  const sendInterviewRequest = async (studentId: string) => {
    if (!currentUser) return;
    
    const position = prompt('Enter the position title:');
    if (!position) return;

    const message = prompt('Enter your message to the candidate:');
    if (!message) return;

    try {
      const interviewRequestRef = doc(db, 'interviewRequests', `${currentUser.uid}_${studentId}_${Date.now()}`);
      await setDoc(interviewRequestRef, {
        id: interviewRequestRef.id,
        recruiterId: currentUser.uid,
        studentId,
        position,
        message,
        status: 'pending',
        requestedAt: serverTimestamp(),
      });

      alert('Interview request sent successfully!');
    } catch (error) {
      console.error('Error sending interview request:', error);
      alert('Failed to send interview request. Please try again.');
    }
  };

  // Get unique skills from all candidates
  const allSkills = Array.from(
    new Set(candidates.flatMap(c => (c.skills || []).map(s => s.name)))
  ).sort();

  const topCandidates = filteredCandidates.filter(c => (c.jobReadinessScore ?? 0) >= 80);
  const internCandidates = filteredCandidates.filter(c => (c.jobReadinessScore ?? 0) >= 60 && (c.jobReadinessScore ?? 0) < 80);

  // Prepare skill points data for graph
  const skillPointsData = (() => {
    const skillMap = new Map<string, { total: number; count: number }>();
    filteredCandidates.forEach(candidate => {
      (candidate.skills || []).forEach(skill => {
        const existing = skillMap.get(skill.name) || { total: 0, count: 0 };
        skillMap.set(skill.name, {
          total: existing.total + (skill.score ?? 0),
          count: existing.count + 1,
        });
      });
    });
    
    return Array.from(skillMap.entries())
      .map(([name, data]) => ({
        skill: name,
        avgPoints: Math.round(data.total / data.count),
        candidates: data.count,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints)
      .slice(0, 10);
  })();

  // Top 6 skills for radar chart
  const radarSkillData = skillPointsData.slice(0, 6).map(item => ({
    skill: item.skill,
    points: item.avgPoints,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['recruiter', 'company']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <Chatbot role="recruiter" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Recruiter Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find and connect with talented candidates.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Candidates</p>
                  <p className="text-3xl font-bold mt-1">{filteredCandidates.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Shortlisted</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{shortlistedIds.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Advanced Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Candidates
                </label>
                <input
                  type="text"
                  placeholder="Name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Readiness: {minReadiness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Skill Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Python..."
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Skill Points: {minSkillPoints}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minSkillPoints}
                  onChange={(e) => setMinSkillPoints(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Skill Points: {maxSkillPoints}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={maxSkillPoints}
                  onChange={(e) => setMaxSkillPoints(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Type
                </label>
                <select
                  value={jobTypeFilter.length > 0 ? jobTypeFilter[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setJobTypeFilter([e.target.value]);
                    } else {
                      setJobTypeFilter([]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Status
                </label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Skills</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Verification</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-end col-span-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setMinReadiness(0);
                    setVerifiedOnly(false);
                    setSelectedSkills([]);
                    setJobTypeFilter([]);
                    setSkillFilter('');
                    setMinSkillPoints(0);
                    setMaxSkillPoints(100);
                    setVerificationFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Skill Points Graphs */}
          {skillPointsData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top Skills - Average Points
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillPointsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="skill" 
                        stroke="#9CA3AF" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                      <Bar dataKey="avgPoints" fill="#6366f1" name="Avg Points" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar Chart */}
              {radarSkillData.length >= 3 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Top 6 Skills Distribution
                  </h2>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarSkillData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="skill" stroke="#9CA3AF" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
                        <Radar
                          name="Skill Points"
                          dataKey="points"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.5}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="candidates">
            {filteredCandidates.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-gray-500 dark:text-gray-400">No candidates match your filters.</p>
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.uid}
                  candidate={candidate}
                  isShortlisted={shortlistedIds.includes(candidate.uid)}
                  onShortlist={() => toggleShortlist(candidate.uid)}
                  onInterviewRequest={() => sendInterviewRequest(candidate.uid)}
                  onViewProfile={() => router.push(`/recruiter/candidates/${candidate.uid}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Candidate Card Component
const CandidateCard: React.FC<{
  candidate: StudentProfile;
  isShortlisted: boolean;
  onShortlist: () => void;
  onInterviewRequest: () => void;
  onViewProfile: () => void;
}> = ({ candidate, isShortlisted, onShortlist, onInterviewRequest, onViewProfile }) => {
  const verifiedSkillsCount = (candidate.skills || []).filter(s => s.verificationStatus === 'verified').length;
  const topSkills = (candidate.skills || []).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
  const readinessScore = candidate.jobReadinessScore ?? 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg ${
      isShortlisted ? 'ring-2 ring-green-500' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {candidate.displayName || candidate.email?.split('@')[0] || 'Student'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.email || 'No email'}</p>
          {(candidate.preferredRoles || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(candidate.preferredRoles || []).slice(0, 2).map((role, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
        {isShortlisted && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
            ✓ Shortlisted
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Readiness</span>
          <span className={`text-lg font-bold ${
            readinessScore >= 80 ? 'text-green-600 dark:text-green-400' :
            readinessScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {readinessScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              readinessScore >= 80 ? 'bg-green-500' :
              readinessScore >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {verifiedSkillsCount} verified • {(candidate.skills || []).length} total skills
        </p>
        <div className="flex flex-wrap gap-1">
          {topSkills.length > 0 ? (
            topSkills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-1">
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded font-medium">
                  {skill.name}: {skill.score ?? 0} pts
                </span>
                {skill.verificationStatus === 'verified' && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold" title="Verified">✓</span>
                )}
                {skill.verificationStatus === 'pending' && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400" title="Pending">⏳</span>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">No skills added</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onShortlist}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isShortlisted
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isShortlisted ? 'Remove' : 'Shortlist'}
        </button>
        <button
          onClick={onInterviewRequest}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
        >
          Interview
        </button>
        <button
          onClick={onViewProfile}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
