// Student Onboarding Flow
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { saveStudentProfile, getStudentProfile } from '../../services/studentService';
import { StudentProfile, JobType } from '../../types';

const OnboardingSteps = [
  'Career Interests',
  'Skills & Experience',
  'Projects & Achievements',
  'Portfolio Links',
  'Review & Complete',
];

const StudentOnboarding = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    careerInterests: [],
    preferredRoles: [],
    jobType: [],
    skills: [],
    projects: [],
    achievements: [],
    certifications: [],
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        const profile = await getStudentProfile(currentUser.uid);
        if (profile) {
          setFormData(profile);
          setCurrentStep(profile.onboardingStep || 0);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleNext = async () => {
    if (currentStep < OnboardingSteps.length - 1) {
      await saveProgress();
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProgress = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await saveStudentProfile({
        uid: currentUser.uid,
        ...formData,
        onboardingStep: currentStep,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      // Add sample skills for demo if no skills exist
      const skills = formData.skills && formData.skills.length > 0 ? formData.skills : [
        {
          id: `skill-${Date.now()}-1`,
          name: 'React',
          category: 'Frontend',
          selfLevel: 'intermediate' as const,
          score: 70,
          proofLinks: [],
          verificationStatus: 'pending' as const,
          assessments: [],
          lastUpdated: new Date(),
        },
        {
          id: `skill-${Date.now()}-2`,
          name: 'JavaScript',
          category: 'Programming',
          selfLevel: 'advanced' as const,
          score: 80,
          proofLinks: [],
          verificationStatus: 'pending' as const,
          assessments: [],
          lastUpdated: new Date(),
        },
        {
          id: `skill-${Date.now()}-3`,
          name: 'Node.js',
          category: 'Backend',
          selfLevel: 'intermediate' as const,
          score: 65,
          proofLinks: [],
          verificationStatus: 'pending' as const,
          assessments: [],
          lastUpdated: new Date(),
        },
      ];

      // Ensure displayName is set - use email username if not provided
      const displayName = formData.displayName || currentUser.email?.split('@')[0] || 'Student';

      await saveStudentProfile({
        uid: currentUser.uid,
        email: currentUser.email || '',
        ...formData,
        displayName,
        skills,
        onboardingCompleted: true,
        onboardingStep: OnboardingSteps.length - 1,
      });
      router.push('/student/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing onboarding. Please try again.');
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
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {OnboardingSteps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        index <= currentStep
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      index <= currentStep
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                  {index < OnboardingSteps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 ${
                      index < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {OnboardingSteps[currentStep]}
            </h2>

            {currentStep === 0 && (
              <Step1CareerInterests
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 1 && (
              <Step2Skills
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 2 && (
              <Step3Projects
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 3 && (
              <Step4Portfolio
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 4 && (
              <Step5Review formData={formData} />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : currentStep === OnboardingSteps.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Step 1: Career Interests
const Step1CareerInterests: React.FC<{
  formData: Partial<StudentProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<StudentProfile>>>;
}> = ({ formData, setFormData }) => {
  const [interestInput, setInterestInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const addInterest = () => {
    if (interestInput.trim() && !formData.careerInterests?.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        careerInterests: [...(formData.careerInterests || []), interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      careerInterests: formData.careerInterests?.filter(i => i !== interest) || [],
    });
  };

  const addRole = () => {
    if (roleInput.trim() && !formData.preferredRoles?.includes(roleInput.trim())) {
      setFormData({
        ...formData,
        preferredRoles: [...(formData.preferredRoles || []), roleInput.trim()],
      });
      setRoleInput('');
    }
  };

  const removeRole = (role: string) => {
    setFormData({
      ...formData,
      preferredRoles: formData.preferredRoles?.filter(r => r !== role) || [],
    });
  };

  const toggleJobType = (type: JobType) => {
    const currentTypes = formData.jobType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setFormData({ ...formData, jobType: newTypes });
  };

  return (
    <div className="space-y-6">
      {/* Career Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Career Interests
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            placeholder="e.g., Web Development, Data Science"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={addInterest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.careerInterests?.map((interest, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm flex items-center gap-2"
            >
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="hover:text-indigo-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Preferred Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferred Job Roles
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
            placeholder="e.g., Frontend Developer, Software Engineer"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={addRole}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.preferredRoles?.map((role, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm flex items-center gap-2"
            >
              {role}
              <button
                type="button"
                onClick={() => removeRole(role)}
                className="hover:text-purple-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Type Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {(['internship', 'full-time', 'part-time', 'contract', 'remote'] as JobType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleJobType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                formData.jobType?.includes(type)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 2: Skills (simplified - will be expanded)
const Step2Skills: React.FC<{
  formData: Partial<StudentProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<StudentProfile>>>;
}> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400">
        You can add and verify skills after completing onboarding. For now, let's continue to the next step.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        Skills can be added and verified through assessments on your dashboard.
      </p>
    </div>
  );
};

// Step 3: Projects & Achievements
const Step3Projects: React.FC<{
  formData: Partial<StudentProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<StudentProfile>>>;
}> = ({ formData, setFormData }) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTech, setProjectTech] = useState('');
  const [projectGithub, setProjectGithub] = useState('');

  const addProject = () => {
    if (projectTitle.trim()) {
      const newProject = {
        id: Date.now().toString(),
        title: projectTitle,
        description: projectDesc,
        technologies: projectTech.split(',').map(t => t.trim()).filter(Boolean),
        githubUrl: projectGithub || undefined,
        startDate: new Date() as any,
        skillsDemonstrated: [],
      };
      setFormData({
        ...formData,
        projects: [...(formData.projects || []), newProject],
      });
      setProjectTitle('');
      setProjectDesc('');
      setProjectTech('');
      setProjectGithub('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Project</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Project Title"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <textarea
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            value={projectTech}
            onChange={(e) => setProjectTech(e.target.value)}
            placeholder="Technologies (comma-separated)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <input
            type="url"
            value={projectGithub}
            onChange={(e) => setProjectGithub(e.target.value)}
            placeholder="GitHub URL (optional)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={addProject}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Project
          </button>
        </div>
      </div>

      {formData.projects && formData.projects.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Projects</h4>
          <div className="space-y-2">
            {formData.projects.map((project) => (
              <div
                key={project.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-start"
              >
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">{project.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      projects: formData.projects?.filter(p => p.id !== project.id),
                    });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 4: Portfolio Links
const Step4Portfolio: React.FC<{
  formData: Partial<StudentProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<StudentProfile>>>;
}> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Portfolio URL
        </label>
        <input
          type="url"
          value={formData.portfolioUrl || ''}
          onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
          placeholder="https://yourportfolio.com"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GitHub URL
        </label>
        <input
          type="url"
          value={formData.githubUrl || ''}
          onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
          placeholder="https://github.com/username"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn URL
        </label>
        <input
          type="url"
          value={formData.linkedinUrl || ''}
          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
          placeholder="https://linkedin.com/in/username"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );
};

// Step 5: Review
const Step5Review: React.FC<{ formData: Partial<StudentProfile> }> = ({ formData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Career Interests</h3>
        <div className="flex flex-wrap gap-2">
          {formData.careerInterests?.map((interest, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Preferred Roles</h3>
        <div className="flex flex-wrap gap-2">
          {formData.preferredRoles?.map((role, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
      {formData.projects && formData.projects.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Projects</h3>
          <p className="text-gray-600 dark:text-gray-400">{formData.projects.length} project(s) added</p>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Portfolio Links</h3>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {formData.portfolioUrl && <p>Portfolio: {formData.portfolioUrl}</p>}
          {formData.githubUrl && <p>GitHub: {formData.githubUrl}</p>}
          {formData.linkedinUrl && <p>LinkedIn: {formData.linkedinUrl}</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
