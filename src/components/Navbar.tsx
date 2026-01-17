import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';

// Navigation bar component with user info and logout
const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Degree2Destiny</h1>
          </div>
          {currentUser && userProfile && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{userProfile.email}</span>
                <RoleBadge role={userProfile.role} />
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
