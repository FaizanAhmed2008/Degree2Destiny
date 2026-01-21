import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

interface StatusItem {
  label: string;
  ok: boolean;
  details?: string;
}

const SystemStatusPage = () => {
  const router = useRouter();
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runChecks = async () => {
      const results: StatusItem[] = [];

      // AI status
      try {
        const res = await fetch('/api/destiny-ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Quick health check of Destiny AI.',
            role: 'student',
            contextData: { source: 'system-status' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          results.push({
            label: 'Destiny AI',
            ok: Boolean(data.response),
            details: data.response ? 'Responded successfully.' : 'Empty response.',
          });
        } else {
          results.push({
            label: 'Destiny AI',
            ok: false,
            details: `HTTP ${res.status}`,
          });
        }
      } catch (e: any) {
        console.error('[SystemStatus] Destiny AI check failed', e); // FIXED HERE
        results.push({
          label: 'Destiny AI',
          ok: false,
          details: e?.message || 'Request failed',
        });
      }

      // Database connection
      try {
        const studentsQ = query(collection(db, 'students'), limit(1));
        const snap = await getDocs(studentsQ);
        results.push({
          label: 'Database (Firestore)',
          ok: true,
          details: `students docs: ${snap.size}`,
        });
      } catch (e: any) {
        console.error('[SystemStatus] DB check failed', e);
        results.push({
          label: 'Database (Firestore)',
          ok: false,
          details: e?.message || 'Failed to query Firestore',
        });
      }

      // Student data / field completeness
      try {
        const studentsQ = query(collection(db, 'students'), limit(5));
        const snap = await getDocs(studentsQ);
        let missingName = 0;
        let missingScores = 0;
        snap.forEach((doc) => {
          const data = doc.data() as any;
          if (!data.displayName) missingName += 1;
          if (
            data.aptitudeScore === undefined ||
            data.technicalScore === undefined ||
            data.communicationScore === undefined
          ) {
            missingScores += 1;
          }
        });

        results.push({
          label: 'Student Data Loaded',
          ok: snap.size > 0,
          details: `Sampled ${snap.size} students.`,
        });

        results.push({
          label: 'Missing Field Warnings',
          ok: missingName === 0 && missingScores === 0,
          details: `Missing names: ${missingName}, missing scores: ${missingScores}`,
        });
      } catch (e: any) {
        console.error('[SystemStatus] Student data check failed', e);
        results.push({
          label: 'Student Data Loaded',
          ok: false,
          details: e?.message || 'Failed to inspect student data',
        });
      }

      setStatuses(results);
      setLoading(false);
    };

    runChecks();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['student', 'professor', 'recruiter']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                System Status
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Internal debug page showing the health of Destiny AI, APIs, and data connections.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin-demo-utils')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Demo Utilities
            </button>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-700 dark:text-gray-200">Running health checks...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statuses.map((item) => (
                <div
                  key={item.label}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between border ${
                    item.ok
                      ? 'border-green-200 dark:border-green-700'
                      : 'border-red-200 dark:border-red-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    {item.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.details}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.ok
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {item.ok ? 'OK' : 'ISSUE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SystemStatusPage;

