import { NextApiRequest, NextApiResponse } from "next";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

interface SkillVerificationRequest {
  id: string;
  studentId: string;
  skillId: string;
  skillName: string;
  skillLevel: string;
  score: number;
  proofLinks: string[];
  status: "pending" | "verified" | "rejected";
  requestedAt: any;
  processedAt?: any;
  processedBy?: string;
  processorNotes?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { action } = req.query;

  try {
    if (action === "send") {
      return handleSendRequest(req, res);
    } else if (action === "list") {
      return handleListRequests(req, res);
    } else if (action === "process") {
      return handleProcessRequest(req, res);
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("[Skill Verify API] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleSendRequest(req: NextApiRequest, res: NextApiResponse) {
  const { studentId, skillId, skillName, skillLevel, score, proofLinks } =
    req.body;

  if (!studentId || !skillId || !skillName || !skillLevel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if a pending request already exists for this skill
    const existingRequestQuery = query(
      collection(db, "skillVerificationRequests"),
      where("studentId", "==", studentId),
      where("skillId", "==", skillId),
      where("status", "==", "pending"),
    );

    const existingSnapshot = await getDocs(existingRequestQuery);

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        error: "A verification request for this skill is already pending",
        existingRequestId: existingSnapshot.docs[0].id,
      });
    }

    const requestId = `req-${Date.now()}`;
    const requestRef = doc(db, "skillVerificationRequests", requestId);

    const requestData: SkillVerificationRequest = {
      id: requestId,
      studentId,
      skillId,
      skillName,
      skillLevel,
      score: score || 0,
      proofLinks: proofLinks || [],
      status: "pending",
      requestedAt: serverTimestamp(),
    };

    await setDoc(requestRef, requestData);

    console.log("[Skill Verify] Request sent successfully:", {
      requestId,
      studentId,
      skillId,
    });

    return res.status(200).json({
      success: true,
      message: "Verification request sent successfully",
      requestId,
    });
  } catch (error) {
    console.error("[Skill Verify] Send request error:", error);
    return res
      .status(500)
      .json({ error: "Failed to send verification request" });
  }
}

async function handleListRequests(req: NextApiRequest, res: NextApiResponse) {
  const { studentId, processorId, status: filterStatus } = req.query;

  try {
    let q: any;

    if (processorId) {
      // Get requests for a professor/processor - all pending requests
      q = query(
        collection(db, "skillVerificationRequests"),
        where("status", "==", "pending"),
      );
      const snapshot = await getDocs(q);
      let requests: SkillVerificationRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SkillVerificationRequest;
        // All pending requests go to all professors (can filter in UI if needed)
        // In production, you may want to filter by assigned students/departments
        requests.push({
          ...data,
          id: data.id || docSnap.id, // Ensure ID is set
        });
      });

      // Sort by most recent first
      requests.sort((a, b) => {
        const timeA = a.requestedAt?.toMillis?.() || 0;
        const timeB = b.requestedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      console.log("[Skill Verify] Listed requests for processor:", {
        processorId,
        count: requests.length,
      });

      return res.status(200).json({ requests });
    } else if (studentId) {
      // Get requests for a specific student
      q = query(
        collection(db, "skillVerificationRequests"),
        where("studentId", "==", studentId as string),
      );
      const snapshot = await getDocs(q);
      const requests: SkillVerificationRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SkillVerificationRequest;
        if (!filterStatus || data.status === filterStatus) {
          requests.push({
            ...data,
            id: data.id || docSnap.id, // Ensure ID is set
          });
        }
      });

      requests.sort((a, b) => {
        const timeA = a.requestedAt?.toMillis?.() || 0;
        const timeB = b.requestedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      console.log("[Skill Verify] Listed requests for student:", {
        studentId,
        count: requests.length,
      });

      return res.status(200).json({ requests });
    } else {
      return res
        .status(400)
        .json({ error: "Must provide studentId or processorId" });
    }
  } catch (error) {
    console.error("[Skill Verify] List requests error:", error);
    return res
      .status(500)
      .json({ error: "Failed to list verification requests" });
  }
}

async function handleProcessRequest(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, action, processorId, processorNotes } = req.body;

  if (
    !requestId ||
    !action ||
    !processorId ||
    !["verify", "reject"].includes(action)
  ) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    console.log("[Skill Verify] Processing request:", { requestId, action });

    const requestRef = doc(db, "skillVerificationRequests", requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data() as SkillVerificationRequest;
    const status = action === "verify" ? "verified" : "rejected";

    console.log("[Skill Verify] Request data:", {
      studentId: requestData.studentId,
      skillId: requestData.skillId,
    });

    // Update the verification request
    await updateDoc(requestRef, {
      status,
      processedAt: serverTimestamp(),
      processedBy: processorId,
      processorNotes: processorNotes || "",
    });

    console.log("[Skill Verify] Verification request updated");

    // Update the student's skill verification status
    const studentRef = doc(db, "students", requestData.studentId);
    const studentDoc = await getDoc(studentRef);

    if (studentDoc.exists()) {
      const studentData = studentDoc.data();
      const skills = studentData.skills || [];

      console.log("[Skill Verify] Found student skills:", skills.length);

      const updatedSkills = skills.map((skill: any) => {
        if (skill.id === requestData.skillId) {
          console.log("[Skill Verify] Updating skill:", skill.id);
          return {
            ...skill,
            verificationStatus: status,
            verifiedBy: processorId,
            verifiedAt: serverTimestamp(),
          };
        }
        return skill;
      });

      await updateDoc(studentRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp(),
      });

      console.log("[Skill Verify] Student skills updated");
    } else {
      console.warn(
        "[Skill Verify] Student document not found:",
        requestData.studentId,
      );
    }

    return res.status(200).json({
      success: true,
      message: `Skill ${status} successfully`,
      requestId,
      status,
    });
  } catch (error) {
    console.error("[Skill Verify] Process request error:", error);
    return res
      .status(500)
      .json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process verification request",
      });
  }
}
