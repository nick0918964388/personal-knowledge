export interface Memory {
  id: string;
  content: string;
  category: 'event' | 'decision' | 'preference' | 'todo' | 'learning';
  timestamp: string;
  score?: number;
}

export interface SearchResult extends Memory {
  similarity: number;
}

export const CATEGORIES = [
  { value: 'event', label: '事件', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'decision', label: '決策', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'preference', label: '偏好', color: 'bg-green-500/20 text-green-400' },
  { value: 'todo', label: '待辦', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'learning', label: '學習', color: 'bg-cyan-500/20 text-cyan-400' },
] as const;

export type CategoryValue = typeof CATEGORIES[number]['value'];
