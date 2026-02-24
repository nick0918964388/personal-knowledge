import { NextRequest, NextResponse } from 'next/server';
import { listMemories, addMemory } from '@/lib/qdrant';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  
  try {
    const memories = await listMemories(category);
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('GET /api/memories error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, category } = body;
    
    if (!content || !category) {
      return NextResponse.json({ error: 'Missing content or category' }, { status: 400 });
    }
    
    const memory = await addMemory(content, category);
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('POST /api/memories error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
