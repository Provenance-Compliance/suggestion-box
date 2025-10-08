import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/mongodb';
import Upvote from '@/lib/models/Upvote';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const suggestionId = params.id;

    // Find the user in the database to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has already upvoted this suggestion
    const existingUpvote = await Upvote.findOne({
      suggestion: suggestionId,
      user: user._id,
    });

    if (existingUpvote) {
      return NextResponse.json(
        { error: 'Already upvoted' },
        { status: 400 }
      );
    }

    // Create new upvote
    const upvote = await Upvote.create({
      suggestion: suggestionId,
      user: user._id,
    });

    // Get updated upvote count
    const upvoteCount = await Upvote.countDocuments({
      suggestion: suggestionId,
    });

    return NextResponse.json({
      success: true,
      upvoteCount,
    });
  } catch (error) {
    console.error('Error upvoting suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const suggestionId = params.id;

    // Find the user in the database to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove upvote
    const result = await Upvote.deleteOne({
      suggestion: suggestionId,
      user: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Upvote not found' },
        { status: 404 }
      );
    }

    // Get updated upvote count
    const upvoteCount = await Upvote.countDocuments({
      suggestion: suggestionId,
    });

    return NextResponse.json({
      success: true,
      upvoteCount,
    });
  } catch (error) {
    console.error('Error removing upvote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const suggestionId = params.id;

    // Find the user in the database to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get upvote count
    const upvoteCount = await Upvote.countDocuments({
      suggestion: suggestionId,
    });

    // Check if current user has upvoted
    const hasUpvoted = await Upvote.findOne({
      suggestion: suggestionId,
      user: user._id,
    });

    return NextResponse.json({
      upvoteCount,
      hasUpvoted: !!hasUpvoted,
    });
  } catch (error) {
    console.error('Error fetching upvote data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
