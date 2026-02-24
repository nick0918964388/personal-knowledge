import { execSync } from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.join(process.env.HOME || '', 'clawd/skills/vector-memory/scripts');
const AGENT = 'brainstorm';

export interface ZvecMemory {
  id: string;
  content: string;
  category: string;
  timestamp: string;
  score?: number;
}

export interface ZvecStats {
  total: number;
  byCategory: Record<string, number>;
}

export async function listMemories(category?: string): Promise<ZvecMemory[]> {
  try {
    // Read all memories from the data directory
    const dataDir = path.join(process.env.HOME || '', `clawd/data/zvec-memory/${AGENT}`);
    const fs = await import('fs');
    
    if (!fs.existsSync(dataDir)) {
      return [];
    }
    
    const files = fs.readdirSync(dataDir).filter((f: string) => f.endsWith('.json'));
    const memories: ZvecMemory[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(content);
        
        if (category && data.category !== category) continue;
        
        memories.push({
          id: file.replace('.json', ''),
          content: data.content || data.text || '',
          category: data.category || 'event',
          timestamp: data.timestamp || new Date().toISOString(),
          score: data.score,
        });
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }
    
    // Sort by timestamp descending
    return memories.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('listMemories error:', error);
    return [];
  }
}

export async function searchMemories(query: string, limit = 10): Promise<ZvecMemory[]> {
  try {
    const scriptPath = path.join(SCRIPTS_DIR, 'search-memory.js');
    const result = execSync(
      `node "${scriptPath}" "${query.replace(/"/g, '\\"')}" ${limit} --agent ${AGENT} --json`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    const lines = result.trim().split('\n');
    const memories: ZvecMemory[] = [];
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        memories.push({
          id: data.id || String(Date.now()),
          content: data.content || data.text || '',
          category: data.category || 'event',
          timestamp: data.timestamp || new Date().toISOString(),
          score: data.similarity || data.score,
        });
      } catch {
        // Skip non-JSON lines
      }
    }
    
    return memories;
  } catch (error) {
    console.error('searchMemories error:', error);
    // Fallback: filter local memories
    const all = await listMemories();
    const q = query.toLowerCase();
    return all.filter(m => m.content.toLowerCase().includes(q)).slice(0, limit);
  }
}

export async function addMemory(content: string, category: string): Promise<ZvecMemory> {
  try {
    const scriptPath = path.join(SCRIPTS_DIR, 'add-memory.js');
    execSync(
      `node "${scriptPath}" "${content.replace(/"/g, '\\"')}" --agent ${AGENT} --category ${category}`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    return {
      id: Date.now().toString(),
      content,
      category,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('addMemory error:', error);
    throw error;
  }
}

export async function deleteMemory(id: string): Promise<boolean> {
  try {
    const dataDir = path.join(process.env.HOME || '', `clawd/data/zvec-memory/${AGENT}`);
    const fs = await import('fs');
    const filePath = path.join(dataDir, `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('deleteMemory error:', error);
    return false;
  }
}

export async function getStats(): Promise<ZvecStats> {
  try {
    const memories = await listMemories();
    const byCategory: Record<string, number> = {};
    
    for (const m of memories) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }
    
    return {
      total: memories.length,
      byCategory,
    };
  } catch (error) {
    console.error('getStats error:', error);
    return { total: 0, byCategory: {} };
  }
}
