import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Suggestion from '@/lib/models/Suggestion';
import Upvote from '@/lib/models/Upvote';
import { authOptions } from '@/lib/auth';

const updateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'in-progress', 'completed']).optional(),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
});

// GET - Fetch single suggestion
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
    const suggestion = await Suggestion.findById(id)
      .populate('submittedBy', 'name email')
      .populate('category', 'name color');

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Get upvote count for this suggestion
    const upvoteCount = await Upvote.countDocuments({
      suggestion: id,
    });

    // Filter out submittedBy data for anonymous suggestions
    const suggestionObj = suggestion.toObject();
    if (suggestionObj.isAnonymous) {
      delete suggestionObj.submittedBy;
    }
    suggestionObj.upvoteCount = upvoteCount;

    return NextResponse.json({ suggestion: suggestionObj });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update suggestion (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, adminNotes } = updateSchema.parse(body);

    await connectDB();

    const { id } = await params;
    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { new: true }
    ).populate('submittedBy', 'name email');

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Get upvote count for this suggestion
    const upvoteCount = await Upvote.countDocuments({
      suggestion: id,
    });

    // Filter out submittedBy data for anonymous suggestions
    const suggestionObj = suggestion.toObject();
    if (suggestionObj.isAnonymous) {
      delete suggestionObj.submittedBy;
    }
    suggestionObj.upvoteCount = upvoteCount;

    return NextResponse.json({
      message: 'Suggestion updated successfully',
      suggestion: suggestionObj,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete suggestion (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const suggestion = await Suggestion.findByIdAndDelete(id);

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Suggestion deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
