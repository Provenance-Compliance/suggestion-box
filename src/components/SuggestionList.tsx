'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SuggestionCard from './SuggestionCard';
import { ISuggestion } from '@/lib/models/Suggestion';
import { ICategory } from '@/lib/models/Category';
import { Filter, Search, RefreshCw } from 'lucide-react';

interface SuggestionListProps {
  suggestions: (ISuggestion & { 
    submittedBy?: { name: string; email: string };
    category?: { name: string; color: string };
  })[];
  onRefresh?: () => void;
  onUpdate?: (id: string, status: string, adminNotes?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onStatusChange?: () => void;
}

export default function SuggestionList({ 
  suggestions, 
  onRefresh, 
  onUpdate, 
  onDelete,
  onStatusChange
}: SuggestionListProps) {
  const { data: session } = useSession();
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchCategories();
  }, []);

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

  useEffect(() => {
    let filtered = suggestions;

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
        if (!suggestion.category) return false;
        
        // Handle both ObjectId and populated category object
        if (typeof suggestion.category === 'object' && suggestion.category._id) {
          return suggestion.category._id.toString() === categoryFilter;
        } else {
          return suggestion.category.toString() === categoryFilter;
        }
      });
    }


    setFilteredSuggestions(filtered);
  }, [suggestions, searchTerm, statusFilter, categoryFilter]);

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

  // Set up polling for suggestions
  useEffect(() => {
    if (session && onRefresh) {
      // Set up polling every 10 seconds
      const interval = setInterval(() => {
        handleRefresh(true);
      }, 10000);
      
      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [session, onRefresh]);

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Suggestions ({filteredSuggestions.length})
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRefresh()}
              disabled={isRefreshing || isPolling}
              className="p-2 text-gray-400 hover:text-[#4bdcf5] transition-colors disabled:opacity-50"
              title={isPolling ? "Auto-refreshing..." : "Refresh suggestions"}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isPolling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

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
                  <option key={category._id.toString()} value={category._id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
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
          filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={(suggestion as any)._id.toString()}
              suggestion={suggestion}
              isAdmin={isAdmin}
              onUpdate={isAdmin ? handleUpdate : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
