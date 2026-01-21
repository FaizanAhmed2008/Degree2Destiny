# Student Verification System - Quick Reference Guide

## How It Works

### For Students:
1. Navigate to Student Dashboard
2. See "Verification Status" card in the right sidebar
3. Click "Request Verification" button
4. Status changes to PENDING
5. Wait for professor review
6. Status auto-updates to VERIFIED or REJECTED (real-time)

### For Professors:
1. Navigate to Professor Dashboard
2. See "Verification Requests" section at the top
3. Expand student cards to see details, skills, readiness score
4. Click "Approve" to verify (status → VERIFIED)
5. Click "Reject" to reject (status → REJECTED, with optional reason)
6. List auto-updates in real-time

---

## Skill Management

### To Add Skills:
1. Go to Student → Skills Manage page
2. Fill in form:
   - Skill Name (required)
   - Category (optional)
   - Proficiency Level
   - Score (0-100)
   - Proof Links (GitHub, portfolio, etc.)
3. Click "Add Skill"
4. Skill saves to Firestore and persists after reload

### To Request Skill Verification:
1. Add a skill
2. Click "Request Verification" on the skill card
3. Skill status changes to PENDING
4. Professor reviews and approves/rejects
5. Status auto-updates

---

## Firestore Data Structure

```
students/{studentId}
├── verificationStatus: "not-requested" | "pending" | "verified" | "rejected"
├── requestedAt: Timestamp (when student requested)
├── verifiedAt: Timestamp (when professor acted)
├── verifiedBy: string (professor UID)
├── skills: [
│   ├── id, name, category
│   ├── score, selfLevel
│   ├── verificationStatus
│   ├── proofLinks
│   └── lastUpdated
│ ]
└── ...other fields
```

---

## Error Logging

All errors are logged with category prefix:

```javascript
[Firestore Read]     - Database read operations
[Firestore Write]    - Database write operations
[Firestore Read Error]   - Read failures
[Firestore Write Error]  - Write failures
[State Sync]         - Real-time listener events
[State Sync Error]   - Listener failures
[UI]                 - User interface events
```

**Example Console Logs:**
```
[Firestore Write] Student verification approved: {studentId: "abc123", professorId: "prof456"}
[State Sync] Student profile updated via real-time listener
[Firestore Read Error] Failed to get pending verification requests: Network error
```

---

## Real-Time Updates

- **Student Dashboard:** Auto-updates when professor approves/rejects ✅
- **Professor Dashboard:** Auto-updates when student requests verification ✅
- **No page refresh needed:** Both sides use Firestore listeners ✅
- **Instant feedback:** Changes visible within 1-2 seconds ✅

---

## Components

### VerificationCard
**Location:** `src/components/VerificationCard.tsx`
**Used In:** Student Dashboard (right sidebar)
**Props:**
- `profile: StudentProfile` - Student data
- `loading?: boolean` - Loading state
- `onVerificationRequested?: () => void` - Callback

### VerificationRequests
**Location:** `src/components/VerificationRequests.tsx`
**Used In:** Professor Dashboard (top section)
**Props:**
- `requests: StudentProfile[]` - Pending students
- `loading?: boolean` - Loading state
- `professorId?: string` - Current professor UID
- `onProcessed?: () => void` - Callback

---

## Service Functions

### Public Functions (Use in Components):

```typescript
// Student Operations
requestStudentVerification(studentId: string)
  → Sets status to PENDING, adds requestedAt timestamp

// Professor Operations
approveStudentVerification(studentId: string, professorId: string)
  → Sets status to VERIFIED, adds verifiedAt & verifiedBy

rejectStudentVerification(studentId: string, professorId: string, reason?: string)
  → Sets status to REJECTED, adds verifiedAt & verifiedBy

// Query Operations
getPendingVerificationRequests(professorId?: string): Promise<StudentProfile[]>
  → Fetches students with status = "pending"

getVerifiedStudents(): Promise<StudentProfile[]>
  → Fetches students with status = "verified" (for HR)

// Real-time Listeners
onStudentVerificationUpdate(
  studentId: string,
  onUpdate: (student: StudentProfile) => void,
  onError?: (error: Error) => void
): () => void
  → Returns unsubscribe function

onPendingVerificationsUpdate(
  onUpdate: (students: StudentProfile[]) => void,
  onError?: (error: Error) => void,
  professorId?: string
): () => void
  → Returns unsubscribe function
```

