# Verification System - API & Usage Examples

## Import Statements

```typescript
// In any component:
import { 
  requestStudentVerification,
  approveStudentVerification,
  rejectStudentVerification,
  getPendingVerificationRequests,
  getVerifiedStudents,
  onStudentVerificationUpdate,
  onPendingVerificationsUpdate 
} from '../services/studentService';

import VerificationCard from '../components/VerificationCard';
import VerificationRequests from '../components/VerificationRequests';
```

---

## Component Usage Examples

### 1. Using VerificationCard in Student Dashboard

```typescript
import VerificationCard from '../../components/VerificationCard';
import { StudentProfile } from '../../types';

export const StudentDashboard = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  return (
    <div className="right-sidebar">
      <VerificationCard 
        profile={profile}
        loading={loading}
        onVerificationRequested={() => {
          console.log('Verification requested');
          // Optionally refresh or reload profile
        }}
      />
    </div>
  );
};
```

### 2. Using VerificationRequests in Professor Dashboard

```typescript
import VerificationRequests from '../../components/VerificationRequests';
import { StudentProfile } from '../../types';

export const ProfessorDashboard = () => {
  const { currentUser } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState<StudentProfile[]>([]);

  return (
    <div className="professor-dashboard">
      <VerificationRequests 
        requests={verificationRequests}
        loading={loading}
        professorId={currentUser?.uid}
        onProcessed={() => {
          console.log('Request processed');
          // Optionally refresh list
        }}
      />
    </div>
  );
};
```

---

## Service Function Usage Examples

### Student: Request Verification

```typescript
import { requestStudentVerification } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const StudentVerificationFlow = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRequestVerification = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Request verification
      await requestStudentVerification(currentUser.uid);
      
      console.log('[Firestore Write] Verification request submitted');
      alert('Verification request sent to professors!');
      
      // Optionally refresh profile
      const profile = await getStudentProfile(currentUser.uid);
      setProfile(profile);
      
    } catch (error: any) {
      console.error('[Firestore Write Error]', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRequestVerification}
      disabled={loading}
    >
      {loading ? 'Requesting...' : 'Request Verification'}
    </button>
  );
};
```

### Professor: Approve Verification

```typescript
import { approveStudentVerification } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const ApproveStudentButton = ({ studentId }: { studentId: string }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Approve student verification
      await approveStudentVerification(studentId, currentUser.uid);
      
      console.log('[Firestore Write] Student verified');
      alert('Student verification approved!');
      
      // The real-time listener will auto-update the UI
      
    } catch (error: any) {
      console.error('[Firestore Write Error]', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleApprove} disabled={loading}>
      {loading ? 'Approving...' : 'Approve'}
    </button>
  );
};
```

### Professor: Reject Verification

```typescript
import { rejectStudentVerification } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const RejectStudentButton = ({ studentId }: { studentId: string }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!currentUser) return;

    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setLoading(true);
    try {
      // Reject student verification
      await rejectStudentVerification(
        studentId, 
        currentUser.uid, 
        reason || undefined
      );
      
      console.log('[Firestore Write] Student rejected');
      alert('Student verification rejected.');
      
      // The real-time listener will auto-update the UI
      
    } catch (error: any) {
      console.error('[Firestore Write Error]', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleReject} disabled={loading}>
      {loading ? 'Rejecting...' : 'Reject'}
    </button>
  );
};
```

---

## Real-time Listener Examples

### Example 1: Student Listening to Own Verification

```typescript
import { onStudentVerificationUpdate } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener
    const unsubscribe = onStudentVerificationUpdate(
      currentUser.uid,
      (updatedStudent) => {
        console.log('[State Sync] Profile updated!', {
          verificationStatus: updatedStudent.verificationStatus,
          verifiedBy: updatedStudent.verifiedBy,
        });
        
        // Update local state
        setProfile(updatedStudent);
        
        // Optional: Show notification
        if (updatedStudent.verificationStatus === 'verified') {
          alert('🎉 You have been verified by a professor!');
        } else if (updatedStudent.verificationStatus === 'rejected') {
          alert('⚠️ Your verification was rejected. Please review your profile.');
        }
      },
      (error) => {
        console.error('[State Sync Error]', error);
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return (
    <div>
      <h2>Verification Status: {profile?.verificationStatus}</h2>
      {profile?.verificationStatus === 'verified' && (
        <p>✅ Your profile is verified!</p>
      )}
    </div>
  );
};
```

