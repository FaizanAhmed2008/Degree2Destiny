// Student Service - Business logic for student operations
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  StudentProfile,
  StudentSkill,
  Assessment,
  AssessmentSubmission,
  JobReadinessLevel,
} from "../types";

// Utility to generate a random score between 40 and 100 (inclusive)
const generateRandomScore = () => Math.floor(40 + Math.random() * 61);

/**
 * Calculate job readiness score from skills
 */
export function calculateJobReadinessScore(skills: StudentSkill[]): number {
  if (skills.length === 0) return 0;

  // Weight verified skills more heavily
  const totalScore = skills.reduce((sum, skill) => {
    const baseScore = skill.score;
    const verifiedBonus = skill.verificationStatus === "verified" ? 10 : 0;
    return sum + baseScore + verifiedBonus;
  }, 0);

  return Math.min(100, Math.round(totalScore / skills.length));
}

/**
 * Determine job readiness level
 */
export function getJobReadinessLevel(score: number): JobReadinessLevel {
  if (score >= 85) return "highly-ready";
  if (score >= 70) return "ready";
  if (score >= 50) return "developing";
  return "not-ready";
}

/**
 * Get or create student profile
 */
export async function getStudentProfile(
  uid: string,
): Promise<StudentProfile | null> {
  try {
    const studentRef = doc(db, "students", uid);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      return null;
    }

    let student = studentDoc.data() as StudentProfile;

    // Ensure mock Destiny scores exist and persist them if missing
    // This keeps the data generation in one place and makes graphs consistent
    if (
      student.aptitudeScore === undefined ||
      student.technicalScore === undefined ||
      student.communicationScore === undefined ||
      student.overallScore === undefined
    ) {
      const aptitudeScore = student.aptitudeScore ?? generateRandomScore();
      const technicalScore = student.technicalScore ?? generateRandomScore();
      const communicationScore =
        student.communicationScore ?? generateRandomScore();
      const overallScore = Math.round(
        (aptitudeScore + technicalScore + communicationScore) / 3,
      );

      await updateDoc(studentRef, {
        aptitudeScore,
        technicalScore,
        communicationScore,
        overallScore,
        updatedAt: serverTimestamp(),
      });

      student = {
        ...student,
        aptitudeScore,
        technicalScore,
        communicationScore,
        overallScore,
      };
    }

    return student;
  } catch (error) {
    console.error("Error getting student profile:", error);
    return null;
  }
}

/**
 * Create or update student profile
 */
