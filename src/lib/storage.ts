import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || '/app/data';
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');

export interface Memory {
  id: string;
  content: string;
  category: string;
  timestamp: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEMORIES_FILE)) {
    fs.writeFileSync(MEMORIES_FILE, '[]', 'utf-8');
  }
}

function loadMemories(): Memory[] {
  ensureDataDir();
  try {
    const content = fs.readFileSync(MEMORIES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveMemories(memories: Memory[]) {
  ensureDataDir();
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2), 'utf-8');
}

export async function listMemories(category?: string): Promise<Memory[]> {
  let memories = loadMemories();
  if (category) {
    memories = memories.filter(m => m.category === category);
  }
  return memories.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function searchMemories(query: string, limit = 10): Promise<Memory[]> {
  const memories = loadMemories();
  const q = query.toLowerCase();
  return memories
    .filter(m => m.content.toLowerCase().includes(q))
    .slice(0, limit)
    .map(m => ({ ...m, score: 0.8 }));
}

export async function addMemory(content: string, category: string): Promise<Memory> {
  const memories = loadMemories();
  const memory: Memory = {
    id: Date.now().toString(),
    content,
    category,
    timestamp: new Date().toISOString(),
  };
  memories.push(memory);
  saveMemories(memories);
  return memory;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const memories = loadMemories();
  const index = memories.findIndex(m => m.id === id);
  if (index === -1) return false;
  memories.splice(index, 1);
  saveMemories(memories);
  return true;
}

export async function getStats() {
  const memories = loadMemories();
  const byCategory: Record<string, number> = {};
  for (const m of memories) {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  }
  return { total: memories.length, byCategory };
}
