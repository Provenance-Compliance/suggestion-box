'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import SuggestionForm from '@/components/SuggestionForm';
import SuggestionList from '@/components/SuggestionList';
import SuggestionDashboard from '@/components/SuggestionDashboard';
import CategoryManagement from '@/components/CategoryManagement';
import { SuggestionFormData } from '@/lib/validations';
import { ISuggestion } from '@/lib/models/Suggestion';
import { MessageSquare, Users, Shield, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const [suggestions, setSuggestions] = useState<(ISuggestion & { 
    submittedBy?: { name: string; email: string };
    category?: { name: string; color: string };
  })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [isSuggestionFormOpen, setIsSuggestionFormOpen] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  // Force dashboard refresh when status changes
  const [statusChangeTrigger, setStatusChangeTrigger] = useState(0);
  
  const handleStatusChange = () => {
    // This will trigger a re-render of the dashboard component
    setStatusChangeTrigger(prev => prev + 1);
  };

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      console.log('Parent: fetchSuggestions called');
      const response = await fetch('/api/suggestions?limit=100');
      if (response.ok) {
        const data = await response.json();
        console.log('Parent: Setting suggestions', { count: data.suggestions?.length || 0 });
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Use refs to access current values without causing dependency issues
  const suggestionsRef = useRef(suggestions);
  const fetchSuggestionsRef = useRef(fetchSuggestions);
  const handleStatusChangeRef = useRef(handleStatusChange);
  
  suggestionsRef.current = suggestions;
  fetchSuggestionsRef.current = fetchSuggestions;
  handleStatusChangeRef.current = handleStatusChange;


  useEffect(() => {
    if (session) {
      fetchSuggestions();
    } else {
      setIsLoading(false);
    }
  }, [session]); // Only depend on session

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
      const errorData = await response.json();
      if (response.status === 404) {
        throw new Error('Suggestion not found or has been deleted');
      } else if (response.status === 410) {
        throw new Error('Suggestion was deleted during update');
      } else {
        throw new Error(errorData.error || 'Failed to update suggestion');
      }
    }
  };

  // Handle suggestion deletion (admin only)
  const handleSuggestionDelete = async (id: string) => {
    const response = await fetch(`/api/suggestions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 404) {
        throw new Error('Suggestion not found or already deleted');
      } else if (response.status === 410) {
        throw new Error('Suggestion was already deleted by another user');
      } else {
        throw new Error(errorData.error || 'Failed to delete suggestion');
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4bdcf5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-fit py-4">
            <div className="flex items-center">
              <div className="w-40 h-10 mr-4 pr-4 border-r-2 border-gray-200 flex items-center">
                <Image 
                  src="/prov-logo.png" 
                  alt="Innovation Hub" 
                  width={160} 
                  height={160} 
                  className="object-contain w-full h-full"
                  priority
                />
              </div>  
              <h1 className="text-xs font-bold text-gray-900">INNOVATION HUB</h1>
            </div>
            
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  {isAdmin && (
                    <div className="flex items-center mr-4">
                      <Shield className="h-4 w-4 text-[#4bdcf5] mr-1" />
                      <span className="text-[#4bdcf5] font-medium">Admin</span>
                    </div>
                  )}
                  <Users className="h-4 w-4 mr-1" />
                  <span>{session.user?.name || session.user?.email}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4bdcf5] hover:bg-[#3bc4e0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4bdcf5] transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          // Landing Page for Internal Company Website
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Provenance Innovation Hub
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your voice matters! Share ideas, raise issues, and help shape the future of our company. Every suggestion is valuable and helps us continuously improve.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-[#4bdcf5]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#4bdcf5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Ideas</h3>
                <p className="text-gray-600">
                  Propose new features, improvements, or innovative solutions that could benefit our team and company.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-[#4bdcf5]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#4bdcf5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Drive Change</h3>
                <p className="text-gray-600">
                  Your feedback directly influences company decisions and helps us build a better workplace together.
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-16">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 bg-[#4bdcf5] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">1</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sign In</h3>
                  <p className="text-gray-600 text-sm">Use your work Microsoft account to access the platform</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-[#472d72] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">2</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Submit</h3>
                  <p className="text-gray-600 text-sm">Share your suggestion with a clear title and description</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-[#4bdcf5] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">3</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Track</h3>
                  <p className="text-gray-600 text-sm">Monitor the status of your suggestions in real-time, Others can upvote your suggestion.</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-[#472d72] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">4</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Impact</h3>
                  <p className="text-gray-600 text-sm">See your ideas come to life and make a difference</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-[#4bdcf5] to-[#472d72] rounded-lg shadow-lg p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join your colleagues in shaping our company's future. Your ideas matter!
              </p>
              <button
                onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-[#472d72] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors shadow-lg"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#472d72" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Access Innovation Hub
              </button>
              <p className="text-sm mt-4 opacity-75">
                Internal company access only • Microsoft Entra ID required
              </p>
            </div>
          </div>
        ) : (
          // Main Application
          <div className="space-y-12">
            {/* Hero Section */}
           

            {/* Dashboard Section */}
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-[#4bdcf5] rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">Dashboard Overview</h2>
              </div>
              <SuggestionDashboard onStatusChange={handleStatusChange} statusChangeTrigger={statusChangeTrigger} />
            </section>

            {/* Admin Tools Section */}
            {isAdmin && (
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-[#4bdcf5] to-[#472d72] px-8 py-6">
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 text-white mr-3" />
                    <h2 className="text-2xl font-bold text-white">Admin Tools</h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="">
                    <button
                      onClick={() => setIsCategoryManagementOpen(!isCategoryManagementOpen)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white transition-colors rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#4bdcf5]/10 rounded-lg flex items-center justify-center mr-4">
                          <Users className="h-5 w-5 text-[#4bdcf5]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
                          <p className="text-sm text-gray-600">Organize and manage suggestion categories</p>
                        </div>
                      </div>
                      {isCategoryManagementOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {isCategoryManagementOpen && (
                      <div className="mt-6">
                        <CategoryManagement />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Action Section */}
            <section >
              {/* Submit Suggestion Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-br from-[#4bdcf5] to-[#472d72] px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Submit a Suggestion</h2>
                  </div>
                </div>
                <div className="p-6">
                  <button
                    onClick={() => setIsSuggestionFormOpen(!isSuggestionFormOpen)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#4bdcf5]/10 rounded-lg flex items-center justify-center mr-4">
                        <MessageSquare className="h-5 w-5 text-[#4bdcf5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Share Your Ideas</h3>
                        <p className="text-sm text-gray-600">Submit new suggestions and improvements</p>
                      </div>
                    </div>
                    {isSuggestionFormOpen ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {isSuggestionFormOpen && (
                    <div className="mt-6">
                      <SuggestionForm onSubmit={handleSuggestionSubmit} />
                    </div>
                  )}
                </div>
              </div>

          
            </section>

            {/* Suggestions List Section */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-[#4bdcf5] to-[#472d72] px-8 py-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">All Suggestions</h2>
                </div>
              </div>
              <div className="p-8">
                <SuggestionList
                  suggestions={suggestions}
                  onRefresh={fetchSuggestions}
                  onUpdate={isAdmin ? handleSuggestionUpdate : undefined}
                  onDelete={isAdmin ? handleSuggestionDelete : undefined}
                  onStatusChange={handleStatusChange}
                  isLoading={isLoading}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Provenance Compliance Innovation Hub</p>
          </div>
        </div>
      </footer>
    </div>
  );
}