import { NextRequest, NextResponse } from 'next/server';
import { deleteMemory } from '@/lib/qdrant';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteMemory(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/memories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
