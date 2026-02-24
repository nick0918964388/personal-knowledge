import { NextRequest, NextResponse } from 'next/server';
import { searchMemories } from '@/lib/qdrant';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }
  
  try {
    const results = await searchMemories(query, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
