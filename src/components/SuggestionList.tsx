'use client';

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useSession } from 'next-auth/react';
import SuggestionCard from './SuggestionCard';
import SuggestionSkeleton from './SuggestionSkeleton';
import { ISuggestion } from '@/lib/models/Suggestion';
import { ICategory } from '@/lib/models/Category';
import { Filter, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface SuggestionListProps {
  suggestions: (ISuggestion & { 
    submittedBy?: { name: string; email: string };
    category?: { name: string; color: string };
  })[];
  onRefresh?: () => void;
  onUpdate?: (id: string, status: string, adminNotes?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onStatusChange?: () => void;
  isBackgroundRefresh?: boolean;
  isLoading?: boolean;
}

function SuggestionList({ 
  suggestions, 
  onRefresh, 
  onUpdate, 
  onDelete,
  onStatusChange,
  isBackgroundRefresh = false,
  isLoading = false
}: SuggestionListProps) {
  const { data: session } = useSession();
  
  // Debug logging
  console.log('SuggestionList: Component rendered', { 
    suggestionsCount: suggestions.length,
    isBackgroundRefresh,
    isLoading 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('recent');
  const [isSorting, setIsSorting] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset to first page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter((cat: ICategory) => cat.isActive));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Initialize the ref first
  const prevSuggestionsRef = useRef(suggestions);
  const [stableSuggestions, setStableSuggestions] = useState(suggestions);
  
  // Create a simple hash of the suggestions for comparison
  const createSuggestionsHash = (suggestions: any[]) => {
    return suggestions.map(s => 
      `${s._id}-${s.title}-${s.status}-${s.upvoteCount || 0}-${s.updatedAt}`
    ).join('|');
  };

  // Update stable suggestions only when content actually changes
  useEffect(() => {
    const prevSuggestions = prevSuggestionsRef.current;
    
    // Quick length check first
    if (suggestions.length !== prevSuggestions.length) {
      console.log('SuggestionList: Length changed, updating suggestions');
      prevSuggestionsRef.current = suggestions;
      setStableSuggestions(suggestions);
      return;
    }
    
    // Quick hash comparison
    const currentHash = createSuggestionsHash(suggestions);
    const prevHash = createSuggestionsHash(prevSuggestions);
    
    // If hashes are the same, no changes
    if (currentHash === prevHash) {
      console.log('SuggestionList: No changes detected, skipping update');
      return;
    }
    
    console.log('SuggestionList: Changes detected, updating suggestions');
    
    // Create a merged array that only updates changed suggestions
    const mergedSuggestions = suggestions.map((newSuggestion, index) => {
      const oldSuggestion = prevSuggestions[index];
      if (!oldSuggestion) return newSuggestion;
      
      // Check if this specific suggestion has changed
      const hasChanged = (
        (newSuggestion as any)._id.toString() !== (oldSuggestion as any)._id.toString() ||
        newSuggestion.title !== oldSuggestion.title ||
        newSuggestion.content !== oldSuggestion.content ||
        newSuggestion.status !== oldSuggestion.status ||
        (newSuggestion as any).upvoteCount !== (oldSuggestion as any).upvoteCount ||
        newSuggestion.updatedAt?.toString() !== oldSuggestion.updatedAt?.toString()
      );

      // Return new suggestion if changed, otherwise keep the old reference
      return hasChanged ? newSuggestion : oldSuggestion;
    });

    prevSuggestionsRef.current = mergedSuggestions;
    setStableSuggestions(mergedSuggestions);
  }, [suggestions]);

  // Memoize filtered suggestions using stable suggestions
  const filteredSuggestions = useMemo(() => {
    let filtered = stableSuggestions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(suggestion =>
        suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(suggestion => {
        if (!suggestion.category) {
          return false; // Exclude suggestions without categories when filtering by specific category
        }
        
        // Handle both ObjectId and populated category object
        if (typeof suggestion.category === 'object' && (suggestion.category as any)._id) {
          return (suggestion.category as any)._id.toString() === categoryFilter;
        } else {
          return suggestion.category.toString() === categoryFilter;
        }
      });
    }

    // Sort suggestions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // Handle both Date objects and date strings
          const aDateRecent = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bDateRecent = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          const aTimeRecent = aDateRecent.getTime();
          const bTimeRecent = bDateRecent.getTime();
          
          // Check for invalid dates
          if (isNaN(aTimeRecent) || isNaN(bTimeRecent)) {
            console.warn('Invalid date found:', { a: a.createdAt, b: b.createdAt });
            return 0;
          }
          
          return bTimeRecent - aTimeRecent;
        case 'oldest':
          // Handle both Date objects and date strings
          const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          const aTime = aDate.getTime();
          const bTime = bDate.getTime();
          
          // Check for invalid dates
          if (isNaN(aTime) || isNaN(bTime)) {
            console.warn('Invalid date found:', { a: a.createdAt, b: b.createdAt });
            return 0;
          }
          
          return aTime - bTime;
        case 'most-liked':
          const aUpvotes = (a as any).upvoteCount || 0;
          const bUpvotes = (b as any).upvoteCount || 0;
          return bUpvotes - aUpvotes;
        case 'least-liked':
          const aUpvotesLeast = (a as any).upvoteCount || 0;
          const bUpvotesLeast = (b as any).upvoteCount || 0;
          return aUpvotesLeast - bUpvotesLeast;
        default:
          return 0;
      }
    });

    return filtered;
  }, [stableSuggestions, searchTerm, statusFilter, categoryFilter, sortBy]);

  // Handle loading animation for user-initiated changes only
  useEffect(() => {
    if (!isBackgroundRefresh) {
      setIsSorting(true);
      // Use a shorter timeout for better UX
      const timer = setTimeout(() => setIsSorting(false), 100);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, statusFilter, categoryFilter, sortBy, isBackgroundRefresh]);

  // Pagination logic
  const totalItems = filteredSuggestions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuggestions = filteredSuggestions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleRefresh = async (isBackgroundRefresh = false) => {
    if (!onRefresh) return;
    
    if (isBackgroundRefresh) {
      setIsPolling(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      await onRefresh();
    } finally {
      if (isBackgroundRefresh) {
        setIsPolling(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Note: Polling is now handled by the parent component

  const handleUpdate = async (id: string, status: string, adminNotes?: string) => {
    if (!onUpdate) return;
    
    try {
      await onUpdate(id, status, adminNotes);
      await handleRefresh();
      // Notify parent component about status change for dashboard refresh
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(id);
      await handleRefresh();
    } catch (error) {
      console.error('Error deleting suggestion:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            {isLoadingCategories ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                Loading categories...
              </div>
            ) : (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={(category as any)._id.toString()} value={(category as any)._id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items per page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="most-liked">Most Liked</option>
              <option value="least-liked">Least Liked</option>
            </select>
          </div>

        </div>
      </div>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-700">
            <span>Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} suggestions</span>
            {isBackgroundRefresh && (
              <span className="ml-2 inline-flex items-center text-[#4bdcf5]">
                <span className="animate-spin rounded-full h-3 w-3 border-b border-[#4bdcf5] mr-1"></span>
                Updating...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="relative space-y-4">
        {isLoading ? (
          // Show skeleton loaders when initially loading
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <SuggestionSkeleton key={index} />
            ))}
          </>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No suggestions have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            {currentSuggestions.map((suggestion) => (
              <SuggestionCard
                key={(suggestion as any)._id.toString()}
                suggestion={suggestion}
                isAdmin={isAdmin}
                onUpdate={isAdmin ? handleUpdate : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
              />
            ))}
            
            {/* Loading Overlay */}
            {isSorting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#4bdcf5]/10 rounded-full mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4bdcf5]"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sorting suggestions...</h3>
                  <p className="text-gray-500">Please wait while we organize your suggestions</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    page === currentPage
                      ? 'bg-[#4bdcf5] text-white border-[#4bdcf5] shadow-md'
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to compare suggestions efficiently
const compareSuggestions = (prev: any[], next: any[]) => {
  if (prev.length !== next.length) return false;
  
  for (let i = 0; i < prev.length; i++) {
    const prevSuggestion = prev[i];
    const nextSuggestion = next[i];
    
    if (
      (prevSuggestion as any)._id?.toString() !== (nextSuggestion as any)._id?.toString() ||
      prevSuggestion.title !== nextSuggestion.title ||
      prevSuggestion.content !== nextSuggestion.content ||
      prevSuggestion.status !== nextSuggestion.status ||
      (prevSuggestion as any).upvoteCount !== (nextSuggestion as any).upvoteCount ||
      prevSuggestion.updatedAt?.toString() !== nextSuggestion.updatedAt?.toString()
    ) {
      return false;
    }
  }
  
  return true;
};

// Memoize the component to prevent unnecessary rerenders
export default memo(SuggestionList, (prevProps, nextProps) => {
  // Custom comparison function
  const suggestionsEqual = compareSuggestions(prevProps.suggestions, nextProps.suggestions);
  const otherPropsEqual = 
    prevProps.isBackgroundRefresh === nextProps.isBackgroundRefresh &&
    prevProps.isLoading === nextProps.isLoading;
  
  const shouldSkipRender = suggestionsEqual && otherPropsEqual;
  
  console.log('SuggestionList: Memo comparison', {
    suggestionsEqual,
    otherPropsEqual,
    shouldSkipRender,
    prevCount: prevProps.suggestions.length,
    nextCount: nextProps.suggestions.length,
    prevBackground: prevProps.isBackgroundRefresh,
    nextBackground: nextProps.isBackgroundRefresh
  });
  
  // Only rerender if suggestions actually changed or other props changed
  return shouldSkipRender;
});
