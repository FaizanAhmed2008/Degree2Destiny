// Student Mandatory Registration (Step 0)
//
// This page is the REQUIRED first step for every Student.
// It stores mandatory student details in Firestore under `students/{studentId}`.
//
// Firestore schema (students/{studentId})
// - uid: string
// - email: string
// - fullName: string
// - phoneWhatsApp: string
// - college: string
// - interestedRoleSkill: string
// - registrationCompleted: boolean
// - onboardingCompleted: boolean            (kept for existing dashboard gating)
// - verificationStatus: 'pending' | 'verified' | 'rejected' | 'under-review'
// - updatedAt / createdAt: server timestamps (handled in studentService)
//
// Notes:
// - `displayName` is derived from `fullName` to keep existing UI compatible.
// - Student-level `verificationStatus` is used later to gate HR visibility.

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentProfile,
  saveStudentProfile,
} from "../../services/studentService";
import { createInitialAssessment } from "../../services/initialAssessmentService";
import { StudentProfile } from "../../types";
import { db } from "../../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

type RegistrationFormState = {
  fullName: string;
  email: string;
  phoneWhatsApp: string;
  college: string;
  interestedRoleSkill: string;
  selectedJobRole: string; // MANDATORY: job role dropdown
};

// Supported job roles for role-based question filtering
const JOB_ROLES = [
  "Data Analyst",
  "Cyber Security Engineer",
  "Full Stack Developer",
];

const StudentOnboarding = () => {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<RegistrationFormState>({
    fullName: "",
    email: "",
    phoneWhatsApp: "",
    college: "",
    interestedRoleSkill: "",
    selectedJobRole: "", // Mandatory job role selection
  });

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const profile = await getStudentProfile(currentUser.uid);
        if (profile) {
          setForm({
            fullName: profile.fullName || profile.displayName || "",
            email: profile.email || currentUser.email || "",
            phoneWhatsApp: profile.phoneWhatsApp || "",
            college: profile.college || "",
            interestedRoleSkill: profile.interestedRoleSkill || "",
            selectedJobRole: profile.preferredRoles?.[0] || "", // Load from preferredRoles
          });
        } else {
          setForm((prev) => ({
            ...prev,
            email: currentUser.email || "",
          }));
        }
      } catch (e) {
        console.error("Error loading student registration:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const validationError = useMemo(() => {
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phoneWhatsApp = form.phoneWhatsApp.trim();
    const college = form.college.trim();
    const interestedRoleSkill = form.interestedRoleSkill.trim();
    const selectedJobRole = form.selectedJobRole.trim();

    if (!fullName) return "Full Name is required.";
    if (!email) return "Email is required.";
    if (!phoneWhatsApp) return "Phone / WhatsApp is required.";
    if (!college) return "College is required.";
    if (!interestedRoleSkill) return "Interested Role / Skill is required.";
    if (!selectedJobRole) return "Job Role selection is required."; // MANDATORY job role
    return null;
  }, [form]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<StudentProfile> = {
        uid: currentUser.uid,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phoneWhatsApp: form.phoneWhatsApp.trim(),
        college: form.college.trim(),
        interestedRoleSkill: form.interestedRoleSkill.trim(), // Mandatory job role - now stored as preferredRoles
        preferredRoles: [form.selectedJobRole.trim()], // Backward-compatible:
        displayName: form.fullName.trim(),
        // Mandatory gating:
        registrationCompleted: true,
        onboardingCompleted: true,
        // Default student verification gate for HR:
        verificationStatus: "pending",
      };

      await saveStudentProfile(payload);

      // Keep AuthContext/user menus consistent.
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: payload.displayName,
      });

      // Create initial assessment and redirect to it
      const assessmentId = await createInitialAssessment(currentUser.uid);
      router.push(`/student/initial-assessment/${assessmentId}`);
    } catch (e) {
      console.error("Error saving student registration:", e);
      setError("Failed to save registration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Student Registration (Mandatory)
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Please complete this to access your dashboard and tests.
            </p>

            {error && (
              <div className="mt-6 p-3 text-sm rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-400 dark:border-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-5">
              <Field
                label="Full Name"
                required
                value={form.fullName}
                onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
                placeholder="Your full name"
              />
              <Field
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                placeholder="you@email.com"
              />
              <Field
                label="Phone / WhatsApp"
                required
                type="tel"
                value={form.phoneWhatsApp}
                onChange={(v) => setForm((p) => ({ ...p, phoneWhatsApp: v }))}
                placeholder="+91..."
              />
              <Field
                label="College"
                required
                value={form.college}
                onChange={(v) => setForm((p) => ({ ...p, college: v }))}
                placeholder="Your college name"
              />
              <FieldSelect
                label="Job Role"
                required
                value={form.selectedJobRole}
                onChange={(v) => setForm((p) => ({ ...p, selectedJobRole: v }))}
                options={JOB_ROLES}
                placeholder="Select your target job role"
              />
              <Field
                label="Interested Role / Skill"
                required
                value={form.interestedRoleSkill}
                onChange={(v) =>
                  setForm((p) => ({ ...p, interestedRoleSkill: v }))
                }
                placeholder="e.g., Frontend Developer / React"
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>

            {!!validationError && !error && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                All fields are required to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, required, value, onChange, placeholder, type = "text" }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        placeholder={placeholder}
      />
    </div>
  );
};

const FieldSelect: React.FC<{
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}> = ({ label, required, value, onChange, options, placeholder }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-600"
      >
        <option value="">{placeholder || "Select an option"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StudentOnboarding;