export async function saveStudentProfile(
  profile: Partial<StudentProfile>,
): Promise<void> {
  if (!profile.uid) throw new Error("Student UID is required");

  try {
    const studentRef = doc(db, "students", profile.uid);
    const existingDoc = await getDoc(studentRef);

    const updateData = {
      ...profile,
      updatedAt: serverTimestamp(),
    };

    if (!existingDoc.exists()) {
      updateData.createdAt = serverTimestamp();
      updateData.onboardingCompleted = false;
      updateData.onboardingStep = 0;
      updateData.registrationCompleted = false;
      updateData.verificationStatus = "pending";
      updateData.jobReadinessScore = 0;
      updateData.jobReadinessLevel = "not-ready";
      updateData.skills = [];
      updateData.projects = [];
      updateData.achievements = [];
      updateData.certifications = [];
    }

    await setDoc(studentRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error saving student profile:", error);
    throw error;
  }
}

/**
 * Add or update a skill
 */
export async function saveStudentSkill(
  studentId: string,
  skill: StudentSkill,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("Student profile not found");
    }

    const studentData = studentDoc.data() as StudentProfile;
    const skills = studentData.skills || [];

    const existingIndex = skills.findIndex((s) => s.id === skill.id);
    if (existingIndex >= 0) {
      skills[existingIndex] = { ...skill };
    } else {
      skills.push({ ...skill });
    }

    // Recalculate readiness score
    const readinessScore = calculateJobReadinessScore(skills);
    const readinessLevel = getJobReadinessLevel(readinessScore);

    await updateDoc(studentRef, {
      skills,
      jobReadinessScore: readinessScore,
      jobReadinessLevel: readinessLevel,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving student skill:", error);
    throw error;
  }
}

/**
 * Delete a skill by id (and recalculate readiness)
 */
export async function deleteStudentSkill(
  studentId: string,
  skillId: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("Student profile not found");
    }

    const studentData = studentDoc.data() as StudentProfile;
    const skills = studentData.skills || [];
    const updatedSkills = skills.filter((s) => s.id !== skillId);

    // Recalculate readiness score
    const readinessScore = calculateJobReadinessScore(updatedSkills);
    const readinessLevel = getJobReadinessLevel(readinessScore);

    await updateDoc(studentRef, {
      skills: updatedSkills,
      jobReadinessScore: readinessScore,
      jobReadinessLevel: readinessLevel,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting student skill:", error);
    throw error;
  }
}

/**
 * Submit an assessment
 */
export async function submitAssessment(
  studentId: string,
  assessmentId: string,
  submission: Omit<AssessmentSubmission, "id" | "submittedAt">,
): Promise<void> {
  try {
    const submissionRef = doc(collection(db, "assessmentSubmissions"));
    const submissionData: AssessmentSubmission = {
      ...submission,
      id: submissionRef.id,
      submittedAt: serverTimestamp(),
    };

    await setDoc(submissionRef, submissionData);

    // Update assessment status
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (studentDoc.exists()) {
      const studentData = studentDoc.data() as StudentProfile;
      const skills = studentData.skills || [];

      // Find and update the assessment
      for (const skill of skills) {
        const assessments = skill.assessments || [];
        const assessmentIndex = assessments.findIndex(
          (a) => a.id === assessmentId,
        );
        if (assessmentIndex >= 0) {
          assessments[assessmentIndex].status = "submitted";
          assessments[assessmentIndex].submission = submissionData;
          skill.assessments = assessments;

          await saveStudentSkill(studentId, skill);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error submitting assessment:", error);
    throw error;
  }
}

/**
 * Generate insights for student (rule-based, no AI)
 */
export async function generateStudentInsights(
  studentId: string,
): Promise<void> {
  try {
    const studentProfile = await getStudentProfile(studentId);
    if (!studentProfile) throw new Error("Student not found");

    // Rule-based analysis - no API calls
    const skills = studentProfile.skills || [];
    const weaknesses = skills.filter((s) => s.score < 60).map((s) => s.name);
    const strengths = skills.filter((s) => s.score >= 80).map((s) => s.name);

    // Generate basic insights without AI
    const insights = {
      strengths,
      weaknesses,
      suggestedRoles: studentProfile.preferredRoles || [
        "Software Developer",
        "Full Stack Developer",
      ],
      learningRoadmap:
        weaknesses.length > 0
          ? [
              {
                skill: weaknesses[0],
                level: "Intermediate",
                estimatedTime: "4-6 weeks",
                resources: [],
              },
            ]
          : [],
      summary: `You have ${strengths.length} strong skills and ${weaknesses.length} areas for improvement.`,
      lastAnalyzed: new Date().toISOString(),
    };

    // Update student profile with insights
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      aiInsights: insights,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error generating student insights:", error);
    throw error;
  }
}

/**
 * Get improvement suggestions for a skill (rule-based, no AI)
 */
export async function getSkillImprovementSuggestions(
  skillName: string,
  currentScore: number,
  targetScore: number = 80,
): Promise<{
  actionItems: string[];
  resources: Array<{ title: string; url: string; type: string }>;
  timeline: string;
}> {
  // Rule-based suggestions based on skill name and score
  const improvementGap = targetScore - currentScore;

  return {
    actionItems: [
      `Focus on ${skillName} fundamentals`,
      `Build practice projects using ${skillName}`,
      `Review common patterns and best practices`,
      `Take on more complex tasks gradually`,
    ],
    resources: [
      { title: `Learn ${skillName}`, url: "#", type: "learning" },
      { title: `${skillName} Best Practices`, url: "#", type: "guide" },
      { title: "Practice Problems", url: "#", type: "practice" },
    ],
    timeline:
      improvementGap > 30
        ? "8-12 weeks"
        : improvementGap > 15
          ? "4-8 weeks"
          : "2-4 weeks",
  };
}

/**
 * Send a skill verification request to professors
 */
export async function sendSkillVerificationRequest(
  studentId: string,
  skillId: string,
  skillName: string,
  skillLevel: string,
  score: number,
  proofLinks: string[],
): Promise<string> {
  try {
    const response = await fetch("/api/skills/verify-request?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        skillId,
        skillName,
        skillLevel,
        score,
        proofLinks,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send verification request");
    }

    const data = await response.json();
    return data.requestId;
  } catch (error) {
    console.error("Error sending verification request:", error);
    throw error;
  }
}

/**
 * Get verification requests (for students or professors)
 */
export async function getVerificationRequests(
  studentId?: string,
  processorId?: string,
  status?: string,
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (processorId) params.append("processorId", processorId);
    if (status) params.append("status", status);

    const response = await fetch(
      `/api/skills/verify-request?action=list&${params}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get verification requests");
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error("Error getting verification requests:", error);
    throw error;
  }
}

/**
 * Real-time listener for pending skill verification requests
 * Fetches all pending requests from the skillVerificationRequests collection
 * Returns unsubscribe function
 */
export function onSkillVerificationRequestsUpdate(
  onUpdate: (requests: any[]) => void,
  onError?: (error: Error) => void,
): () => void {
  try {
    const requestsRef = collection(db, "skillVerificationRequests");
    const q = query(requestsRef, where("status", "==", "pending"));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const requests: any[] = [];

        // Get detailed student info for each request
        for (const docSnap of querySnapshot.docs) {
          const requestData = docSnap.data();

          // Fetch student profile to get additional details
          try {
            const studentRef = doc(db, "students", requestData.studentId);
            const studentDoc = await getDoc(studentRef);

            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              requests.push({
                ...requestData,
                id: requestData.id || docSnap.id,
                studentName:
                  studentData.displayName || studentData.email || "Unknown",
                studentEmail: studentData.email,
                studentCollege: studentData.college,
              });
            } else {
              // Still include request even if student not found
              requests.push({
                ...requestData,
                id: requestData.id || docSnap.id,
                studentName: "Unknown",
              });
            }
          } catch (fetchError) {
            console.error(
              "Error fetching student details for request:",
              fetchError,
            );
            // Still include the request
            requests.push({
              ...requestData,
              id: requestData.id || docSnap.id,
            });
          }
        }

        // Sort by most recent first
        requests.sort((a, b) => {
          const timeA = a.requestedAt?.toMillis?.() || 0;
          const timeB = b.requestedAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        console.log("[State Sync] Skill verification requests updated:", {
          count: requests.length,
          requestIds: requests.map((r) => r.id),
        });

        onUpdate(requests);
      },
      (error) => {
        console.error(
          "[State Sync Error] Real-time listener error for skill verification requests:",
          error,
        );
        if (onError) onError(error);
      },
    );

    console.log(
      "[State Sync] Real-time listener registered for skill verification requests",
    );
    return unsubscribe;
  } catch (error) {
    console.error(
      "[State Sync Error] Failed to subscribe to skill verification requests:",
      error,
    );
    throw error;
  }
}

/**
 * Request student verification (student-initiated)
 * Updates verificationStatus to PENDING and sets requestedAt timestamp
 */
export async function requestStudentVerification(
  studentId: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("[Firestore Read] Student not found");
    }

    const studentData = studentDoc.data() as StudentProfile;

    // Check if already verified or pending
    if (studentData.verificationStatus === "pending") {
      throw new Error("Verification request already pending");
    }
    if (studentData.verificationStatus === "verified") {
      throw new Error("Student already verified");
    }

    await updateDoc(studentRef, {
      verificationStatus: "pending",
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(
      "[Firestore Write] Verification request submitted for student:",
      studentId,
    );
  } catch (error) {
    console.error(
      "[Firestore Write Error] Failed to request verification:",
      error,
    );
    throw error;
  }
}

/**
 * Approve student verification (professor-initiated)
 * Updates verificationStatus to VERIFIED, sets verifiedAt and verifiedBy
 */
export async function approveStudentVerification(
  studentId: string,
  professorId: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("[Firestore Read] Student not found");
    }

    await updateDoc(studentRef, {
      verificationStatus: "verified",
      verifiedAt: serverTimestamp(),
      verifiedBy: professorId,
      updatedAt: serverTimestamp(),
    });

    console.log("[Firestore Write] Student verified by professor:", {
      studentId,
      professorId,
    });
  } catch (error) {
    console.error(
      "[Firestore Write Error] Failed to approve verification:",
      error,
    );
    throw error;
  }
}

/**
 * Reject student verification (professor-initiated)
 * Updates verificationStatus to REJECTED, sets verifiedAt and verifiedBy
 */
export async function rejectStudentVerification(
  studentId: string,
  professorId: string,
  reason?: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("[Firestore Read] Student not found");
    }

    const updateData: any = {
      verificationStatus: "rejected",
      verifiedAt: serverTimestamp(),
      verifiedBy: professorId,
      updatedAt: serverTimestamp(),
    };

    // Optional: Store rejection reason as a separate field or in a log
    if (reason) {
      updateData.rejectionReason = reason;
      updateData.rejectionAt = serverTimestamp();
    }

    await updateDoc(studentRef, updateData);

    console.log(
      "[Firestore Write] Student verification rejected by professor:",
      {
        studentId,
        professorId,
        reason,
      },
    );
  } catch (error) {
    console.error(
      "[Firestore Write Error] Failed to reject verification:",
      error,
    );
    throw error;
  }
}

/**
 * Get students with pending verification requests
 */
export async function getPendingVerificationRequests(
  professorId?: string,
): Promise<StudentProfile[]> {
  try {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("verificationStatus", "==", "pending"));
    const querySnapshot = await getDocs(q);

    const students: StudentProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as StudentProfile;
      // Filter by professor if specified (optional - for assigned students)
      if (
        !professorId ||
        !data.assignedProfessorId ||
        data.assignedProfessorId === professorId
      ) {
        students.push({
          ...data,
          uid: data.uid || docSnap.id,
        });
      }
    });

    console.log("[Firestore Read] Fetched pending verification requests:", {
      count: students.length,
    });
    return students;
  } catch (error) {
    console.error(
      "[Firestore Read Error] Failed to get pending verification requests:",
      error,
    );
    throw error;
  }
}

/**
 * Get students with verified status
 */
export async function getVerifiedStudents(): Promise<StudentProfile[]> {
  try {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("verificationStatus", "==", "verified"));
    const querySnapshot = await getDocs(q);

    const students: StudentProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as StudentProfile;
      students.push({
        ...data,
        uid: data.uid || docSnap.id,
      });
    });

    console.log("[Firestore Read] Fetched verified students:", {
      count: students.length,
    });
    return students;
  } catch (error) {
    console.error(
      "[Firestore Read Error] Failed to get verified students:",
      error,
    );
    throw error;
  }
}

/**
 * Subscribe to real-time student verification updates
 * Returns unsubscribe function
 */
export function onStudentVerificationUpdate(
  studentId: string,
  onUpdate: (student: StudentProfile) => void,
  onError?: (error: Error) => void,
): () => void {
  try {
    const studentRef = doc(db, "students", studentId);

    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StudentProfile;
          onUpdate({
            ...data,
            uid: data.uid || docSnap.id,
          });
        }
      },
      (error) => {
        console.error("[State Sync Error] Real-time listener error:", error);
        if (onError) onError(error);
      },
    );

    console.log(
      "[State Sync] Real-time listener registered for student:",
      studentId,
    );
    return unsubscribe;
  } catch (error) {
    console.error(
      "[State Sync Error] Failed to subscribe to verification updates:",
      error,
    );
    throw error;
  }
}

/**
 * Subscribe to real-time pending verification requests
 * Returns unsubscribe function
 */
export function onPendingVerificationsUpdate(
  onUpdate: (students: StudentProfile[]) => void,
  onError?: (error: Error) => void,
  professorId?: string,
): () => void {
  try {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("verificationStatus", "==", "pending"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const students: StudentProfile[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as StudentProfile;
          // Filter by professor if specified
          if (
            !professorId ||
            !data.assignedProfessorId ||
            data.assignedProfessorId === professorId
          ) {
            students.push({
              ...data,
              uid: data.uid || docSnap.id,
            });
          }
        });
        onUpdate(students);
      },
      (error) => {
        console.error("[State Sync Error] Real-time listener error:", error);
        if (onError) onError(error);
      },
    );

    console.log(
      "[State Sync] Real-time listener registered for pending verifications",
    );
    return unsubscribe;
  } catch (error) {
    console.error(
      "[State Sync Error] Failed to subscribe to pending verifications:",
      error,
    );
    throw error;
  }
}

// ============================================
// STUDENT STATUS & VISIBILITY
// ============================================

/**
 * Update student status (Ready/Building/Studying/Looking)
 */
export async function updateStudentStatus(
  studentId: string,
  status: "ready-to-work" | "skill-building" | "studying" | "actively-looking",
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      studentStatus: status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating student status:", error);
    throw error;
  }
}

/**
 * Update profile visibility
 */
export async function updateProfileVisibility(
  studentId: string,
  visibility:
    | "visible-to-all"
    | "visible-to-hr"
    | "visible-to-professor"
    | "hidden",
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      profileVisibility: visibility,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating profile visibility:", error);
    throw error;
  }
}

/**
 * Get student visibility status (checks if visible to a specific role)
 */
export function canViewStudent(
  studentProfile: StudentProfile | null,
  viewerRole: "student" | "professor" | "recruiter",
): boolean {
  if (!studentProfile) return false;

  const visibility = studentProfile.profileVisibility || "visible-to-all";

  if (visibility === "hidden") return false;
  if (visibility === "visible-to-all") return true;
  if (visibility === "visible-to-hr" && viewerRole === "recruiter") return true;
  if (visibility === "visible-to-professor" && viewerRole === "professor")
    return true;

  return false;
}

// ============================================
// ACCOUNT DELETION
// ============================================

/**
 * Completely delete student account and all associated data
 */
export async function deleteStudentAccount(studentId: string): Promise<void> {
  try {
    // Delete student document
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      deletedAt: serverTimestamp(),
      isDeleted: true,
    });

    // In production, you might also delete:
    // - Test attempts
    // - Messages/conversations
    // - Verification requests
    // - Interview transcripts
    // etc.

    console.log(`Student account ${studentId} marked for deletion`);
  } catch (error) {
    console.error("Error deleting student account:", error);
    throw error;
  }
}

// ============================================
// SKILL-SPECIFIC VERIFICATION
// ============================================

/**
 * Verify a specific skill (not just overall verification)
 */
export async function verifySkill(
  studentId: string,
  skillId: string,
  professorId: string,
  feedback?: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("Student not found");
    }

    const student = studentDoc.data() as StudentProfile;
    const skills = student.skills || [];

    // Find and update the skill
    const updatedSkills = skills.map((skill) => {
      if (skill.id === skillId) {
        return {
          ...skill,
          verificationStatus: "verified" as const,
          verifiedBy: professorId,
          verifiedAt: serverTimestamp(),
        };
      }
      return skill;
    });

    await updateDoc(studentRef, {
      skills: updatedSkills,
      updatedAt: serverTimestamp(),
    });

    console.log(`Skill ${skillId} verified for student ${studentId}`);
  } catch (error) {
    console.error("Error verifying skill:", error);
    throw error;
  }
}

/**
 * Reject a specific skill verification
 */
export async function rejectSkillVerification(
  studentId: string,
  skillId: string,
  feedback?: string,
): Promise<void> {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error("Student not found");
    }

    const student = studentDoc.data() as StudentProfile;
    const skills = student.skills || [];

    // Find and update the skill
    const updatedSkills = skills.map((skill) => {
      if (skill.id === skillId) {
        return {
          ...skill,
          verificationStatus: "rejected" as const,
        };
      }
      return skill;
    });

    await updateDoc(studentRef, {
      skills: updatedSkills,
      updatedAt: serverTimestamp(),
    });

    console.log(`Skill ${skillId} rejected for student ${studentId}`);
  } catch (error) {
    console.error("Error rejecting skill verification:", error);
    throw error;
  }
}

/**
 * Get students visible to a specific role
 */
export async function getVisibleStudents(
  viewerRole: "professor" | "recruiter",
): Promise<StudentProfile[]> {
  try {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef);
    const snapshot = await getDocs(q);

    const students: StudentProfile[] = [];
    snapshot.forEach((doc) => {
      const student = doc.data() as StudentProfile;
      if (canViewStudent(student, viewerRole)) {
        students.push(student);
      }
    });

    return students;
  } catch (error) {
    console.error("Error getting visible students:", error);
    throw error;
  }
}
