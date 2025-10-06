'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import SuggestionForm from '@/components/SuggestionForm';
import SuggestionList from '@/components/SuggestionList';
import SuggestionDashboard from '@/components/SuggestionDashboard';
import CategoryManagement from '@/components/CategoryManagement';
import { SuggestionFormData } from '@/lib/validations';
import { ISuggestion } from '@/lib/models/Suggestion';
import { MessageSquare, Users, Shield } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [suggestions, setSuggestions] = useState<(ISuggestion & { 
    submittedBy?: { name: string; email: string };
    category?: { name: string; color: string };
  })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  // Force dashboard refresh when status changes
  const handleStatusChange = () => {
    // This will trigger a re-render of the dashboard component
    // The dashboard will refetch its own data
  };

  // Fetch suggestions
  const fetchSuggestions = async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setIsPolling(true);
      }
      
      const response = await fetch('/api/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
      if (isBackgroundRefresh) {
        setIsPolling(false);
      }
    }
  };

  useEffect(() => {
    if (session) {
      fetchSuggestions();
      
      // Set up polling every 10 seconds
      const interval = setInterval(() => {
        fetchSuggestions(true);
      }, 10000);
      
      // Cleanup interval on unmount
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [session]);

  // Handle suggestion submission
  const handleSuggestionSubmit = async (data: SuggestionFormData) => {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit suggestion');
    }

    // Refresh suggestions list
    await fetchSuggestions();
  };

  // Handle suggestion update (admin only)
  const handleSuggestionUpdate = async (id: string, status: string, adminNotes?: string) => {
    const response = await fetch(`/api/suggestions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, adminNotes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update suggestion');
    }
  };

  // Handle suggestion deletion (admin only)
  const handleSuggestionDelete = async (id: string) => {
    const response = await fetch(`/api/suggestions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete suggestion');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Suggestion Box</h1>
            </div>
            
            {session && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  {isAdmin && (
                    <div className="flex items-center mr-4">
                      <Shield className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-blue-600 font-medium">Admin</span>
                    </div>
                  )}
                  <Users className="h-4 w-4 mr-1" />
                  <span>{session.user?.name || session.user?.email}</span>
                  {isPolling && (
                    <div className="ml-2 flex items-center text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                      Auto-refreshing
                    </div>
                  )}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          // Welcome Section with Microsoft Entra ID Login
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Welcome to Suggestion Box
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Share your ideas, report bugs, or suggest improvements. 
                Your feedback helps us improve!
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Organization Access Required
              </h3>
              <p className="text-gray-600 mb-8">
                This application is for organization members only. 
                Please sign in with your Microsoft Entra ID account to access the suggestion box.
              </p>
              
              <div className="flex justify-center">
                <button
                  onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                  Sign in with Microsoft Entra ID
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Main Application
          <div className="space-y-8">
            {/* Universal Dashboard */}
            <SuggestionDashboard />

            {/* Admin Category Management */}
            {isAdmin && (
              <CategoryManagement />
            )}

            {/* Welcome Message */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Suggestion Management
              </h2>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Review and manage all submitted suggestions'
                  : 'Track your suggestions and share new ideas to help improve our platform'
                }
              </p>
            </div>

            {/* Suggestion Form */}
            <SuggestionForm onSubmit={handleSuggestionSubmit} />

            {/* Suggestions List */}
            <SuggestionList
              suggestions={suggestions}
              onRefresh={fetchSuggestions}
              onUpdate={isAdmin ? handleSuggestionUpdate : undefined}
              onDelete={isAdmin ? handleSuggestionDelete : undefined}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Suggestion Box. Built with Next.js, MongoDB, and Microsoft Entra ID.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}