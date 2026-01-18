import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Component to protect routes based on authentication and role
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Redirect to login if not authenticated
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Redirect to login if user profile not loaded
      if (!userProfile) {
        router.push('/login');
        return;
      }

      // Redirect to appropriate dashboard if role doesn't match
      if (!allowedRoles.includes(userProfile.role)) {
        switch (userProfile.role) {
          case 'student':
            router.push('/student/dashboard');
            break;
          case 'professor':
            router.push('/professor/dashboard');
            break;
          case 'recruiter':
          case 'company':
            router.push('/recruiter/dashboard');
            break;
          default:
            router.push('/login');
        }
      }
    }
  }, [currentUser, userProfile, loading, allowedRoles, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!currentUser || !userProfile || !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
