const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.1.161:11434';
const COLLECTION_NAME = 'memories';
const EMBEDDING_MODEL = 'mxbai-embed-large';
const EMBEDDING_DIM = 1024;

export interface Memory {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  score?: number;
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000)
    })
  });
  
  if (!res.ok) throw new Error(`Ollama embedding failed: ${res.status}`);
  const data = await res.json();
  return data.embeddings?.[0] || data.embedding;
}

async function ensureCollection() {
  // Check if collection exists
  const checkRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  if (checkRes.ok) return;
  
  // Create collection
  await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: {
        size: EMBEDDING_DIM,
        distance: 'Cosine'
      }
    })
  });
}

export async function listMemories(category?: string): Promise<Memory[]> {
  await ensureCollection();
  
  const body: Record<string, unknown> = {
    limit: 100,
    with_payload: true
  };
  
  if (category) {
    body.filter = {
      must: [{ 
        key: 'category', 
        match: { value: category } 
      }]
    };
  }
  
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.result?.points || [])
    .map((p: any) => ({
      id: String(p.id),
      content: p.payload?.content || '',
      category: p.payload?.category || 'event',
      timestamp: p.payload?.timestamp || new Date().toISOString()
    }))
    .sort((a: Memory, b: Memory) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export async function searchMemories(query: string, limit = 10): Promise<Memory[]> {
  await ensureCollection();
  
  const embedding = await getEmbedding(query);
  
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vector: embedding,
      limit,
      with_payload: true
    })
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.result || []).map((r: any) => ({
    id: String(r.id),
    content: r.payload?.content || '',
    category: r.payload?.category || 'event',
    timestamp: r.payload?.timestamp || new Date().toISOString(),
    score: r.score
  }));
}

export async function addMemory(content: string, category: string): Promise<Memory> {
  await ensureCollection();
  
  const id = Date.now();
  const timestamp = new Date().toISOString();
  const embedding = await getEmbedding(content);
  
  await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [{
        id,
        vector: embedding,
        payload: { content, category, timestamp }
      }]
    })
  });
  
  return { id: String(id), content, category, timestamp };
}

export async function deleteMemory(id: string): Promise<boolean> {
  await ensureCollection();
  
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [parseInt(id)]
    })
  });
  
  return res.ok;
}

export async function getStats() {
  await ensureCollection();
  
  const memories = await listMemories();
  const byCategory: Record<string, number> = {};
  
  for (const m of memories) {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  }
  
  return { total: memories.length, byCategory };
}