### Example 2: Professor Listening to Pending Requests

```typescript
import { onPendingVerificationsUpdate } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const ProfessorDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for pending verifications
    const unsubscribe = onPendingVerificationsUpdate(
      (updatedStudents) => {
        console.log('[State Sync] Pending verification requests updated', {
          count: updatedStudents.length,
        });
        
        // Update local state
        setPendingStudents(updatedStudents);
        
        // Optional: Show notification
        if (updatedStudents.length > 0) {
          console.log(`${updatedStudents.length} student(s) awaiting verification`);
        }
      },
      (error) => {
        console.error('[State Sync Error]', error);
      },
      currentUser.uid // Optional: filter by professor ID
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return (
    <div>
      <h2>Pending Verification Requests: {pendingStudents.length}</h2>
      {pendingStudents.map(student => (
        <div key={student.uid}>
          <p>{student.fullName || student.displayName}</p>
          <p>{student.email}</p>
          {/* Action buttons here */}
        </div>
      ))}
    </div>
  );
};
```

---

## Query Function Examples

### Fetch Pending Verifications

```typescript
import { getPendingVerificationRequests } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const ProfessorDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    const fetchPending = async () => {
      if (!currentUser) return;

      try {
        console.log('[Firestore Read] Fetching pending verifications');
        
        // Fetch all pending students (or filtered by professor)
        const students = await getPendingVerificationRequests(currentUser.uid);
        
        console.log('[Firestore Read] Found pending students:', students.length);
        setPendingStudents(students);
        
      } catch (error: any) {
        console.error('[Firestore Read Error]', error);
      }
    };

    fetchPending();
  }, [currentUser]);

  return (
    <div>
      <h2>Pending Verifications: {pendingStudents.length}</h2>
      {/* Render students */}
    </div>
  );
};
```

### Fetch Verified Students (for HR)

