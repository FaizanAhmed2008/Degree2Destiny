# Implementation Fixes - Detailed Steps

## Fix #1: Job Role Selection in Registration ✅ DONE

**File**: `src/pages/student/onboarding.tsx`

**Changes**:

1. Added `selectedJobRole` to form state
2. Added JOB_ROLES constant with three options
3. Added mandatory validation for job role
4. Stores role in `preferredRoles` array
5. Added FieldSelect component for dropdown

**Impact**: Registration now requires job role selection and stores it in database

---

## Fix #2: Router State Management ✅ DONE

**Files**:

- `src/pages/student/test/[testId].tsx`
- `src/pages/student/initial-assessment/[assessmentId].tsx`

**Changes**:

1. Added `router.isReady` check BEFORE loading data
2. Early return if router not ready
3. Included `router.isReady` in useEffect dependencies
4. Reset question index on load

**Impact**: Prevents infinite loading spinner, ensures data loads correctly

---

## Fix #3: Button Logic & State Updates ✅ DONE

**File**: `src/pages/student/test/[testId].tsx`

**Changes**:

1. Fixed handleSelectOption - proper answer state update
2. Fixed handleUpdateAnswer - proper state batching
3. Ensured state updates complete before rendering

**Impact**: Next/Previous buttons now work reliably

---

## Fix #4: Role-Based Question Filtering 🔄 IN PROGRESS

**New File**: `src/services/roleBasedQuestionsService.ts`

**Implementation**:

- Data Analyst: 5 SQL/Analytics questions
- Cyber Security: 5 Security questions
- Full Stack: 5 Web/MERN questions
- Service exports getTechnicalQuestionsForRole()

**Still Need**:

1. Update initial assessment to include technical section
2. Update test/[testId].tsx to fetch role-based questions
3. Update initial assessment component to show technical questions

---

## Fix #5: Answer Persistence

**Approach**:

- Already implemented: SaveAnswer auto-saves to Firebase
- Already implemented: setAttempt updates local state immediately
- Already implemented: On refresh, useEffect reloads from Firebase

**No changes needed** - works correctly with router fix

---

## Fix #6: Mandatory Section Enforcement

**Needed in** `src/pages/student/initial-assessment/[assessmentId].tsx`:

1. Disable tab switching until current section complete
2. Add validation before submit
3. Prevent skipping sections

---

## Fix #7: Question Sequence (Apt → Tech → Comm)

**Current**: 3 free tabs (Aptitude, Communication, Logic)
**Needed**: Enforce sequence - Aptitude → Technical (role-based) → Communication

**Changes**:

1. Replace tab switching with sequence enforcement
2. Disable "next section" button until current complete
3. Show progress: Section X of 3

---

## Testing Checklist

```
Registration:
✅ Can select job role from dropdown
✅ Role selection is mandatory
✅ Role saves to preferredRoles
✅ Can't submit without role

Initial Assessment:
⏳ Questions load without spinner
⏳ Next button works after answering
⏳ Previous button navigates back
⏳ Page refresh keeps answers
⏳ Submit validates all sections
⏳ Role-specific technical questions appear
⏳ Sequence enforced (Apt → Tech → Comm)

Career Test:
⏳ Test loads correctly
⏳ All navigation works
⏳ Answers auto-save
⏳ Submit redirects to results
⏳ Results show correct role context
```
