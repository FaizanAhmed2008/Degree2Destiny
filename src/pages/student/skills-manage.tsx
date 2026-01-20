// Student Skills Management Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { getStudentProfile, saveStudentSkill } from '../../services/studentService';
import { StudentProfile, StudentSkill, SkillLevel } from '../../types';
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

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;
    try {
      const studentProfile = await getStudentProfile(currentUser.uid);
      if (studentProfile) {
        setProfile(studentProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!currentUser || !skillName.trim()) {
      alert('Please enter a skill name');
      return;
    }

    setSaving(true);
    try {
      const newSkill: StudentSkill = {
        id: editingSkill?.id || `skill-${Date.now()}`,
        name: skillName.trim(),
        category: skillCategory.trim() || 'General',
        selfLevel: skillLevel,
        score: skillScore,
        proofLinks: proofLinks.trim() ? proofLinks.split(',').map(l => l.trim()) : [],
        verificationStatus: 'pending',
        assessments: editingSkill?.assessments || [],
        lastUpdated: serverTimestamp(),
      };

      await saveStudentSkill(currentUser.uid, newSkill);
      
      // Reload profile
      await loadProfile();
      
      // Reset form
      resetForm();
      
      alert('Skill saved successfully!');
    } catch (error) {
      console.error('Error saving skill:', error);
      alert('Failed to save skill. Please try again.');
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
      const updatedSkills = (profile?.skills || []).filter(s => s.id !== skillId);
      
      // Save updated skills array
      for (const skill of updatedSkills) {
        await saveStudentSkill(currentUser.uid, skill);
      }
      
      await loadProfile();
      alert('Skill deleted successfully!');
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {skill.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {skill.category} • {skill.selfLevel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
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
      </div>
    </ProtectedRoute>
  );
};

export default SkillsManage;