```typescript
import { getVerifiedStudents } from '../services/studentService';

export const HRDashboard = () => {
  const [verifiedStudents, setVerifiedStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    const fetchVerified = async () => {
      try {
        console.log('[Firestore Read] Fetching verified students');
        
        // Fetch all verified students
        const students = await getVerifiedStudents();
        
        console.log('[Firestore Read] Found verified students:', students.length);
        setVerifiedStudents(students);
        
      } catch (error: any) {
        console.error('[Firestore Read Error]', error);
      }
    };

    fetchVerified();
  }, []);

  return (
    <div>
      <h2>Verified Students: {verifiedStudents.length}</h2>
      {verifiedStudents.map(student => (
        <div key={student.uid}>
          <p>{student.fullName}</p>
          <p>Email: {student.email}</p>
          <p>Skills: {student.skills?.length || 0}</p>
          <p>Job Readiness: {student.jobReadinessScore}%</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Error Handling Patterns

### Pattern 1: Comprehensive Error Handling with Retry

```typescript
import { requestStudentVerification } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export const RequestVerificationWithRetry = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRequest = async (retry = false) => {
    if (!currentUser) return;

    if (!retry) {
      setRetryCount(0);
      setError(null);
    }

    setLoading(true);
    try {
      await requestStudentVerification(currentUser.uid);
      
      console.log('[Firestore Write] Request successful');
      setError(null);
      setRetryCount(0);
      alert('✅ Verification request sent!');
      
    } catch (err: any) {
      console.error('[Firestore Write Error]', err);
      
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      
      // Offer retry for specific errors
      if (retryCount < 3 && (err.code === 'NETWORK' || err.code === 'SERVICE_UNAVAILABLE')) {
        console.log(`[Firestore Write Error] Retrying (attempt ${retryCount + 1}/3)...`);
        setRetryCount(retryCount + 1);
        
        // Retry after 2 seconds
        setTimeout(() => {
          handleRequest(true);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          ⚠️ Error: {error}
          {retryCount < 3 && <p>Retrying... ({retryCount}/3)</p>}
        </div>
      )}
      <button 
        onClick={() => handleRequest()}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Request Verification'}
      </button>
    </div>
  );
};
```

### Pattern 2: Error Categorization and Logging

```typescript
const categorizeError = (error: any): string => {
  if (error.code === 'permission-denied') {
    return '[Firestore Write Error] Permission denied - User not authenticated';
  }
  if (error.code === 'not-found') {
    return '[Firestore Read Error] Student profile not found';
  }
  if (error.code === 'unauthenticated') {
    return '[UI Error] Please log in first';
  }
  if (error.code === 'NETWORK') {
    return '[Firestore Write Error] Network connection failed';
  }
  return `[Firestore Error] ${error.message || 'Unknown error'}`;
};

// Usage:
try {
  await requestStudentVerification(studentId);
} catch (error) {
  const categorizedError = categorizeError(error);
  console.error(categorizedError);
  alert(categorizedError);
}
```

---

## State Management Patterns

### Pattern 1: Combined Listener + Query (Best Practice)

```typescript
export const ProfessorDashboard = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeListeners = async () => {
      try {
        // First, fetch initial data
        const initialStudents = await getPendingVerificationRequests(currentUser.uid);
        if (isMounted) {
          setStudents(initialStudents);
          console.log('[Firestore Read] Initial data loaded');
        }

        // Then, set up real-time listener
        unsubscribe = onPendingVerificationsUpdate(
          (updatedStudents) => {
            if (isMounted) {
              setStudents(updatedStudents);
              console.log('[State Sync] Real-time update received');
            }
          },
          (error) => {
            console.error('[State Sync Error]', error);
          },
          currentUser.uid
        );

      } catch (error) {
        console.error('[Firestore Read Error]', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeListeners();

    // Cleanup
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Students: {students.length}</h2>
      {/* Render students */}
    </div>
  );
};
```

---

## Testing Examples

### Unit Test Example (Jest)

```typescript
import { requestStudentVerification } from '../services/studentService';
import { getDoc, updateDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('Student Verification', () => {
  it('should update verification status to pending', async () => {
    const studentId = 'test-student-123';
    
    // Mock Firestore
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: studentId, verificationStatus: 'not-requested' }),
    });
    
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await requestStudentVerification(studentId);

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        verificationStatus: 'pending',
      })
    );
  });
});
```

---

## Performance Tips

### 1. Batch Updates
```typescript
// ❌ Avoid: Multiple individual updates
await updateProfile(student1);
await updateProfile(student2);
await updateProfile(student3);

// ✅ Good: Batch updates
const students = await Promise.all([
  updateProfile(student1),
  updateProfile(student2),
  updateProfile(student3),
]);
```

### 2. Debounce Real-time Updates
```typescript
const [students, setStudents] = useState<StudentProfile[]>([]);
const timerRef = useRef<NodeJS.Timeout | null>(null);

const handleUpdate = (updatedStudents: StudentProfile[]) => {
  // Debounce: only update after 500ms of no changes
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }
  
  timerRef.current = setTimeout(() => {
    setStudents(updatedStudents);
  }, 500);
};
```

### 3. Memoize Expensive Computations
```typescript
const [students, setStudents] = useState<StudentProfile[]>([]);

const pendingCount = useMemo(() => {
  return students.filter(s => s.verificationStatus === 'pending').length;
}, [students]);
```

---

For more information, see:
- `VERIFICATION_SYSTEM_IMPLEMENTATION.md` - Detailed implementation guide
- `VERIFICATION_QUICK_REFERENCE.md` - Quick reference
