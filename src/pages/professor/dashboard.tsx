// Enhanced Professor Dashboard with Student Management and Verification
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import Chatbot from "../../components/Chatbot";
import VerificationRequests from "../../components/VerificationRequests";
import {
  getStudentProfile,
  getVerificationRequests,
  getPendingVerificationRequests,
  onPendingVerificationsUpdate,
  onSkillVerificationRequestsUpdate,
} from "../../services/studentService";
import {
  StudentProfile,
  AssessmentSubmission,
  ProfessorFeedback,
} from "../../types";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ProfessorDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(
    null,
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<AssessmentSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "needs-attention" | "ready"
  >("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [minSkillPoints, setMinSkillPoints] = useState(0);
  const [maxSkillPoints, setMaxSkillPoints] = useState(100);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const loadStudents = async () => {
      try {
        // Get all students (in production, filter by assigned students)
        const studentsRef = collection(db, "students");
        const studentsSnapshot = await getDocs(studentsRef);

        const studentsList: StudentProfile[] = [];
        studentsSnapshot.forEach((docSnap) => {
          const data = docSnap.data() as StudentProfile;
          // Ensure uid exists even for legacy/demo docs
          studentsList.push({
            ...data,
            uid: data.uid || docSnap.id,
          } as StudentProfile);
        });

        setStudents(studentsList);
        console.log(
          "[Firestore Read] Loaded all students:",
          studentsList.length,
        );

        // Load pending SKILL VERIFICATION requests (not student-level verification)
        const skillRequests = await getVerificationRequests(
          undefined,
          currentUser?.uid,
        );
        setVerificationRequests(
          skillRequests.filter((r: any) => r.status === "pending"),
        );
        console.log(
          "[Firestore Read] Loaded pending skill verification requests:",
          skillRequests.length,
        );

        // Set up real-time listener for pending SKILL VERIFICATION requests
        const unsubscribe = onSkillVerificationRequestsUpdate(
          (updatedRequests) => {
            console.log(
              "[State Sync] Skill verification requests updated via real-time listener:",
              {
                count: updatedRequests.length,
              },
            );
            setVerificationRequests(updatedRequests);
          },
          (error) => {
            console.error(
              "[State Sync Error] Failed to listen for skill verification updates:",
              error,
            );
          },
        );

        return unsubscribe;
      } catch (error) {
        console.error("[Firestore Read Error] Error loading students:", error);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = loadStudents();
    return () => {
      // Handle cleanup if it's a promise
      if (cleanup instanceof Promise) {
        cleanup
          .then((unsubscribe) => {
            if (unsubscribe) unsubscribe();
          })
          .catch(console.error);
      }
    };
  }, [currentUser]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.displayName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "needs-attention" &&
        (student.jobReadinessScore ?? 0) < 60) ||
      (filterStatus === "ready" && (student.jobReadinessScore ?? 0) >= 80);

    // Skill point filtering
    let matchesSkill = true;
    if (skillFilter.trim()) {
      matchesSkill = (student.skills || []).some((skill) => {
        const nameMatches = skill.name
          .toLowerCase()
          .includes(skillFilter.toLowerCase());
        const pointsInRange =
          skill.score >= minSkillPoints && skill.score <= maxSkillPoints;
        return nameMatches && pointsInRange;
      });
    } else if (minSkillPoints > 0 || maxSkillPoints < 100) {
      // If no skill name specified but points range is set, check if any skill is in range
      matchesSkill = (student.skills || []).some(
        (skill) =>
          skill.score >= minSkillPoints && skill.score <= maxSkillPoints,
      );
    }

    return matchesSearch && matchesFilter && matchesSkill;
  });

  const handleViewStudent = async (studentId: string) => {
    try {
      const student = await getStudentProfile(studentId);
      if (student) {
        setSelectedStudent(student);
      }
    } catch (error) {
      console.error("Error loading student:", error);
    }
  };

  const handleReviewSubmission = async (submission: AssessmentSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleVerifySkill = async (
    studentId: string,
    skillId: string,
    status: "verified" | "rejected",
  ) => {
    if (!currentUser) return;

    try {
      const studentRef = doc(db, "students", studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) return;

      const studentData = studentDoc.data() as StudentProfile;
      const updatedSkills = (studentData.skills || []).map((skill) => {
        if (skill.id === skillId) {
          return {
            ...skill,
            verificationStatus: status,
            verifiedBy: currentUser.uid,
            verifiedAt: new Date().toISOString(),
          };
        }
        return skill;
      });

      await updateDoc(studentRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp(),
      });

      // Create feedback record
      const feedbackRef = doc(collection(db, "professorFeedback"));
      await setDoc(feedbackRef, {
        id: feedbackRef.id,
        studentId,
        professorId: currentUser.uid,
        skillId,
        verificationStatus: status,
        createdAt: serverTimestamp(),
        aiAssisted: false,
      });

      alert(
        `Skill ${status === "verified" ? "verified" : "rejected"} successfully!`,
      );

      // Reload students
      const updatedStudent = await getStudentProfile(studentId);
      if (updatedStudent) {
        setStudents((prev) =>
          prev.map((s) => (s.uid === studentId ? updatedStudent : s)),
        );
        if (selectedStudent?.uid === studentId) {
          setSelectedStudent(updatedStudent);
        }
      }
    } catch (error) {
      console.error("Error verifying skill:", error);
      alert("Failed to verify skill. Please try again.");
    }
  };

  const handleProcessVerificationRequest = async (
    requestId: string,
    action: "verify" | "reject",
  ) => {
    if (!currentUser) return;

    setProcessingRequestId(requestId);
    try {
      const response = await fetch(
        "/api/skills/verify-request?action=process",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            action,
            processorId: currentUser.uid,
            processorNotes: "",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      // Reload requests and students
      setVerificationRequests((prev) => prev.filter((r) => r.id !== requestId));
      const requests = await getVerificationRequests(
        undefined,
        currentUser.uid,
      );
      setVerificationRequests(
        requests.filter((r: any) => r.status === "pending"),
      );

      // Reload students to reflect updated verification status
      const studentsRef = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsList: StudentProfile[] = [];
      studentsSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StudentProfile;
        studentsList.push({
          ...data,
          uid: data.uid || docSnap.id,
        } as StudentProfile);
      });
      setStudents(studentsList);

      alert(
        `Skill ${action === "verify" ? "verified" : "rejected"} successfully!`,
      );
    } catch (error) {
      console.error("Error processing verification request:", error);
      alert(`Failed to ${action} skill. Please try again.`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleEvaluateSubmission = async (
    submissionId: string,
    feedback: string,
    score: number,
  ) => {
    if (!currentUser || !selectedSubmission) return;

    try {
      const submissionRef = doc(db, "assessmentSubmissions", submissionId);
      await updateDoc(submissionRef, {
        feedback,
        score,
        evaluatedBy: currentUser.uid,
        evaluatedAt: serverTimestamp(),
      });

      // Update student's skill score based on assessment
      if (selectedStudent) {
        const studentRef = doc(db, "students", selectedStudent.uid);
        const studentDoc = await getDoc(studentRef);

        if (studentDoc.exists()) {
          const studentData = studentDoc.data() as StudentProfile;
          const updatedSkills = (studentData.skills || []).map((skill) => {
            const assessments = skill.assessments || [];
            const assessment = assessments.find(
              (a) => a.id === selectedSubmission.assessmentId,
            );
            if (assessment) {
              // Update assessment
              const updatedAssessments = assessments.map((a) =>
                a.id === assessment.id
                  ? {
                      ...a,
                      status: "evaluated",
                      score,
                      submission: { ...selectedSubmission, feedback, score },
                    }
                  : a,
              );

              // Recalculate skill score
              const evaluatedAssessments = updatedAssessments.filter(
                (a) => a.score !== undefined,
              );
              const avgScore =
                evaluatedAssessments.length > 0
                  ? Math.round(
                      evaluatedAssessments.reduce(
                        (sum, a) => sum + (a.score || 0),
                        0,
                      ) / evaluatedAssessments.length,
                    )
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

      alert("Submission evaluated successfully!");
      setSelectedSubmission(null);

      // Reload student
      if (selectedStudent) {
        const updatedStudent = await getStudentProfile(selectedStudent.uid);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
          setStudents((prev) =>
            prev.map((s) =>
              s.uid === selectedStudent.uid ? updatedStudent : s,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error evaluating submission:", error);
      alert("Failed to evaluate submission. Please try again.");
    }
  };

  const stats = {
    total: students.length,
    ready: students.filter((s) => (s.jobReadinessScore ?? 0) >= 80).length,
    developing: students.filter(
      (s) =>
        (s.jobReadinessScore ?? 0) >= 60 && (s.jobReadinessScore ?? 0) < 80,
    ).length,
    needsAttention: students.filter((s) => (s.jobReadinessScore ?? 0) < 60)
      .length,
    avgReadiness:
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + (s.jobReadinessScore ?? 0), 0) /
              students.length,
          )
        : 0,
  };

  // Prepare skill points data for graph
  const skillPointsData = (() => {
    const skillMap = new Map<string, { total: number; count: number }>();
    filteredStudents.forEach((student) => {
      (student.skills || []).forEach((skill) => {
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
        students: data.count,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints)
      .slice(0, 10);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-900 dark:text-white">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["professor"]}>
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
                  <p className="text-purple-100 text-sm font-medium">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Avg Readiness
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.avgReadiness}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Ready (80%+)
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.ready}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Needs Attention
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {stats.needsAttention}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Requests Section */}
          <div className="mb-8">
            <VerificationRequests
              requests={verificationRequests as StudentProfile[]}
              loading={loading}
              professorId={currentUser?.uid}
              onProcessed={() => {
                console.log(
                  "[UI] Verification processed, list will auto-update via real-time listener",
                );
              }}
            />
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Filters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Students
                </label>
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Readiness Level
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Students</option>
                  <option value="needs-attention">
                    Needs Attention (&lt;60%)
                  </option>
                  <option value="ready">Ready (80%+)</option>
                </select>
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

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setSkillFilter("");
                    setMinSkillPoints(0);
                    setMaxSkillPoints(100);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Pending Skill Verification Requests */}
          {verificationRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Pending Skill Verification Requests (
                {verificationRequests.length})
              </h2>
              <div className="space-y-3">
                {verificationRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.skillName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Student ID: {request.studentId} • Level:{" "}
                          {request.skillLevel} • Score: {request.score}/100
                        </p>
                        {request.proofLinks &&
                          request.proofLinks.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Proof Links:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {request.proofLinks.map(
                                  (link: string, idx: number) => (
                                    <a
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                      Link {idx + 1}
                                    </a>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            handleProcessVerificationRequest(
                              request.id,
                              "verify",
                            )
                          }
                          disabled={processingRequestId === request.id}
                          className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          {processingRequestId === request.id
                            ? "Processing..."
                            : "Verify"}
                        </button>
                        <button
                          onClick={() =>
                            handleProcessVerificationRequest(
                              request.id,
                              "reject",
                            )
                          }
                          disabled={processingRequestId === request.id}
                          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          {processingRequestId === request.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Points Graph */}
          {skillPointsData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Top Skills - Average Points Across Students
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
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F3F4F6",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="avgPoints"
                      fill="#6366f1"
                      name="Avg Skill Points"
                    />
                    <Bar
                      dataKey="students"
                      fill="#22c55e"
                      name="# of Students"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Students List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Students ({filteredStudents.length})
                </h2>
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No students found.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
  const displayScore = student.jobReadinessScore ?? 0;
  const topSkills = (student.skills || [])
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div
      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {student.displayName || student.email?.split("@")[0] || "Student"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {student.email || "No email"}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            displayScore >= 80
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              : displayScore >= 60
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }`}
        >
          {displayScore}%
        </span>
      </div>

      {/* Top Skills with Points */}
      {topSkills.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Top Skills (Points):
          </p>
          <div className="flex flex-wrap gap-1">
            {topSkills.map((skill) => (
              <span
                key={skill.id}
                className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded"
              >
                {skill.name}: {skill.score}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            displayScore >= 80
              ? "bg-green-500"
              : displayScore >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${displayScore}%` }}
        />
      </div>
    </div>
  );
};

// Student Details Panel
const StudentDetailsPanel: React.FC<{
  student: StudentProfile;
  onVerifySkill: (
    studentId: string,
    skillId: string,
    status: "verified" | "rejected",
  ) => void;
  onReviewSubmission: (submission: AssessmentSubmission) => void;
  onClose: () => void;
}> = ({ student, onVerifySkill, onReviewSubmission, onClose }) => {
  const pendingSubmissions: AssessmentSubmission[] = [];

  (student.skills || []).forEach((skill) => {
    // Ensure skills array exists
    (skill.assessments || []).forEach((assessment) => {
      // Ensure assessments array exists
      if (assessment.submission && assessment.status === "submitted") {
        pendingSubmissions.push(assessment.submission);
      }
    });
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Student Details
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {student.displayName || student.email?.split("@")[0] || "Student"}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {student.email || "No email"}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Readiness: {student.jobReadinessScore ?? 0}%
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Skills & Points
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {(student.skills || []).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No skills added yet
            </p>
          ) : (
            (student.skills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {skill.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({skill.category})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {skill.score ?? 0} pts
                    </span>
                    {skill.verificationStatus === "verified" && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                {skill.verificationStatus === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        onVerifySkill(student.uid, skill.id, "verified")
                      }
                      className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() =>
                        onVerifySkill(student.uid, skill.id, "rejected")
                      }
                      className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {pendingSubmissions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Pending Submissions ({pendingSubmissions.length})
          </h4>
          <div className="space-y-2">
            {pendingSubmissions.map((submission) => (
              <button
                key={submission.id}
                onClick={() => onReviewSubmission(submission)}
                className="w-full text-left p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
              >
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  Review Submission
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400">
                  Assessment ID: {submission.assessmentId}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects & Portfolio */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Projects & Portfolio
        </h4>
        {student.projects && student.projects.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {student.projects.map((project) => (
              <div
                key={project.id}
                className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.title}
                </p>
                {project.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tech: {project.technologies.join(", ")}
                  </p>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No projects added yet
          </p>
        )}

        {(student.portfolioUrl || student.githubUrl || student.linkedinUrl) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Portfolio Links:
            </p>
            <div className="space-y-1">
              {student.portfolioUrl && (
                <a
                  href={student.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block"
                >
                  Portfolio
                </a>
              )}
              {student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block"
                >
                  GitHub
                </a>
              )}
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </div>
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
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(70);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      // Find the assessment
      const assessment = (student.skills || [])
        .flatMap((s) => s.assessments || [])
        .find((a) => a.id === submission.assessmentId);

      if (assessment) {
        // Generate rule-based feedback
        const contentLength = submission.content?.length || 0;
        const wordCount = submission.content?.split(/\s+/).length || 0;

        const baseFeedback =
          contentLength > 500
            ? "Well-detailed response. Good effort in explaining concepts."
            : contentLength > 200
              ? "Response covers basic concepts. Consider adding more depth and examples."
              : "Response is brief. Please provide more comprehensive answers with examples.";

        const generatedScore = Math.min(
          100,
          Math.max(50, Math.round(50 + wordCount / 20)),
        );

        setFeedback(baseFeedback);
        setScore(generatedScore);
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!feedback.trim()) {
      alert("Please provide feedback");
      return;
    }
    onEvaluate(submission.id, feedback, score);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Review Submission
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Student: {student.displayName || student.email}
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Submission:
            </h5>
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
              {aiGenerating ? "Generating..." : "Generate with AI"}
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
