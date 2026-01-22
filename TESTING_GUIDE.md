# Degree2Destiny - Testing Guide

## Quick Start

### Build Status
```bash
✅ npm run build - PASSING (0 errors, 0 warnings)
✅ TypeScript - All types valid
✅ Pages - 24/24 compiling successfully
✅ Ready for testing
```

### To Test Locally

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
```

---

## End-to-End Test Flow

### Test 1: Student Registration + Initial Assessment

**Steps:**
1. Open http://localhost:3000
2. Click "Register" (if not logged in)
3. Create new account (email + password)
4. You're automatically redirected to `/student/onboarding`

**Registration Form:**
- Enter Full Name
- Confirm Email
- Enter Phone / WhatsApp
- Enter College
- Enter Interested Role/Skill (e.g., "React Developer")
- Click "Save & Continue"

**Expected Behavior:**
- ✅ Form validates (all fields required)
- ✅ Shows loading/saving indicator
- ✅ Redirects to Initial Assessment page
- ✅ URL: `/student/initial-assessment/[assessmentId]`

### Test 2: Initial Assessment

**Components:**
1. **3 Tabs**: Aptitude, Communication, Logic
2. **Progress Indicators**: Bottom shows progress per section

**Aptitude Section:**
- 3 multiple-choice questions
- Select one answer per question
- Previous/Next buttons navigate
- Click "Submit" when complete

**Communication Section:**
- 2 essay questions
- Must write 50+ characters per question
- Character count displayed
- Real-time validation

**Logic Section:**
- 2 multiple-choice questions
- Similar to Aptitude

**Expected Behavior:**
- ✅ Questions display correctly
- ✅ Answer validation works (shows error if not filled)
- ✅ Previous/Next navigation functional
- ✅ Submit button enabled only when all answered
- ✅ Loading indicator shows during submission

**After Submit:**
- ✅ Success message shows
- ✅ Auto-redirect to dashboard after 2 seconds
- ✅ Scores calculated and saved

### Test 3: Dashboard Auto-Update

**Expected After Assessment:**
- ✅ Dashboard accessible at `/student/dashboard`
- ✅ Scores visible in top section
- ✅ Charts populated:
  - Bar chart: Aptitude / Technical / Communication
  - Radar chart: Overall performance

**Chart Data:**
- Aptitude Score: From initial assessment aptitude section
- Communication Score: From initial assessment communication section
- Technical Score: Shows 0 (needs test completion)
- Overall: Average of above

**Expected Behavior:**
- ✅ Charts render correctly
- ✅ Scores match assessment results
- ✅ Dark mode toggle works

### Test 4: Career-Oriented Tests

**Location:** `/student/assessments` → Career-Oriented Tests section

**Test Cards Display:**
- Software Engineer
- Data Scientist
- Product Manager
- UX Designer
- DevOps Engineer

**Each Card Shows:**
- Test title
- Description
- Duration: 45 minutes
- Number of questions: 8
- "Take Test" button

**Expected Behavior:**
- ✅ Click "Take Test" → Redirects to `/student/tests`
- ✅ Test available in tests list
- ✅ Can start test and answer questions
- ✅ Submit calculates score

### Test 5: Destiny AI Insights

**Location:** `/student/assessments` → Destiny AI Insights section

**Display:**
- Shows top 3 personalized insights
- Each insight has:
  - Title
  - Description
  - Color-coded priority (Green/Yellow/Red)

**Expected Behavior:**
- ✅ Insights generate based on profile
- ✅ Insights update when profile changes
- ✅ Priority colors display correctly

### Test 6: Student Profile Controls

**Location:** `/student/profile`

**StudentStatusPanel Component:**

1. **Status Selector**
   - Options: Ready to Work, Building Skills, Studying, Actively Looking
   - Select and save (shows success message)
   - ✅ Status persists on reload

2. **Visibility Selector**
   - Options: Visible to All, Visible to HR Only, Visible to Professor Only, Hidden
   - Select and save
   - ✅ Setting persists

3. **Account Deletion**
   - Click "Delete Account" button
   - Confirmation dialog appears
   - Type email to confirm
   - Click "Delete" button
   - ✅ Account deleted from Firebase
   - ✅ Logs out user
   - ✅ Redirects to login

### Test 7: Skill Management

**Location:** `/student/skills-manage`

**Available Actions:**
- ✅ Add new skill (button functional)
- ✅ Edit skill (pencil icon works)
- ✅ Request verification (for professor review)
- ✅ Delete skill (trash icon functional)

**Expected Behavior:**
- All CRUD operations work
- Changes persist to Firestore
- Success messages display

### Test 8: Test Taking Flow

**Location:** `/student/tests`

**Expected:**
1. Test card displays with difficulty/duration
2. Click "Start Test" button
3. Redirected to `/student/test/[testId]`
4. Questions display one at a time
5. MCQ options are clickable
6. Can navigate with Previous/Next
7. Submit button at end
8. After submit:
   - ✅ Score calculated
   - ✅ Student profile updated with score
   - ✅ Dashboard charts auto-update
   - ✅ Redirected to results page

### Test 9: Dashboard Score Updates

**Scenario:** Complete a test → Check dashboard

**Expected:**
1. After test submission, student profile updated with scores
2. Navigate to `/student/dashboard`
3. Bar chart updates with new scores
4. Radar chart updates with new values
5. Overall score recalculated

**Data Flow:**
```
Test Submitted
    ↓
