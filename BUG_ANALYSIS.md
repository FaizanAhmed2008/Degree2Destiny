# Assessment Platform - Bug Analysis & Fixes

## Executive Summary

The assessment platform has **7 critical architectural bugs** preventing proper test functionality:

1. **Job role selection missing** - Registration doesn't collect mandatory role
2. **State management race conditions** - React renders before data loads
3. **Button logic failures** - Navigation depends on unmemoized function references
4. **Role-based filtering broken** - No mechanism to filter questions by role
5. **Answer persistence issues** - Answers reset on page refresh
6. **Mandatory section enforcement missing** - Students can skip sections
7. **Question sequence not enforced** - Wrong order: technical → aptitude → communication

---

## Bug Details & Root Causes

### BUG #1: Job Role Selection Missing from Registration

**Location**: `src/pages/student/onboarding.tsx`
**Severity**: CRITICAL
**Impact**: Students can't indicate role; role-based questions can't filter correctly

**Current Code**:

- Registration form collects: fullName, email, phoneWhatsApp, college, interestedRoleSkill
- `interestedRoleSkill` is a free-text field (not structured)
- No connection to `preferredRoles` array in StudentProfile

**Problem**:

- Role must be selected from dropdown, not text input
- Tests need role to filter role-specific questions
- Database stores `preferredRoles: string[]` but registration never sets it

**Evidence**:

```typescript
// In onboarding.tsx:
const [form, setForm] = useState({
  interestedRoleSkill: '', // ❌ Free text, not structured
});

// In StudentProfile type:
preferredRoles: string[];  // ✅ Array, expects dropdown selection
```

**Fix Priority**: Must fix FIRST (blocks everything else)

---

### BUG #2: React State & Router Race Condition

**Location**: `src/pages/student/test/[testId].tsx` (line 30-56)
**Severity**: CRITICAL
**Impact**: Questions don't render, buttons don't work, errors appear randomly

**Current Code**:

```typescript
useEffect(() => {
  const loadTest = async () => {
    if (!testId || !currentUser) return;
    const loadedTest = await getTestById(testId);
    setTest(loadedTest);
    // ... more async calls
  };
  if (testId && currentUser) {
    loadTest(); // Called but testId comes from router.query
  }
}, [testId, currentUser]);
```

**Problem**:

- Router is not ready yet when component mounts
- `router.query` is empty on first render
- Component renders BEFORE data loads (infinite loading state)
- State updates happen after unmount

**Root Cause**:

```typescript
// BROKEN: testId is undefined on first render
const { testId } = router.query; // ❌ undefined initially
const [test, setTest] = useState(null); // null, renders nothing
// useEffect runs, but testId is falsy, so exits early
// Router doesn't update testId in dependency array
```

**Fix Priority**: Critical (affects all test pages)

---

### BUG #3: Button Logic Failures

**Location**: `src/pages/student/initial-assessment/[assessmentId].tsx` (line 240-260)
**Severity**: HIGH
**Impact**: Next button doesn't work, Previous button stuck, Submit fails

**Current Code**:

```typescript
<button
  onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
  disabled={!isAnswered}
  className="..."
>
  Next →
</button>
```

**Problems**:

1. **Stale closure**: `isAnswered` is computed OUTSIDE the callback but depends on state
2. **No feedback**: Button disables but user doesn't know why
3. **No validation**: Can submit incomplete answers
4. **State updates batch incorrectly**: Next button doesn't wait for answer to save

**Example**:

```typescript
// User clicks option
handleAptitudeSelect(0); // Sets state
// Button remains disabled because isAnswered computed from OLD state
```

---

### BUG #4: Role-Based Question Filtering Broken

**Location**: All test services
**Severity**: CRITICAL
**Impact**: Technical questions not filtered by role, students see wrong questions

**Current Code**:

- `initialAssessmentService.ts` has hardcoded questions (same for all roles)
- `testService.ts` doesn't check role when filtering
- No API endpoint for role-based questions