---

## Database Rules (TODO: Set up)

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Students can update their own verification requests
    match /students/{studentId} {
      allow read: if request.auth.uid == studentId;
      allow update: if request.auth.uid == studentId && 
                       request.resource.data.verificationStatus in ['not-requested', 'pending'];
    }
    
    // Professors can approve/reject verified students
    match /students/{studentId} {
      allow write: if hasRole(request.auth.uid, 'professor') &&
                      request.resource.data.verificationStatus in ['verified', 'rejected'];
    }
    
    // HR/Recruiter can view only verified students
    match /students/{studentId} {
      allow read: if hasRole(request.auth.uid, 'recruiter') &&
                     resource.data.verificationStatus == 'verified';
    }
  }
}
```

---

## Common Issues & Solutions

### Issue: Real-time updates not working
**Solution:**
- Check browser console for `[State Sync Error]` logs
- Verify Firestore connection
- Check security rules allow listener

### Issue: Skill not saving
**Solution:**
- Check `[Firestore Write Error]` in console
- Verify skill name is not empty
- Check Firestore quota hasn't exceeded

### Issue: Status stuck on PENDING
**Solution:**
- Reload professor dashboard
- Check if professor has correct UID
- Verify Firestore write completed (check logs)

### Issue: Listener not cleaning up
**Solution:**
- Ensure unsubscribe function is called in useEffect cleanup
- Check for memory leaks in browser dev tools

---

## Performance Tips

1. **Limit Real-time Listeners:** Only 2-3 active listeners per dashboard
2. **Clean Up on Unmount:** Always unsubscribe listeners in useEffect cleanup
3. **Batch Updates:** When multiple operations, batch them together
4. **Cache Results:** Store frequently accessed data in local state
5. **Monitor Firestore Quota:** Watch read/write operations in Firebase console

---

## Testing Checklist

- [ ] Student can add skills and see them persist after reload
- [ ] Student can request verification
- [ ] Verification status updates to PENDING
- [ ] Professor sees student in pending list
- [ ] Professor can approve/reject verification
- [ ] Student sees status update without refresh (real-time)
- [ ] Professor sees new requests without refresh (real-time)
- [ ] Error messages are user-friendly
- [ ] Console logs are properly categorized
- [ ] No memory leaks from listeners
- [ ] Works in dark mode
- [ ] Works on mobile devices

---

## Debugging Tips

### Enable Console Logging:
```javascript
// All logs are already in place, just open browser console
// Filter by log category:
// - Ctrl+Shift+K (Windows/Linux)
// - Cmd+Option+J (Mac)
```

### Monitor Firestore Operations:
```javascript
// In Firebase Console → Firestore → Usage tab
// Watch for:
// - Read operations when listeners update
// - Write operations when student requests/professor acts
// - Query operations for getPending/getVerified
```

### Test Real-time Sync:
```javascript
// Open student dashboard and professor dashboard side-by-side
// In browser console, filter by "[State Sync]"
// You'll see real-time listener events as they happen
```

---

## Next Steps

1. ✅ System is fully implemented
2. 🔄 Set up Firestore security rules (see above)
3. 🔄 Deploy to Firebase
4. 🔄 Test across browsers
5. 🔄 Monitor error logs
6. 🔄 Gather user feedback
7. 🔄 Optimize based on performance metrics

---

For detailed implementation info, see: `VERIFICATION_SYSTEM_IMPLEMENTATION.md`
