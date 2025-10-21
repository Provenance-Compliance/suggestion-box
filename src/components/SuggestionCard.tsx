'use client';

import { useState, useEffect } from 'react';
import { ISuggestion } from '@/lib/models/Suggestion';
import { 
  Clock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit3,
  Trash2,
  Save,
  X,
  ThumbsUp
} from 'lucide-react';
import CommentSection, { CommentButton } from './CommentSection';
import CharacterCounter from './CharacterCounter';

interface SuggestionCardProps {
  suggestion: ISuggestion & { 
    submittedBy?: { name: string; email: string };
    category?: { name: string; color: string };
  };
  isAdmin?: boolean;
  onUpdate?: (id: string, status: string, adminNotes?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  'in-progress': { color: 'bg-[#4bdcf5]/10 text-[#4bdcf5]', icon: AlertCircle, label: 'In Progress' },
  completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Completed' },
};



export default function SuggestionCard({ 
  suggestion, 
  isAdmin = false, 
  onUpdate, 
  onDelete 
}: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(suggestion.status);
  const [editNotes, setEditNotes] = useState(suggestion.adminNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState((suggestion as any).upvoteCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const StatusIcon = statusConfig[suggestion.status].icon;

  const handleUpdate = async () => {
    if (!onUpdate) return;
    
    setIsUpdating(true);
    try {
      await onUpdate((suggestion as any)._id.toString(), editStatus, editNotes);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating suggestion:', error);
      // Handle specific error cases
      if (error.message?.includes('not found') || error.message?.includes('deleted')) {
        console.error('Suggestion was deleted by another user');
        // Could show a toast notification here
      }
    } finally {
      setIsUpdating(false);
    }
  };

    const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this suggestion?')) return;
    
    try {
      await onDelete((suggestion as any)._id.toString());
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      // Handle specific error cases
      if (error.message?.includes('not found') || error.message?.includes('already deleted')) {
        console.error('Suggestion was already deleted by another user');
        // Could show a toast notification here
      }
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!onUpdate) return;
    
    try {
      await onUpdate((suggestion as any)._id.toString(), newStatus);
    } catch (error: any) {
      console.error('Error updating suggestion status:', error);
      // Handle specific error cases
      if (error.message?.includes('not found') || error.message?.includes('deleted')) {
        console.error('Suggestion was deleted by another user');
        // Could show a toast notification here
      }
    }
  };

  // Fetch upvote data on component mount
  useEffect(() => {
    const fetchUpvoteData = async () => {
      try {
        const response = await fetch(`/api/suggestions/${(suggestion as any)._id}/upvote`);
        if (response.ok) {
          const data = await response.json();
          setUpvoteCount(data.upvoteCount);
          setHasUpvoted(data.hasUpvoted);
        }
      } catch (error) {
        console.error('Error fetching upvote data:', error);
      }
    };

    fetchUpvoteData();
  }, [(suggestion as any)._id]);

  // Handle comment count updates from CommentSection
  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
  };

  const handleUpvote = async () => {
    if (isUpvoting) return;
    
    setIsUpvoting(true);
    try {
      const method = hasUpvoted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/suggestions/${(suggestion as any)._id}/upvote`, {
        method,
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpvoteCount(data.upvoteCount);
        setHasUpvoted(!hasUpvoted);
      } else {
        const errorData = await response.json();
        console.error('Upvote error:', errorData.error);
        // Handle specific error cases
        if (response.status === 404) {
          console.error('Suggestion not found - may have been deleted');
        } else if (response.status === 400) {
          console.error('Already upvoted or invalid request');
        }
      }
    } catch (error) {
      console.error('Error upvoting suggestion:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {suggestion.title}
            </h3>
            
          </div>
          <p className="text-gray-700 mb-4">{suggestion.content}</p>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2 ml-4">
            {!isEditing ? (
              <>
                {/* Quick Status Change Buttons */}
                {suggestion.status === 'pending' && (
                  <button
                    onClick={() => handleQuickStatusChange('approved')}
                    className="px-3 py-1 text-sm font-bold text-[#4bdcf5] bg-[#4bdcf5]/10 hover:bg-[#4bdcf5] hover:text-white rounded-md transition-colors"
                    title="Approve suggestion"
                  >
                    Approve
                  </button>
                )}
                {suggestion.status === 'pending' && (
                  <button
                    onClick={() => handleQuickStatusChange('rejected')}
                    className="px-3 py-1 text-sm font-bold text-[#472d72] bg-[#472d72]/10 hover:bg-[#472d72] hover:text-white rounded-md transition-colors"
                    title="Reject suggestion"
                  >
                    Reject
                  </button>
                )}
                {suggestion.status === 'approved' && (
                  <button
                    onClick={() => handleQuickStatusChange('in-progress')}
                    className="px-3 py-1 text-xs font-bold text-[#4bdcf5] bg-[#4bdcf5]/10 hover:bg-[#4bdcf5]/20 rounded-md transition-colors"
                    title="Start working on suggestion"
                  >
                    Start Work
                  </button>
                )}
                {suggestion.status === 'in-progress' && (
                  <button
                    onClick={() => handleQuickStatusChange('completed')}
                    className="px-3 py-1 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Mark as completed"
                  >
                    Complete
                  </button>
                )}
                
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-[#4bdcf5] transition-colors"
                  title="Edit suggestion"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete suggestion"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="p-2 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                  title="Save changes"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditStatus(suggestion.status);
                    setEditNotes(suggestion.adminNotes || '');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[suggestion.status].color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig[suggestion.status].label}
        </span>
        
        
        {suggestion.category && (
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: suggestion.category.color }}
          >
            {suggestion.category.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          {suggestion.isAnonymous ? (
            <div className="flex items-center">
              <EyeOff className="h-4 w-4 mr-1" />
              <span>Anonymous</span>
            </div>
          ) : (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{suggestion.submittedBy?.name || 'Unknown User'}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <span>{formatDate(suggestion.createdAt)}</span>
        </div>
      </div>

      {isAdmin && (
        <div className="border-t pt-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900"
                  placeholder="Add admin notes..."
                />
                <div className="mt-1 flex justify-end">
                  <CharacterCounter current={editNotes.length} max={1000} />
                </div>
              </div>
            </div>
          ) : (
            suggestion.adminNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {suggestion.adminNotes}
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mb-4">
        {/* Upvote Button */}
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
            hasUpvoted
              ? 'bg-[#4bdcf5] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isUpvoting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={hasUpvoted ? 'Remove upvote' : 'Upvote this suggestion'}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">{upvoteCount}</span>
        </button>

        {/* Comments Button */}
        <CommentButton 
          commentCount={commentCount}
          showComments={showComments}
          onToggle={() => setShowComments(!showComments)}
        />
      </div>

      {/* Comments Section */}
      <CommentSection 
        suggestionId={suggestion._id?.toString() || ''} 
        isAdmin={isAdmin}
        showComments={showComments}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}
