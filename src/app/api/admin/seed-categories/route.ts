import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import { authOptions } from '@/lib/auth';

const defaultCategories = [
  {
    name: 'General',
    description: 'General suggestions and feedback',
    color: '#6B7280',
    isActive: true,
  },
  {
    name: 'Feature Request',
    description: 'New features and functionality requests',
    color: '#3B82F6',
    isActive: true,
  },
  {
    name: 'Bug Report',
    description: 'Issues and bugs that need to be fixed',
    color: '#EF4444',
    isActive: true,
  },
  {
    name: 'Improvement',
    description: 'Improvements to existing features',
    color: '#10B981',
    isActive: true,
  },
  {
    name: 'UI/UX',
    description: 'User interface and experience improvements',
    color: '#8B5CF6',
    isActive: true,
  },
  {
    name: 'Performance',
    description: 'Performance and optimization suggestions',
    color: '#F59E0B',
    isActive: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if categories already exist
    const existingCategories = await Category.find();
    if (existingCategories.length > 0) {
      return NextResponse.json(
        { error: 'Categories already exist. Delete existing categories first if you want to reseed.' },
        { status: 409 }
      );
    }

    // Create default categories
    const categories = await Category.insertMany(defaultCategories);

    return NextResponse.json(
      { 
        message: 'Default categories created successfully', 
        categories: categories.length 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
