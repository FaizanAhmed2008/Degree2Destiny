import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';

// Navigation bar component with modern design
const Navbar: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();

  const getNavLinks = () => {
    if (!userProfile) return [];
    
    switch (userProfile.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard' },
          { name: 'Skills', path: '/student/dashboard#skills' },
          { name: 'Profile', path: '/student/profile' },
        ];
      case 'professor':
        return [
          { name: 'Dashboard', path: '/professor/dashboard' },
          { name: 'Students', path: '/professor/dashboard#students' },
          { name: 'Profile', path: '/professor/profile' },
        ];
      case 'company':
        return [
          { name: 'Dashboard', path: '/company/dashboard' },
          { name: 'Candidates', path: '/company/dashboard#candidates' },
          { name: 'Profile', path: '/company/profile' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => router.push(currentUser ? (userProfile?.role === 'student' ? '/student/dashboard' : userProfile?.role === 'professor' ? '/professor/dashboard' : '/company/dashboard') : '/')}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D2D</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Degree2Destiny</h1>
            </button>
            
            {/* Navigation Links */}
            {currentUser && userProfile && navLinks.length > 0 && (
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => router.push(link.path)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      router.pathname === link.path
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {currentUser && userProfile ? (
              <ProfileDropdown />
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
