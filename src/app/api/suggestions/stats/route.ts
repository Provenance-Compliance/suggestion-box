import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/mongodb';
import Suggestion from '@/lib/models/Suggestion';
import { authOptions } from '@/lib/auth';

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

    // Get counts for each status
    const stats = await Suggestion.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statusCounts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      inProgress: 0,
      completed: 0,
    };

    stats.forEach(stat => {
      // Map database status values to response object keys
      const statusKey = stat._id === 'in-progress' ? 'inProgress' : stat._id;
      if (statusKey in statusCounts) {
        statusCounts[statusKey as keyof typeof statusCounts] = stat.count;
      }
      statusCounts.total += stat.count;
    });

    return NextResponse.json(statusCounts);
  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
