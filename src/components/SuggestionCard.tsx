'use client';

import { useState } from 'react';
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
  X
} from 'lucide-react';

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
  'in-progress': { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'In Progress' },
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

  const StatusIcon = statusConfig[suggestion.status].icon;

  const handleUpdate = async () => {
    if (!onUpdate) return;
    
    setIsUpdating(true);
    try {
      await onUpdate((suggestion as any)._id.toString(), editStatus, editNotes);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating suggestion:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this suggestion?')) return;
    
    try {
      await onDelete((suggestion as any)._id.toString());
    } catch (error) {
      console.error('Error deleting suggestion:', error);
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!onUpdate) return;
    
    try {
      await onUpdate((suggestion as any)._id.toString(), newStatus);
    } catch (error) {
      console.error('Error updating suggestion status:', error);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {suggestion.title}
          </h3>
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
                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    title="Approve suggestion"
                  >
                    Approve
                  </button>
                )}
                {suggestion.status === 'pending' && (
                  <button
                    onClick={() => handleQuickStatusChange('rejected')}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    title="Reject suggestion"
                  >
                    Reject
                  </button>
                )}
                {suggestion.status === 'approved' && (
                  <button
                    onClick={() => handleQuickStatusChange('in-progress')}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    title="Start working on suggestion"
                  >
                    Start Work
                  </button>
                )}
                {suggestion.status === 'in-progress' && (
                  <button
                    onClick={() => handleQuickStatusChange('completed')}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Mark as completed"
                  >
                    Complete
                  </button>
                )}
                
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
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
          <Clock className="h-4 w-4 mr-1" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Add admin notes..."
                />
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
    </div>
  );
}
