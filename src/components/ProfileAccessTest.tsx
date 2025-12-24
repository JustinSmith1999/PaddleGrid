import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ProfileAccessTest() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {
      authStatus: null,
      profileCount: null,
      sampleProfiles: null,
      ownProfile: null,
      errors: []
    };

    try {
      // Test 1: Check authentication
      const { data: sessionData } = await supabase.auth.getSession();
      testResults.authStatus = {
        isAuthenticated: !!sessionData.session,
        userId: sessionData.session?.user?.id || 'Not authenticated'
      };

      // Test 2: Count all profiles
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        testResults.errors.push(`Count error: ${countError.message}`);
      } else {
        testResults.profileCount = count;
      }

      // Test 3: Fetch sample profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(5);

      if (profilesError) {
        testResults.errors.push(`Profiles fetch error: ${profilesError.message}`);
      } else {
        testResults.sampleProfiles = profiles;
      }

      // Test 4: Fetch own profile (if authenticated)
      if (user) {
        const { data: ownProfile, error: ownError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (ownError) {
          testResults.errors.push(`Own profile error: ${ownError.message}`);
        } else {
          testResults.ownProfile = ownProfile;
        }
      }

    } catch (error: any) {
      testResults.errors.push(`General error: ${error.message}`);
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Profile Access Diagnostic</h2>

      <button
        onClick={runTests}
        disabled={testing}
        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
      >
        {testing && <Loader2 className="w-5 h-5 animate-spin" />}
        Run Diagnostic Tests
      </button>

      {results && (
        <div className="mt-6 space-y-4">
          {/* Authentication Status */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {results.authStatus.isAuthenticated ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Authentication Status
            </h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results.authStatus, null, 2)}
            </pre>
          </div>

          {/* Profile Count */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {results.profileCount !== null ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Total Profiles Count
            </h3>
            <p className="text-lg">{results.profileCount !== null ? `${results.profileCount} profiles found` : 'Failed to count'}</p>
          </div>

          {/* Sample Profiles */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {results.sampleProfiles ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Sample Profiles (First 5)
            </h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-64">
              {JSON.stringify(results.sampleProfiles, null, 2)}
            </pre>
          </div>

          {/* Own Profile */}
          {user && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {results.ownProfile ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Your Profile
              </h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(results.ownProfile, null, 2)}
              </pre>
            </div>
          )}

          {/* Errors */}
          {results.errors.length > 0 && (
            <div className="border border-red-300 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Errors Detected
              </h3>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {results.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
