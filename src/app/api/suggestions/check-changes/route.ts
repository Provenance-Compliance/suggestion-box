import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Suggestion from '@/lib/models/Suggestion';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the count and most recent suggestion
    const [count, mostRecent] = await Promise.all([
      Suggestion.countDocuments(),
      Suggestion.findOne().sort({ createdAt: -1 }).select('_id createdAt')
    ]);

    return NextResponse.json({
      count,
      mostRecentId: mostRecent?._id?.toString() || null,
      mostRecentCreatedAt: mostRecent?.createdAt || null
    });

  } catch (error) {
    console.error('Error checking suggestion changes:', error);
    return NextResponse.json(
      { error: 'Failed to check changes' },
      { status: 500 }
    );
  }
}