testService.submitTestAttempt()
    ↓
updateStudentProfileScoresFromTest() [NEW]
    ↓
Student profile updated in Firestore
    ↓
Dashboard RefreshListener triggers
    ↓
Charts re-render with new data
```

---

## Component Testing

### StudentStatusPanel Component
- **File**: `src/components/StudentStatusPanel.tsx`
- **Tests**:
  - ✅ Status dropdown changes value
  - ✅ Visibility dropdown changes value
  - ✅ Save button shows loading state
  - ✅ Success message appears
  - ✅ Delete account confirmation works
  - ✅ Firestore updates verified

### AIInterview Component
- **File**: `src/components/AIInterview.tsx`
- **Tests**:
  - ✅ Shows in assessments when toggled
  - ✅ Can cancel (back button works)
  - ✅ Integrates with Destiny AI

---

## Button & Navigation Testing

### Student Navigation

| Button | Location | Expected Behavior |
|--------|----------|-------------------|
| Register | Home page | Opens registration flow |
| Save & Continue | Onboarding | Saves profile, creates assessment |
| Submit Assessment | Initial Assessment | Saves scores, redirects to dashboard |
| Take Test | Career Tests | Opens test |
| Request Verification | Skills Manage | Sends to professor |
| Delete Account | Profile | Opens confirmation dialog |
| Edit Skill | Skills Manage | Opens edit modal |
| Take Test | Test cards | Starts test taking |
| Submit Test | Test page | Calculates score, updates profile |

### Admin Navigation

| Role | Dashboard | Tests | Profiles |
|------|-----------|-------|----------|
| Professor | View students | Grade tests | Verify skills |
| Recruiter | Filter by visibility | View results | Match to jobs |

---

## Verification Checklist

### ✅ Build & Deployment
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] All 24 pages compile
- [ ] No warnings in console

### ✅ Registration Flow
- [ ] User can register
- [ ] Initial assessment created automatically
- [ ] Redirect to assessment works
- [ ] Assessment questions display correctly

### ✅ Initial Assessment
- [ ] Aptitude questions show
- [ ] Communication questions show
- [ ] Logic questions show
- [ ] Answer validation works
- [ ] Score calculation correct
- [ ] Feedback generates properly
- [ ] Student profile updated with scores

### ✅ Dashboard
- [ ] Loads correctly
- [ ] Charts display scores from assessment
- [ ] Scores update after test completion
- [ ] Responsive design works
- [ ] Dark mode toggle functional

### ✅ Career Tests
- [ ] Test cards display
- [ ] Can start test
- [ ] Questions display
- [ ] Submit calculates score
- [ ] Profile updates automatically
- [ ] Charts reflect new scores

### ✅ Profile Management
- [ ] Status selector works
- [ ] Visibility selector works
- [ ] Settings persist on reload
- [ ] Account deletion functional
- [ ] Deletion removes from Firebase

### ✅ Skill Management
- [ ] Add skill button works
- [ ] Edit skill button works
- [ ] Delete skill button works
- [ ] Request verification works
- [ ] Changes save to Firestore

### ✅ AI Features
- [ ] Destiny AI insights load
- [ ] Insights display properly
- [ ] AI Interview component shows
- [ ] Interview can be canceled

---

## Performance Benchmarks

### Build
- **Time**: < 2 minutes
- **Pages**: 24/24 ✅
- **Errors**: 0 ✅

### Runtime
- **Dashboard Load**: < 2 seconds
- **Assessment Page Load**: < 1.5 seconds
- **Tests Page Load**: < 1.5 seconds

### Firestore
- **Query Times**: < 500ms typical
- **Write Times**: < 200ms typical

---

## Common Issues & Fixes

### Issue: "Initial assessment not redirecting"
**Fix**: Check Firestore is running and accessible

### Issue: "Scores not updating on dashboard"
**Fix**: 
- Verify `updateStudentProfileScoresFromTest` is called
- Check Firestore permissions allow write to `students/{uid}`
- Check dashboard query loads latest profile

### Issue: "Career test cards not showing"
**Fix**: 
- Verify `careerTests` array populated in state
- Check `getAvailableCareerTests()` returns data
- Verify profile has `preferredRoles` field

### Issue: "Assessment won't submit"
**Fix**:
- Check all answers are filled
- Verify Firestore collection `initialAssessmentResults` exists
- Check network connectivity

---

## Firestore Collections Required

```
- students/{uid}
  - uid, email, fullName, college, etc.
  - aptitudeScore, communicationScore, technicalScore, overallScore
  - initialAssessmentCompleted (boolean)
  
