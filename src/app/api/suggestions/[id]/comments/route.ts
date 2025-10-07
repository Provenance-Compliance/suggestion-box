import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000, 'Comment too long'),
  isInternal: z.boolean().default(false),
});

// GET - Fetch comments for a suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const isAdmin = session.user.role === 'admin';

    // Build query - admins can see all comments, users only see public ones
    const query: any = { suggestion: id };
    if (!isAdmin) {
      query.isInternal = false;
    }

    const comments = await Comment.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: 1 }); // Oldest first for conversation flow

    // Filter out author data for anonymous suggestions if needed
    const filteredComments = comments.map(comment => {
      const commentObj = comment.toObject();
      // Note: We don't filter author data here since comments are always attributed
      return commentObj;
    });

    return NextResponse.json({ comments: filteredComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, isInternal } = commentSchema.parse(body);

    await connectDB();

    const { id } = await params;

    // Find the user in the database to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = await Comment.create({
      suggestion: id,
      author: user._id,
      content,
      isInternal,
    });

    // Populate the author data for the response
    await comment.populate('author', 'name email');

    return NextResponse.json(
      { message: 'Comment created successfully', comment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Find the user to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or the comment author
    const isAdmin = session.user.role === 'admin';
    const isAuthor = comment.author.toString() === user._id.toString();

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