**Problem**:

```typescript
// Questions are STATIC, not dynamic
export const INITIAL_ASSESSMENT_QUESTIONS = {
  aptitude: [...],        // Same for all roles
  communication: [...],   // Same for all roles
  logicalReasoning: [...]  // Same for all roles
  // ❌ Missing: technical questions by role
};
```

**Missing Implementation**:

- No role-based question selection logic
- No check for `profile.preferredRoles` before showing technical section
- No backend filtering for Data Analyst vs Security vs Full Stack questions

---

### BUG #5: Answer Persistence - State Resets on Refresh

**Location**: `src/pages/student/test/[testId].tsx` (line 25-29)
**Severity**: HIGH
**Impact**: Clicking refresh loses all answers, must restart test

**Current Code**:

```typescript
const [attempt, setAttempt] = useState<StudentTestAttempt | null>(null);
```

**Problem**:

1. Attempt data only stored in local state
2. React Query caching not implemented
3. No session recovery mechanism
4. Firebase saves answer but component doesn't reload it

**Root Cause**:

```typescript
// After saveAnswer() succeeds in Firebase,
// component doesn't re-fetch from database on page refresh
// New page load creates NEW attempt, loses old answers
```

---

### BUG #6: Mandatory Section Enforcement Missing

**Location**: `src/pages/student/initial-assessment/[assessmentId].tsx` (line 156-170)
**Severity**: MEDIUM
**Impact**: Students can skip entire sections, submit incomplete assessments

**Current Code**:

```typescript
{['aptitude', 'communication', 'logic'].map((tab) => (
  <button onClick={() => {
    setCurrentTab(tab);
    setCurrentQuestionIdx(0);  // ❌ No validation
  }}>
    {tab}
  </button>
))}
```

**Problem**:

- Clicking tab switch doesn't verify all questions in current tab are answered
- User can go Aptitude → Logic without finishing Communication
- Submit button doesn't validate all sections complete

---

### BUG #7: Question Sequence Not Enforced

**Current Requirement**: Aptitude → Technical → Communication
**Current Implementation**: Tabs allow any order
**Impact**: Wrong assessment flow

**Missing Logic**:

```typescript
// Should prevent clicking next section until current complete:
if (currentTab === "aptitude" && !allAptitudeAnswered) {
  canClickTechnical = false; // ❌ Not implemented
}
```

---

## Fix Strategy

### Phase 1: Foundation (Job Role & State Management)

1. Add job role dropdown to registration
2. Fix router.query loading with proper guards
3. Implement session recovery

### Phase 2: Logic & Validation

4. Fix button logic with proper dependencies
5. Implement role-based question filtering
6. Add mandatory section enforcement

### Phase 3: Data Integrity

7. Add answer auto-save with feedback
8. Implement proper sequence enforcement
9. Add page refresh recovery

---

## Database Schema Requirements

```firestore
students/{studentId}
├── preferredRoles: ['Data Analyst']  // REQUIRED: from dropdown
├── careerInterests: []
├── jobType: []

testAttempts/{attemptId}
├── studentId: string
├── role: string  // MUST CAPTURE ROLE
├── answers: []
├── submittedAt: timestamp

tests/{testId}
├── type: 'TECHNICAL' | 'APTITUDE' | 'COMMUNICATION'
├── applicableRoles: ['Data Analyst', 'Full Stack Developer'] // Optional for role filtering
└── questions: []
```

---

## Testing Checklist

- [ ] Register with job role dropdown
- [ ] Role saves to profile
- [ ] Test loads without infinite spinner
- [ ] Next button works after selecting answer
- [ ] Previous button navigates correctly
- [ ] Page refresh maintains answers
- [ ] Submit button validates all sections
- [ ] Role-specific technical questions appear
- [ ] Aptitude section before technical section
- [ ] Communication section last
- [ ] Submit success redirects to results
- [ ] Results show correct scoring by role
