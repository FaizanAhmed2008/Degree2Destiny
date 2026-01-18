import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// Landing page with navigation to login/register
const Home = () => {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (currentUser && userProfile) {
      switch (userProfile.role) {
        case 'student':
          router.push('/student/dashboard');
          break;
        case 'professor':
          router.push('/professor/dashboard');
          break;
        case 'company':
          router.push('/company/dashboard');
          break;
      }
    }
  }, [currentUser, userProfile, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Degree2Destiny
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            A skill-based platform connecting students, professors, and companies
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-lg border-2 border-indigo-600 dark:border-indigo-500"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