- initialAssessments/{assessmentId}
  - studentId, questions, answers, status
  
- initialAssessmentResults/result_{uid}
  - aptitudeScore, communicationScore, logicalReasoningScore
  - totalScore, feedback
  
- studentTestAttempts/{attemptId}
  - studentId, testId, answers, status
  
- testResults/{resultId}
  - studentId, testId, score, percentage
  
- careerTests/{testId}
  - title, careerRole, questions, duration
```

---

## Success Criteria

Project is ready for production when:

✅ **Build succeeds** - 0 errors, 0 warnings
✅ **Registration flow works** - User → Assessment → Dashboard
✅ **Scores calculate correctly** - Aptitude/Communication/Logic
✅ **Dashboard updates automatically** - Charts reflect scores
✅ **Career tests functional** - Can take tests
✅ **Profile controls work** - Status/visibility/deletion
✅ **All buttons functional** - No broken links
✅ **Firestore integration** - Data persists correctly
✅ **Dark mode works** - Theme toggle functional
✅ **Responsive design** - Works on mobile/tablet/desktop

---

## Deployment Checklist

Before production deployment:

- [ ] Test all flows end-to-end
- [ ] Verify Firebase config is correct
- [ ] Check Gemini API key is valid
- [ ] Test with sample user account
- [ ] Verify Firestore rules allow operations
- [ ] Check error handling works
- [ ] Test on mobile devices
- [ ] Verify dark mode displays correctly
- [ ] Check loading states show properly
- [ ] Test authentication flows

Once verified:

```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
# Or manually deploy using:
# next export && deploy ./out
```

---

## Support

For issues, check:
1. Browser console for errors
2. Firebase console for data
3. Network tab for failed requests
4. Firestore security rules
5. API key configuration

**Status**: ✅ **Ready for Testing**
