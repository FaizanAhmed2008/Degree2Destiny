import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

// Navigation bar component with modern design
const Navbar: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();

  const getNavLinks = () => {
    if (!userProfile) return [];
    
    switch (userProfile.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard' },
          { name: 'Manage Skills', path: '/student/skills-manage' },
          { name: 'Profile', path: '/student/profile' },
        ];
      case 'professor':
        return [
          { name: 'Dashboard', path: '/professor/dashboard' },
          { name: 'Students', path: '/professor/dashboard#students' },
          { name: 'Profile', path: '/professor/profile' },
        ];
      case 'company':
      case 'recruiter':
        return [
          { name: 'Dashboard', path: '/recruiter/dashboard' },
          { name: 'Candidates', path: '/recruiter/dashboard#candidates' },
          { name: 'Messages', path: '/recruiter/messages' },
          { name: 'Profile', path: '/recruiter/profile' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();
  const isLandingPage = router.pathname === '/';

  // Landing page navigation links with client-side guards
  const landingNavLinks = [
    { 
      name: 'Home', 
      path: '/', 
      action: () => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    { 
      name: 'About', 
      path: '/#about', 
      action: () => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const element = document.getElementById('about');
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    },
    { 
      name: 'Features', 
      path: '/#features', 
      action: () => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const element = document.getElementById('features');
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    },
    { 
      name: 'FAQ', 
      path: '/#faq', 
      action: () => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const element = document.getElementById('faq');
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    },
  ];

  return (
    <nav className={`${
      isLandingPage 
        ? `absolute top-0 left-0 right-0 ${
            theme === 'dark' 
              ? 'bg-transparent' 
              : 'bg-white/95 backdrop-blur-md shadow-sm'
          }`
        : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm'
    } transition-colors duration-200 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => router.push(currentUser ? (userProfile?.role === 'student' ? '/student/dashboard' : userProfile?.role === 'professor' ? '/professor/dashboard' : userProfile?.role === 'recruiter' || userProfile?.role === 'company' ? '/recruiter/dashboard' : '/') : '/')}
              className="group"
            >
              <Logo 
                size="md" 
                showText={true} 
                textClassName={`text-xl font-bold transition-colors ${
                  isLandingPage 
                    ? theme === 'dark' 
                      ? 'text-white' 
                      : 'text-gray-900'
                    : 'text-gray-900 dark:text-white'
                }`}
                className="group-hover:scale-105 transition-transform duration-200"
              />
            </button>
            
            {/* Navigation Links */}
            {isLandingPage ? (
              <div className="hidden md:flex items-center space-x-1">
                {landingNavLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={link.action}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            ) : currentUser && userProfile && navLinks.length > 0 ? (
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
            ) : null}
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
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    isLandingPage 
                      ? theme === 'dark'
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 font-semibold hover:bg-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isLandingPage
                      ? theme === 'dark'
                        ? 'bg-white text-indigo-600 hover:bg-gray-100 drop-shadow-lg'
                        : 'bg-white text-indigo-600 hover:bg-gray-100 drop-shadow-lg'
                      : 'text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                  }`}
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
