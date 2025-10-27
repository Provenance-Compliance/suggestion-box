'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleMicrosoftSignIn = async () => {
    try {
      await signIn('azure-ad', { callbackUrl: '/' });
    } catch (error) {
      setError('Failed to sign in with Microsoft Entra ID. Please try again.');
      console.error('Microsoft sign-in error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4bdcf5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Internal access for organization members only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Microsoft Entra ID Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleMicrosoftSignIn}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4bdcf5] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4bdcf5" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Sign in with Microsoft Entra ID
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              You must be a member of our organization to access this application
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Innovation Hub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
