'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Lock, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Comment {
  _id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    name: string;
    email: string;
  };
}

interface CommentButtonProps {
  commentCount: number;
  showComments: boolean;
  onToggle: () => void;
}

interface CommentSectionProps {
  suggestionId: string;
  isAdmin: boolean;
  showComments: boolean;
  onCommentCountChange?: (count: number) => void;
}

// Comment Button Component
export function CommentButton({ commentCount, showComments, onToggle }: CommentButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
        showComments
          ? 'bg-[#4bdcf5] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title={showComments ? 'Hide comments' : 'Show comments'}
    >
      <MessageCircle className="h-4 w-4" />
      <span className="text-sm font-medium">{commentCount}</span>
    </button>
  );
}

// Comment Section Component
export default function CommentSection({ suggestionId, isAdmin, showComments, onCommentCountChange }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Fetch comment count on component mount
  useEffect(() => {
    fetchCommentCount();
  }, [suggestionId]);

  // Notify parent when comment count changes
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(commentCount);
    }
  }, [commentCount, onCommentCountChange]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, suggestionId]);

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setCommentCount(data.comments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        setCommentCount(data.comments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAdmin) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          isInternal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setCommentCount(commentCount + 1);
        setNewComment('');
        setIsInternal(false);
      } else {
        console.error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment._id !== commentId));
        setCommentCount(commentCount - 1);
      } else {
        console.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canDeleteComment = (comment: Comment) => {
    if (!session?.user) return false;
    if (isAdmin) return true; // Admins can delete any comment
    return comment.author.email === session.user.email; // Users can delete their own comments
  };

  const publicComments = comments.filter(comment => !comment.isInternal);
  const internalComments = comments.filter(comment => comment.isInternal);

  return (
    <div>
      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comments List */}
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading comments...</div>
          ) : (
            <div className="space-y-3">
              {/* Public Comments */}
              {publicComments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}

              {/* Internal Comments (Admin Only) */}
              {isAdmin && internalComments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <Lock className="h-3 w-3 mr-1" />
                    Internal Notes
                  </div>
                  {internalComments.map((comment) => (
                    <div key={comment._id} className="bg-[#472d72]/5 border border-[#472d72]/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#472d72]">
                          {comment.author.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete comment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No comments yet. {isAdmin ? 'Be the first to respond!' : 'Check back later for updates.'}
                </div>
              )}
            </div>
          )}

          {/* Comment Form (Admin Only) */}
          {isAdmin && (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or response..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] focus:border-[#4bdcf5] text-gray-900 text-sm"
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 text-[#4bdcf5] focus:ring-[#4bdcf5] border-gray-300 rounded"
                  />
                  <label htmlFor="isInternal" className="ml-2 block text-sm text-gray-700">
                    Internal note (not visible to users)
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center px-3 py-1 bg-[#4bdcf5] text-white rounded-md hover:bg-[#3bc4e0] focus:outline-none focus:ring-2 focus:ring-[#4bdcf5] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
