import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Suggestion from '@/lib/models/Suggestion';
import User from '@/lib/models/User';
import Upvote from '@/lib/models/Upvote';
import Category from '@/lib/models/Category';
import { authOptions } from '@/lib/auth';
import { sendSuggestionNotification } from '@/lib/email';

const suggestionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  category: z.string().min(1, 'Category is required'),
  isAnonymous: z.boolean().default(true),
});

// GET - Fetch suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const suggestions = await Suggestion.find(filter)
      .populate('submittedBy', 'name email')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get upvote counts for all suggestions
    const suggestionIds = suggestions.map(s => s._id);
    const upvoteCounts = await Upvote.aggregate([
      { $match: { suggestion: { $in: suggestionIds } } },
      { $group: { _id: '$suggestion', count: { $sum: 1 } } }
    ]);
    
    const upvoteMap = new Map();
    upvoteCounts.forEach(upvote => {
      upvoteMap.set(upvote._id.toString(), upvote.count);
    });

    // Filter out submittedBy data for anonymous suggestions and add upvote counts
    const filteredSuggestions = suggestions.map(suggestion => {
      const suggestionObj = suggestion.toObject();
      if (suggestionObj.isAnonymous) {
        delete suggestionObj.submittedBy;
      }
      suggestionObj.upvoteCount = upvoteMap.get(suggestion._id.toString()) || 0;
      return suggestionObj;
    });

    const total = await Suggestion.countDocuments(filter);

    return NextResponse.json({
      suggestions: filteredSuggestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category, isAnonymous } = suggestionSchema.parse(body);

    await connectDB();

    // Find the user in the database to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const suggestion = await Suggestion.create({
      title,
      content,
      category,
      isAnonymous,
      submittedBy: user._id,
    });

    // Send email notification to admins
    try {
      const categoryDoc = await Category.findById(category);
      const categoryName = categoryDoc?.name || 'Unknown Category';
      
      await sendSuggestionNotification({
        title: suggestion.title,
        content: suggestion.content,
        category: categoryName,
        submittedBy: user.name || user.email || 'Unknown User',
        isAnonymous,
      });
    } catch (error) {
      console.error('Error sending notification email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      { message: 'Suggestion created successfully', suggestion },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
