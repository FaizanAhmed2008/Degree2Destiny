// Student Skills Management Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import AIInterview from '../../components/AIInterview';
import { deleteStudentSkill, getStudentProfile, saveStudentSkill, sendSkillVerificationRequest } from '../../services/studentService';
import { StudentProfile, StudentSkill, SkillLevel, InterviewEvaluation } from '../../types';
import { serverTimestamp } from 'firebase/firestore';

const SkillsManage = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<StudentSkill | null>(null);
  
  // Form state
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [skillScore, setSkillScore] = useState(50);
  const [proofLinks, setProofLinks] = useState('');
  
  // AI Interview state
  const [showAddSkillOptions, setShowAddSkillOptions] = useState(false);
  const [showAIInterview, setShowAIInterview] = useState(false);
  const [interviewSkillName, setInterviewSkillName] = useState('');
  const [interviewSkillLevel, setInterviewSkillLevel] = useState<SkillLevel>('beginner');

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) {
      console.log('[Firestore Read] No current user, skipping profile load');
      return;
    }
    try {
      console.log('[Firestore Read] Loading student profile', { studentId: currentUser.uid });
      const studentProfile = await getStudentProfile(currentUser.uid);
      if (studentProfile) {
        console.log('[Firestore Read] Profile loaded successfully, skills count:', {
          skillsCount: studentProfile.skills?.length || 0,
        });
        setProfile(studentProfile);
      } else {
        console.log('[Firestore Read] No profile found for student');
      }
    } catch (error: any) {
      console.error('[Firestore Read Error] Error loading profile:', {
        error: error.message,
        studentId: currentUser.uid,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!currentUser || !skillName.trim()) {
      console.log('[UI] Skill name is required');
      alert('Please enter a skill name');
      return;
    }

    setSaving(true);
    try {
      console.log('[Firestore Write] Starting skill save operation', {
        skillName,
        skillCategory,
        skillLevel,
        skillScore,
      });

      const previousSkill = editingSkill
        ? (profile?.skills || []).find(s => s.id === editingSkill.id) || editingSkill
        : null;

      // If a student changes a previously verified/rejected skill, require re-verification
      const shouldResetVerification =
        !!previousSkill && previousSkill.verificationStatus !== 'pending' && (
          previousSkill.name !== skillName.trim() ||
          previousSkill.category !== (skillCategory.trim() || 'General') ||
          previousSkill.selfLevel !== skillLevel ||
          previousSkill.score !== skillScore ||
          previousSkill.proofLinks.join(',') !== (proofLinks.trim() ? proofLinks.split(',').map(l => l.trim()).join(',') : '')
        );

      const skillData: any = {
        id: editingSkill?.id || `skill-${Date.now()}`,
        name: skillName.trim(),
        category: skillCategory.trim() || 'General',
        selfLevel: skillLevel,
        score: skillScore,
        proofLinks: proofLinks.trim() ? proofLinks.split(',').map(l => l.trim()) : [],
        verificationStatus: shouldResetVerification
          ? 'pending'
          : (previousSkill?.verificationStatus || 'pending'),
        assessments: editingSkill?.assessments || [],
        lastUpdated: new Date().toISOString(),
      };

      // Only add verifiedBy and verifiedAt if they have values
      if (!shouldResetVerification && previousSkill?.verifiedBy) {
        skillData.verifiedBy = previousSkill.verifiedBy;
      }
      if (!shouldResetVerification && previousSkill?.verifiedAt) {
        skillData.verifiedAt = previousSkill.verifiedAt;
      }

      const newSkill: StudentSkill = skillData;

      await saveStudentSkill(currentUser.uid, newSkill);
      console.log('[Firestore Write] Skill saved successfully to Firestore', {
        skillId: newSkill.id,
        skillName: newSkill.name,
      });
      
      // Reload profile to verify persistence
      await loadProfile();
      console.log('[Firestore Read] Profile reloaded after skill save, verifying persistence');
      
      // Reset form
      resetForm();
      
      const actionType = editingSkill ? 'updated' : 'saved';
      alert(`Skill ${actionType} successfully! ${shouldResetVerification ? 'Verification status has been reset.' : ''}`);
      console.log('[UI] Success notification shown to user');
    } catch (error: any) {
      console.error('[Firestore Write Error] Failed to save skill:', {
        error: error.message,
        code: error.code,
        skillName,
      });
      alert(`Failed to save skill: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSkill = (skill: StudentSkill) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillCategory(skill.category);
    setSkillLevel(skill.selfLevel);
    setSkillScore(skill.score);
    setProofLinks(skill.proofLinks.join(', '));
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    setSaving(true);
    try {
      console.log('[Firestore Write] Deleting skill', { skillId });
      await deleteStudentSkill(currentUser.uid, skillId);
      console.log('[Firestore Write] Skill deleted from Firestore');
      
      await loadProfile();
      console.log('[Firestore Read] Profile reloaded after deletion');
      
      alert('Skill deleted successfully!');
    } catch (error: any) {
      console.error('[Firestore Write Error] Failed to delete skill:', {
        error: error.message,
        skillId,
      });
      alert(`Failed to delete skill: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async (skill: StudentSkill) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      console.log('[Firestore Write] Sending skill verification request', {
        skillId: skill.id,
        skillName: skill.name,
      });
      
      await sendSkillVerificationRequest(
        currentUser.uid,
        skill.id,
        skill.name,
        skill.selfLevel,
        skill.score,
        skill.proofLinks
      );
      console.log('[Firestore Write] Verification request sent successfully');
      
      await loadProfile();
      console.log('[Firestore Read] Profile reloaded after verification request');
      
      alert('Verification request sent to professors!');
    } catch (error: any) {
      console.error('[Firestore Write Error] Failed to send verification request:', {
        error: error.message,
        skillId: skill.id,
      });
      alert(`Failed to send verification request: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingSkill(null);
    setSkillName('');
    setSkillCategory('');
    setSkillLevel('beginner');
    setSkillScore(50);
    setProofLinks('');
    setShowAddSkillOptions(false);
  };

  const handleStartAIInterview = () => {
    if (!skillName.trim()) {
      alert('Please enter a skill name first');
      return;
    }
    setInterviewSkillName(skillName.trim());
    setInterviewSkillLevel(skillLevel);
    setShowAIInterview(true);
  };

  const handleAIInterviewComplete = async (
    evaluation: InterviewEvaluation,
    transcript: any[]
  ) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const newSkill: StudentSkill = {
        id: editingSkill?.id || `skill-${Date.now()}`,
        name: skillName.trim(),
        category: skillCategory.trim() || 'General',
        selfLevel: skillLevel,
        score: evaluation.score,
        proofLinks: proofLinks.trim() ? proofLinks.split(',').map(l => l.trim()) : [],
        verificationStatus: 'verified',
        verifiedBy: 'AI',
        verifiedAt: serverTimestamp(),
        assessments: editingSkill?.assessments || [],
        lastUpdated: serverTimestamp(),
        interviewTranscript: {
          id: `transcript-${Date.now()}`,
          skillId: editingSkill?.id || `skill-${Date.now()}`,
          studentId: currentUser.uid,
          skillName: skillName.trim(),
          startedAt: serverTimestamp(),
          completedAt: serverTimestamp(),
          messages: transcript,
          status: 'completed',
        },
        interviewEvaluation: evaluation,
      };

      await saveStudentSkill(currentUser.uid, newSkill);
      await loadProfile();
      resetForm();
      setShowAIInterview(false);
      alert('Skill verified and saved successfully!');
    } catch (error) {
      console.error('Error saving AI-verified skill:', error);
      alert('Failed to save skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Skills
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add, edit, or remove your skills. Professors can verify your skills.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add/Edit Skill Form */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skill Name *
                    </label>
                    <input
                      type="text"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      placeholder="e.g., React, Python, SQL"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={skillCategory}
                      onChange={(e) => setSkillCategory(e.target.value)}
                      placeholder="e.g., Frontend, Backend, Database"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proficiency Level
                    </label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skill Score: {skillScore}/100
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skillScore}
                      onChange={(e) => setSkillScore(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proof Links (comma-separated)
                    </label>
                    <textarea
                      value={proofLinks}
                      onChange={(e) => setProofLinks(e.target.value)}
                      placeholder="https://github.com/..., https://portfolio.com/..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSkill}
                      disabled={saving || !skillName.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : editingSkill ? 'Update Skill' : 'Add Skill'}
                    </button>
                    {editingSkill && (
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!editingSkill && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Or verify via:</p>
                      <button
                        onClick={handleStartAIInterview}
                        disabled={saving || !skillName.trim()}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <span>🤖</span>
                        AI Interview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Skills ({profile?.skills?.length || 0})
                </h2>

                {(!profile?.skills || profile.skills.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No skills added yet. Add your first skill using the form on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {skill.name}
                              </h3>
                              {skill.verificationStatus === 'verified' && (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                              {skill.verificationStatus === 'pending' && (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                  <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </span>
                              )}
                              {skill.verificationStatus === 'rejected' && (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                  <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {skill.category} • {skill.selfLevel}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              skill.verificationStatus === 'verified' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : skill.verificationStatus === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {skill.verificationStatus === 'verified' ? '✓ Verified' :
                               skill.verificationStatus === 'rejected' ? '✗ Rejected' : 
                               '⏳ Pending'}
                            </span>
                            {skill.verifiedBy === 'AI' && (
                              <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                                🤖 AI-Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Skill Points
                            </span>
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {skill.score}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                skill.score >= 80 ? 'bg-green-500' :
                                skill.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${skill.score}%` }}
                            />
                          </div>
                        </div>

                        {skill.proofLinks.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Proof Links:</p>
                            <div className="flex flex-wrap gap-2">
                              {skill.proofLinks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Link {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSkill(skill)}
                            className="flex-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {skill.verificationStatus !== 'verified' && skill.verifiedBy !== 'AI' && (
                            <button
                              onClick={() => handleRequestVerification(skill)}
                              disabled={saving}
                              className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'Sending...' : 'Request Verify'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showAIInterview && (
          <AIInterview
            skillName={interviewSkillName}
            skillLevel={interviewSkillLevel}
            onComplete={handleAIInterviewComplete}
            onCancel={() => setShowAIInterview(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default SkillsManage;
