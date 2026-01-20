// Admin Demo Utilities Page
// Use this page to seed demo data for presentations
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { seedDemoStudents } from '../utils/seedDemoData';

const AdminDemoUtils = () => {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedData = async () => {
    setSeeding(true);
    setMessage('Seeding demo data...');
    try {
      await seedDemoStudents();
      setMessage('✓ Demo data seeded successfully! Check your Firebase console.');
    } catch (error) {
      console.error('Error seeding data:', error);
      setMessage('✗ Error seeding data. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Demo Utilities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Use these utilities to prepare your prototype for demonstrations.
          </p>

          {/* Seed Demo Data */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Seed Demo Students
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will create 5 demo students with varied skill points for presentation purposes.
              Each student will have different proficiency levels in skills like React, Node.js, Python, etc.
            </p>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {seeding ? 'Seeding Data...' : 'Seed Demo Data'}
            </button>
            {message && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.includes('✓') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                  : message.includes('✗')
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Demo Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              Demo Students Info
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              The demo data creates students with the following characteristics:
            </p>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
              <li>Names: Alex Johnson, Sarah Chen, Michael Brown, Emily Davis, James Wilson</li>
              <li>Email format: demo.student[1-5]@degree2destiny.com</li>
              <li>10 varied skills per student (React, Node.js, Python, JavaScript, TypeScript, MongoDB, SQL, Docker, AWS, Git)</li>
              <li>Skill points range from 55 to 90 (different for each student)</li>
              <li>Mix of verified and pending skills</li>
              <li>Realistic readiness scores and Destiny evaluation scores</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push('/professor/dashboard')}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Professor Dashboard
            </button>
            <button
              onClick={() => router.push('/recruiter/dashboard')}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go to Recruiter Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDemoUtils;
