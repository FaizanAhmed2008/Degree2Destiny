import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

// User role type
export type UserRole = 'student' | 'professor' | 'recruiter';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: any;
}

// Auth context interface
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Register new user with role
  const register = async (email: string, password: string, role: UserRole): Promise<UserProfile> => {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        role,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfileData);
      setUserProfile(userProfileData);
      return userProfileData; // Return the user profile data
    } catch (error: any) {
      throw error;
    }
  };

  // Login existing user
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  // Logout current user
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error: any) {
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const rawProfileData = userDoc.data() as UserProfile & { role?: unknown };

        // Normalize roles to the only supported set:
        // - student
        // - professor
        // - recruiter (HR)
        const allowedRoles: UserRole[] = ['student', 'professor', 'recruiter'];
        const normalizedRole = allowedRoles.includes(rawProfileData.role as UserRole)
          ? (rawProfileData.role as UserRole)
          : ('recruiter' as UserRole);

        const profileData: UserProfile = {
          ...rawProfileData,
          role: normalizedRole,
        };

        // If an older/unknown role exists in Firestore, migrate it forward.
        if ((rawProfileData.role as any) !== normalizedRole) {
          await setDoc(doc(db, 'users', uid), profileData, { merge: true });
        }

        setUserProfile(profileData);
      } else {
        setUserProfile(null); // Ensure profile is null if not found
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null); // Ensure profile is null on error
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile when user is authenticated
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
