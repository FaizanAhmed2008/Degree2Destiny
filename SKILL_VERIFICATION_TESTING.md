# Skill Verification System - Testing Guide

## Quick Start

The dev server is running at `http://localhost:3000`

### Test Accounts to Use

**Student Account**:

- Email: `student@example.com`
- Role: Student
- Purpose: Create skills and send verification requests

**Professor Account**:

- Email: `professor@example.com`
- Role: Professor
- Purpose: Verify/reject student skills

**Recruiter Account**:

- Email: `recruiter@example.com`
- Role: Recruiter
- Purpose: View verified students

---

## Test Scenario 1: Complete Verification Flow

### Step 1: Student Creates a Skill

1. Login as **student@example.com**
2. Navigate to `/student/skills-manage`
3. Fill in skill details:
   - Skill Name: "JavaScript"
   - Category: "Programming"
   - Level: "Intermediate"
   - Score: 75/100
   - Proof Links: "https://github.com/user/project"
4. Click "Add Skill"
5. ✅ Expected: Skill appears in list with status "⏳ Pending"

### Step 2: Student Sends Verification Request

1. In the skills list, find the "JavaScript" skill
2. Click "Request Verify" button
3. ✅ Expected:
   - Alert: "Verification request sent to professors!"
   - Skill status remains "⏳ Pending"
   - Button disappears (already requested)

### Step 3: Check Duplicate Prevention

1. Try clicking "Request Verify" again (if button still visible)
2. ✅ Expected:
   - Alert: "A verification request for this skill is already pending"
   - No duplicate request created

### Step 4: Professor Receives Request (Real-Time)

