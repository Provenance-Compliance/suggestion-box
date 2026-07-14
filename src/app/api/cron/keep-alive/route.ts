import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    await mongoose.connection.db!.admin().command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Keep-alive failed:', error);
    return NextResponse.json({ error: 'Keep-alive failed' }, { status: 500 });
  }
}
