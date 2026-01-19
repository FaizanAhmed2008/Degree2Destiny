// Enhanced Professor Dashboard with Student Management and Verification
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import { getStudentProfile } from '../../services/studentService';
import { generateProfessorFeedback } from '../../services/aiService';
import { StudentProfile, AssessmentSubmission, ProfessorFeedback } from '../../types';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ProfessorDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs-attention' | 'ready'>('all');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        // Get all students (in production, filter by assigned students)
        const studentsRef = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsRef);
        
        const studentsList: StudentProfile[] = [];
        studentsSnapshot.forEach((doc) => {
          studentsList.push(doc.data() as StudentProfile);
        });

        setStudents(studentsList);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.displayName && student.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'needs-attention' && student.jobReadinessScore < 60) ||
      (filterStatus === 'ready' && student.jobReadinessScore >= 80);

    return matchesSearch && matchesFilter;
  });

  const handleViewStudent = async (studentId: string) => {
    try {
      const student = await getStudentProfile(studentId);
      if (student) {
        setSelectedStudent(student);
      }
    } catch (error) {
      console.error('Error loading student:', error);
    }
  };

  const handleReviewSubmission = async (submission: AssessmentSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleVerifySkill = async (studentId: string, skillId: string, status: 'verified' | 'rejected') => {
    if (!currentUser) return;

    try {
      const studentRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) return;

      const studentData = studentDoc.data() as StudentProfile;
      const updatedSkills = (studentData.skills || []).map(skill => {
        if (skill.id === skillId) {
          return {
            ...skill,
            verificationStatus: status,
            verifiedBy: currentUser.uid,
            verifiedAt: serverTimestamp(),
          };
        }
        return skill;
      });

      await updateDoc(studentRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp(),
      });

      // Create feedback record
      const feedbackRef = doc(collection(db, 'professorFeedback'));
      await setDoc(feedbackRef, {
        id: feedbackRef.id,
        studentId,
        professorId: currentUser.uid,
        skillId,
        verificationStatus: status,
        createdAt: serverTimestamp(),
        aiAssisted: false,
      });

      alert(`Skill ${status === 'verified' ? 'verified' : 'rejected'} successfully!`);
      
      // Reload students
      const updatedStudent = await getStudentProfile(studentId);
      if (updatedStudent) {
        setStudents(prev => prev.map(s => s.uid === studentId ? updatedStudent : s));
        if (selectedStudent?.uid === studentId) {
          setSelectedStudent(updatedStudent);
        }
      }
    } catch (error) {
      console.error('Error verifying skill:', error);
      alert('Failed to verify skill. Please try again.');
    }
  };

  const handleEvaluateSubmission = async (
    submissionId: string,
    feedback: string,
    score: number
  ) => {
    if (!currentUser || !selectedSubmission) return;

    try {
      const submissionRef = doc(db, 'assessmentSubmissions', submissionId);
      await updateDoc(submissionRef, {
        feedback,
        score,
        evaluatedBy: currentUser.uid,
        evaluatedAt: serverTimestamp(),
      });

      // Update student's skill score based on assessment
      if (selectedStudent) {
        const studentRef = doc(db, 'students', selectedStudent.uid);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data() as StudentProfile;
          const updatedSkills = (studentData.skills || []).map(skill => {
            const assessments = skill.assessments || [];
            const assessment = assessments.find(a => a.id === selectedSubmission.assessmentId);
            if (assessment) {
              // Update assessment
              const updatedAssessments = assessments.map(a => 
                a.id === assessment.id 
                  ? { ...a, status: 'evaluated', score, submission: { ...selectedSubmission, feedback, score } }
                  : a
              );
              
              // Recalculate skill score
              const evaluatedAssessments = updatedAssessments.filter(a => a.score !== undefined);
              const avgScore = evaluatedAssessments.length > 0
                ? Math.round(evaluatedAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / evaluatedAssessments.length)
                : skill.score;

              return {
                ...skill,
                assessments: updatedAssessments,
                score: avgScore,
              };
            }
            return skill;
          });

          await updateDoc(studentRef, {
            skills: updatedSkills,
            updatedAt: serverTimestamp(),
          });
        }
      }

      alert('Submission evaluated successfully!');
      setSelectedSubmission(null);
      
      // Reload student
      if (selectedStudent) {
        const updatedStudent = await getStudentProfile(selectedStudent.uid);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
          setStudents(prev => prev.map(s => s.uid === selectedStudent.uid ? updatedStudent : s));
        }
      }
    } catch (error) {
      console.error('Error evaluating submission:', error);
      alert('Failed to evaluate submission. Please try again.');
    }
  };

  const stats = {
    total: students.length,
    ready: students.filter(s => s.jobReadinessScore >= 80).length,
    developing: students.filter(s => s.jobReadinessScore >= 60 && s.jobReadinessScore < 80).length,
    needsAttention: students.filter(s => s.jobReadinessScore < 60).length,
    avgReadiness: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.jobReadinessScore, 0) / students.length)
      : 0,
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
    <ProtectedRoute allowedRoles={['professor']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <Chatbot role="professor" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Professor Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and guide your students' progress.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Readiness</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.avgReadiness}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Ready (80%+)</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.ready}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Needs Attention</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.needsAttention}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Students</option>
                <option value="needs-attention">Needs Attention</option>
                <option value="ready">Ready (80%+)</option>
              </select>
            </div>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Students</h2>
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No students found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredStudents.map((student) => (
                      <StudentCard
                        key={student.uid}
                        student={student}
                        onView={() => handleViewStudent(student.uid)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Student Details Sidebar */}
            {selectedStudent && (
              <StudentDetailsPanel
                student={selectedStudent}
                onVerifySkill={handleVerifySkill}
                onReviewSubmission={handleReviewSubmission}
                onClose={() => setSelectedStudent(null)}
              />
            )}
          </div>
        </div>

        {/* Submission Review Modal */}
        {selectedSubmission && selectedStudent && (
          <SubmissionReviewModal
            submission={selectedSubmission}
            student={selectedStudent}
            onEvaluate={handleEvaluateSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

// Student Card Component
const StudentCard: React.FC<{
  student: StudentProfile;
  onView: () => void;
}> = ({ student, onView }) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={onView}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{student.displayName || student.email}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{student.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          student.jobReadinessScore >= 80
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : student.jobReadinessScore >= 60
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {student.jobReadinessScore}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            student.jobReadinessScore >= 80 ? 'bg-green-500' :
            student.jobReadinessScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${student.jobReadinessScore}%` }}
        />
      </div>
    </div>
  );
};

// Student Details Panel
const StudentDetailsPanel: React.FC<{
  student: StudentProfile;
  onVerifySkill: (studentId: string, skillId: string, status: 'verified' | 'rejected') => void;
  onReviewSubmission: (submission: AssessmentSubmission) => void;
  onClose: () => void;
}> = ({ student, onVerifySkill, onReviewSubmission, onClose }) => {
  const pendingSubmissions: AssessmentSubmission[] = [];
  
  (student.skills || []).forEach(skill => {
    (skill.assessments || []).forEach(assessment => {
      if (assessment.submission && assessment.status === 'submitted') {
        pendingSubmissions.push(assessment.submission);
      }
    });
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Details</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{student.displayName || student.email}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Readiness: {student.jobReadinessScore}%</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
        <div className="space-y-2">
          {(student.skills || []).map(skill => (
            <div key={skill.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{skill.score}%</span>
              </div>
              {skill.verificationStatus === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onVerifySkill(student.uid, skill.id, 'verified')}
                    className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => onVerifySkill(student.uid, skill.id, 'rejected')}
                    className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {pendingSubmissions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Pending Submissions ({pendingSubmissions.length})
          </h4>
          <div className="space-y-2">
            {pendingSubmissions.map(submission => (
              <button
                key={submission.id}
                onClick={() => onReviewSubmission(submission)}
                className="w-full text-left p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
              >
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Review Submission</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400">Assessment ID: {submission.assessmentId}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Submission Review Modal
const SubmissionReviewModal: React.FC<{
  submission: AssessmentSubmission;
  student: StudentProfile;
  onEvaluate: (submissionId: string, feedback: string, score: number) => void;
  onClose: () => void;
}> = ({ submission, student, onEvaluate, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(70);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      // Find the assessment
      const assessment = student.skills
        .flatMap(s => s.assessments)
        .find(a => a.id === submission.assessmentId);

      if (assessment) {
      const aiFeedback = await generateProfessorFeedback({
        content: submission.content || '',
        assessmentTitle: assessment?.title || 'Assessment',
        studentSkillLevel: 'intermediate', // Could be derived from student's skill level
      });

        setFeedback(aiFeedback.feedback);
        setScore(aiFeedback.score);
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback');
      return;
    }
    onEvaluate(submission.id, feedback, score);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Submission</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Student: {student.displayName || student.email}</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Submission:</h5>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {submission.content}
            </pre>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Score: {score}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Feedback
            </label>
            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {aiGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Provide detailed feedback..."
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Submit Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