1. In a new tab/browser window, login as **professor@example.com**
2. Navigate to `/professor/dashboard`
3. Look for "Pending Skill Verification Requests" section
4. ✅ Expected:
   - Request appears without needing to refresh
   - Shows:
     - Skill name: "JavaScript"
     - Student ID: (student's uid)
     - Skill level: "Intermediate"
     - Score: "75/100"
     - Proof links visible and clickable
     - [Verify] and [Reject] buttons

### Step 5: Professor Approves Skill

1. In professor dashboard, click [Verify] button
2. ✅ Expected:
   - Button shows "Processing..."
   - Alert: "Skill verified successfully!"
   - Request disappears from list automatically
   - No page refresh needed

### Step 6: Verify Student Sees Updated Status

1. Switch back to student tab/window
2. Navigate to `/student/skills-manage` or refresh page
3. ✅ Expected:
   - Skill now shows "✓ Verified" status
   - Green checkmark icon appears
   - "Request Verify" button gone
   - Skill points counted toward job readiness

---

## Test Scenario 2: Professor Rejects Skill

### Step 1: Student Requests Verification for Another Skill

1. Login as student
2. Add another skill: "Python"
3. Click "Request Verify"
4. ✅ Expected: Request sent

### Step 2: Professor Rejects Request

1. Login as professor
2. Find "Python" request in dashboard
3. Click [Reject] button
4. ✅ Expected:
   - Alert: "Skill rejected successfully!"
   - Request removed from list
   - Student sees "✗ Rejected" status

### Step 3: Student Can Request Again After Rejection

1. As student, check skill status: "✗ Rejected"
2. Click "Request Verify" button (should now be available)
3. ✅ Expected:
   - New verification request sent
   - Alert: "Verification request sent to professors!"

---

## Test Scenario 3: Real-Time Updates

### Test Requirement

- Open professor dashboard in one window
- Have student send multiple requests in another window
- Verify requests appear in real-time

### Steps

1. Open two browser windows
   - Window A: Professor dashboard logged in
   - Window B: Student skills management logged in
2. In Window B, add 3 skills and request verification for each
3. Watch Window A for each request to appear in real-time
4. ✅ Expected: Each request appears automatically without refresh

### Test Real-Time Approval

1. In Window A, approve each request
2. In Window B, verify skill status updates automatically
3. ✅ Expected: Status changes to "✓ Verified" in real-time

---

## Test Scenario 4: Error Handling

### Test 4.1: Missing Required Fields

1. Try to add skill without name
2. ✅ Expected: Alert "Please enter a skill name"

### Test 4.2: Duplicate Prevention

1. Request verification for same skill twice
2. ✅ Expected: Error "A verification request for this skill is already pending"

### Test 4.3: Student Not Found

1. Manually send API request with invalid studentId
2. ✅ Expected: Graceful error handling in professor dashboard

### Test 4.4: Request Not Found

1. Manually try to process non-existent requestId
2. ✅ Expected: Alert "Failed to verify skill"

---

## Test Scenario 5: Database Consistency

### Test Database State

After completing the flow, check Firebase:

```
/students/{studentId}
  └─ skills: [
       {
         id: "skill-xxx"
         name: "JavaScript"
         verificationStatus: "verified"
         verifiedBy: "{professorId}"
         verifiedAt: {Timestamp}
         ...
       }
     ]

/skillVerificationRequests/{requestId}
  └─ status: "verified"
  └─ processedBy: "{professorId}"
  └─ processedAt: {Timestamp}
  └─ processorNotes: ""
```

### Verification Points

✅ Skill has correct verificationStatus
✅ Skill has verifiedBy (professor ID)
✅ Skill has verifiedAt (server timestamp)
✅ Request has status updated to "verified"
✅ Request has processedBy (professor ID)
✅ Request has processedAt (server timestamp)

---

## Test Scenario 6: Recruiter Cannot Verify

### Steps

1. Login as recruiter
2. Navigate to recruiter dashboard
3. ✅ Expected: No verification buttons visible
4. Try to manually call API
5. ✅ Expected: Request succeeds (API doesn't check recruiter role yet - future enhancement)

---

## Test Scenario 7: Edge Cases

### Test 7.1: Skill without Proof Links

1. Add skill without proof links
2. Request verification
3. In professor dashboard, check if request displays correctly
4. ✅ Expected: Request shows without errors, no proof links section

### Test 7.2: Very Long Skill Name

1. Add skill with 100-character name
2. Request verification
3. ✅ Expected: Name displays properly (truncated in UI if needed)

### Test 7.3: Multiple Skills from One Student

1. Student adds 5 different skills
2. Request verification for 3 of them
3. Check professor dashboard
4. ✅ Expected: All 3 requests appear for same student

### Test 7.4: Skills with Same Name, Different Category

1. Add skill "Communication" in category "Hard Skills"
2. Add skill "Communication" in category "Soft Skills"
3. Request verification for both
4. ✅ Expected: Both requests appear as separate items

---

## Test Scenario 8: UI/UX Features

### Test Loading States

1. Start verification request
2. Watch button change to "Sending..."
3. ✅ Expected: Button disabled during request

### Test Status Indicators

- ✅ Green checkmark for verified
- ⏳ Spinning icon for pending
- ✗ Red X for rejected
- ⏳ Hovering shows tooltip

### Test Sorting

1. Request verification for 3 skills with 1-second delays
2. Check professor dashboard
3. ✅ Expected: Most recent request appears first

### Test Empty States

1. Login as professor with no pending requests
2. ✅ Expected: "Pending Skill Verification Requests" section doesn't appear or shows empty state

---

## Test Scenario 9: API Endpoints

### Test GET /api/skills/verify-request?action=list&processorId={id}

```bash
curl "http://localhost:3000/api/skills/verify-request?action=list&processorId=prof123"
```

✅ Expected:

- Returns array of pending requests
- Each has: id, studentId, skillId, skillName, skillLevel, score, proofLinks, status, requestedAt

### Test POST /api/skills/verify-request?action=send

```bash
curl -X POST "http://localhost:3000/api/skills/verify-request?action=send" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "skillId": "skill456",
    "skillName": "React",
    "skillLevel": "intermediate",
    "score": 80,
    "proofLinks": ["https://github.com/user/project"]
  }'
```

✅ Expected:

- Returns: { success: true, requestId: "req-xxx" }

### Test POST /api/skills/verify-request?action=process

```bash
curl -X POST "http://localhost:3000/api/skills/verify-request?action=process" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req-123",
    "action": "verify",
    "processorId": "prof123",
    "processorNotes": "Great job!"
  }'
```

✅ Expected:

- Returns: { success: true, message: "Skill verified successfully", status: "verified" }

---

## Browser Console Testing

### Check for Errors

Open DevTools Console (F12) and look for:

- ❌ Any red error messages
- ⚠️ Warning about async operations
- ✅ Console logs like "[Firestore Read]", "[State Sync]" confirm flow

### Logs to Expect (during verification flow)

```
[Firestore Write] Sending skill verification request
[Firestore Write] Verification request sent successfully
[Firestore Read] Profile reloaded after verification request
[State Sync] Skill verification requests updated
[Skill Verify] Processing request
[Skill Verify] Student skills updated
```

---

## Performance Testing

### Test Real-Time Performance

1. Open Network tab in DevTools
2. Perform verification
3. Look for:
   - ✅ API response < 500ms
   - ✅ Real-time update < 1 second
   - ✅ No duplicate requests

### Test Database Query Performance

1. In Firebase Console, check:
   - Query for pending requests should use index
   - No full collection scans

---

## Final Checklist

- [ ] Student can add skills
- [ ] Student can request verification
- [ ] Duplicate requests prevented
- [ ] Professor dashboard shows requests in real-time
- [ ] Professor can approve skills
- [ ] Requests disappear after approval
- [ ] Student sees verified status instantly
- [ ] Rejected requests reappear in UI
- [ ] Multiple approvals work correctly
- [ ] All timestamps are server-synchronized
- [ ] Error messages clear and helpful
- [ ] No console errors in browser
- [ ] Database shows correct state
- [ ] Recruiter cannot see verification buttons
- [ ] API endpoints work correctly

---

## Debugging Tips

### If requests don't appear in professor dashboard:

1. Check browser console for errors
2. Verify Firebase connection working
3. Check student profile has skills array
4. Verify skill has correct verificationStatus

### If approval doesn't work:

1. Check professor is logged in
2. Verify requestId is correct
3. Check Firebase has write permissions
4. Look for errors in API response

### If real-time updates don't work:

1. Check if real-time listener is registered
2. Verify Firebase rules allow read access
3. Look for connection errors in console
4. Try refreshing page to see if changes persisted

### Common Issues & Fixes:

| Issue                        | Solution                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| "Request not found" error    | Verify requestId exists in skillVerificationRequests collection |
| Duplicate requests appearing | Clear browser cache, check for multiple listeners               |
| Timestamps wrong             | Verify Firebase serverTimestamp() being used                    |
| Real-time not updating       | Check Firestore security rules allow read access                |
| Student sees outdated status | Clear browser cache, do hard refresh (Ctrl+Shift+R)             |
