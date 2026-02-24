'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Memory, CATEGORIES } from '@/types/memory';
import { cn } from '@/lib/utils';

// Highlight component for search results
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }
  
  // Split query into words and create regex
  const words = query.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return <>{text}</>;
  
  // Escape special regex characters
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  
  const parts = text.split(pattern);
  
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = words.some(w => part.toLowerCase() === w.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-yellow-500/40 text-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

// Highlighted Markdown - use custom components to highlight text nodes
function HighlightedMarkdown({ content, query }: { content: string; query: string }) {
  const highlightTextNode = useCallback((text: string) => {
    if (!query.trim()) return text;
    
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return text;
    
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(pattern);
    
    return parts.map((part, i) => {
      const isMatch = words.some(w => part.toLowerCase() === w.toLowerCase());
      return isMatch ? (
        <mark key={i} className="bg-yellow-500/40 text-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  }, [query]);
  
  // Custom components to highlight text in various elements
  const components = useMemo(() => ({
    p: ({ children, ...props }: any) => <p {...props}>{processChildren(children, highlightTextNode)}</p>,
    li: ({ children, ...props }: any) => <li {...props}>{processChildren(children, highlightTextNode)}</li>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{processChildren(children, highlightTextNode)}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{processChildren(children, highlightTextNode)}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{processChildren(children, highlightTextNode)}</h3>,
    td: ({ children, ...props }: any) => <td {...props}>{processChildren(children, highlightTextNode)}</td>,
    th: ({ children, ...props }: any) => <th {...props}>{processChildren(children, highlightTextNode)}</th>,
    strong: ({ children, ...props }: any) => <strong {...props}>{processChildren(children, highlightTextNode)}</strong>,
    em: ({ children, ...props }: any) => <em {...props}>{processChildren(children, highlightTextNode)}</em>,
  }), [highlightTextNode]);
  
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}

// Helper to process children and highlight text nodes
function processChildren(children: React.ReactNode, highlightFn: (text: string) => React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    return highlightFn(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => 
      typeof child === 'string' ? <span key={i}>{highlightFn(child)}</span> : child
    );
  }
  return children;
}

export default function HomePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number> } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; memory: Memory | null; expanded: boolean }>({ open: false, memory: null, expanded: false });

  // Fetch memories
  const fetchMemories = useCallback(async (category?: string | null) => {
    setLoading(true);
    try {
      const params = category ? `?category=${category}` : '';
      const res = await fetch(`/knowledge/api/memories${params}`);
      const data = await res.json();
      let filteredMemories = data.memories || [];
      
      // Client-side filter as backup
      if (category && filteredMemories.length > 0) {
        filteredMemories = filteredMemories.filter((m: Memory) => m.category === category);
      }
      
      setMemories(filteredMemories);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/knowledge/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMemories(activeCategory);
    fetchStats();
  }, [fetchMemories, fetchStats, activeCategory]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/knowledge/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        let results = data.results || [];
        
        // Apply category filter to search results
        if (activeCategory) {
          results = results.filter((m: Memory) => m.category === activeCategory);
        }
        
        setMemories(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory]);

  // Reset search when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMemories(activeCategory);
    }
  }, [searchQuery, activeCategory, fetchMemories]);

  // Delete
  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await fetch(`/knowledge/api/memories/${deleteDialog.id}`, { method: 'DELETE' });
      setDeleteDialog({ open: false, id: null });
      fetchMemories(activeCategory);
      fetchStats();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCategoryClick = (category: string | null) => {
    setActiveCategory(category);
    setSearchQuery(''); // Clear search when changing category
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  // Calculate category stats for chart
  const categoryStats = CATEGORIES.map(cat => ({
    ...cat,
    count: stats?.byCategory[cat.value] || 0
  }));
  const maxCount = Math.max(...categoryStats.map(c => c.count), 1);

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            ● 即時同步
          </span>
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">知識庫總覽</h1>
        <p className="text-muted-foreground">個人知識管理系統，語義搜尋與分類整理</p>
      </div>

      {/* Main Search - Centered */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="輸入關鍵字進行語義搜尋..."
            className="pl-12 pr-4 h-14 text-lg bg-card border-border focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          使用 AI 語義理解搜尋，找出相關記憶
        </p>
      </div>

      {/* Filter Tabs - Centered */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeCategory === null 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          全部
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.value 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
            {stats?.byCategory[cat.value] ? (
              <span className="ml-1.5 text-xs opacity-60">({stats.byCategory[cat.value]})</span>
            ) : null}
          </button>
        ))}
        
        {/* Add Button */}
        <a
          href="/knowledge/add"
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增
        </a>
      </div>

      {/* Memory List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
            記憶明細
            <span className="text-muted-foreground font-normal">
              ({memories.length} 筆{activeCategory ? ` · ${getCategoryInfo(activeCategory).label}` : ''})
            </span>
          </h3>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="inline-block w-6 h-6 border-2 border-muted-foreground/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <p>載入中...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? '找不到相關記憶' : activeCategory ? `沒有「${getCategoryInfo(activeCategory).label}」分類的記憶` : '還沒有記憶'}
              </p>
              <a
                href="/knowledge/add"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                新增第一筆記憶
              </a>
            </div>
          ) : (
            <AnimatePresence>
              {memories.map((memory, index) => {
                const cat = getCategoryInfo(memory.category);
                const colors = {
                  event: 'border-l-blue-500',
                  decision: 'border-l-purple-500',
                  preference: 'border-l-green-500',
                  todo: 'border-l-yellow-500',
                  learning: 'border-l-cyan-500',
                };
                return (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group flex flex-col p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg border-l-4 ${colors[memory.category as keyof typeof colors] || 'border-l-blue-500'} transition-all cursor-pointer`}
                    onClick={() => setViewDialog({ open: true, memory, expanded: false })}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${cat.color}`}>
                            {cat.label}
                          </span>
                          {memory.score !== undefined && (
                            <span className="text-xs text-green-400 font-mono">
                              {(memory.score * 100).toFixed(0)}% 相似
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-2 mb-2">
                          <HighlightText text={memory.content} query={searchQuery} />
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(memory.timestamp).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ open: true, id: memory.id });
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Stats Dashboard - Now at bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 card-hover"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
            <span className="text-blue-400 text-xl">📚</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">總記憶數</p>
          <p className="text-3xl font-bold">{stats?.total || 0}<span className="text-lg text-muted-foreground ml-1">筆</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 card-hover"
        >
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
            <span className="text-green-400 text-xl">🔍</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">向量引擎</p>
          <p className="text-3xl font-bold">Qdrant</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5 card-hover"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-3">
            <span className="text-yellow-400 text-xl">⚡</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">分類數量</p>
          <p className="text-3xl font-bold">{CATEGORIES.length}<span className="text-lg text-muted-foreground ml-1">種</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 card-hover"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
            <span className="text-purple-400 text-xl">🧠</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Embedding</p>
          <p className="text-3xl font-bold">1024<span className="text-lg text-muted-foreground ml-1">維</span></p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            分類分佈
          </h3>
          
          <div className="flex items-center justify-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {categoryStats.reduce((acc, cat, index) => {
                  const total = stats?.total || 1;
                  const percent = (cat.count / total) * 100;
                  const prevPercent = acc.offset;
                  const colors = ['#58a6ff', '#3fb950', '#d29922', '#db6d28', '#a371f7'];
                  
                  if (cat.count > 0) {
                    acc.elements.push(
                      <circle
                        key={cat.value}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={colors[index]}
                        strokeWidth="12"
                        strokeDasharray={`${percent * 2.51} ${251 - percent * 2.51}`}
                        strokeDashoffset={-prevPercent * 2.51}
                        className="transition-all duration-1000"
                      />
                    );
                  }
                  acc.offset += percent;
                  return acc;
                }, { elements: [] as React.ReactElement[], offset: 0 }).elements}
                {(stats?.total || 0) === 0 && (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#30363d" strokeWidth="12" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{stats?.total || 0}</span>
                <span className="text-xs text-muted-foreground">總筆數</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {categoryStats.map((cat, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500'];
              return (
                <div key={cat.value} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[index]}`}></span>
                    <span className="text-muted-foreground">{cat.label}</span>
                  </div>
                  <span className="font-medium">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-5 md:col-span-2"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-500 rounded-full"></span>
            分類排行
          </h3>
          
          <div className="space-y-4">
            {categoryStats
              .sort((a, b) => b.count - a.count)
              .map((cat, index) => {
                const colors = {
                  event: 'bg-blue-500',
                  decision: 'bg-purple-500',
                  preference: 'bg-green-500',
                  todo: 'bg-yellow-500',
                  learning: 'bg-cyan-500',
                };
                const percent = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                return (
                  <div key={cat.value} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-muted-foreground truncate">{cat.label}</span>
                    <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full ${colors[cat.value as keyof typeof colors] || 'bg-blue-500'} rounded-md`}
                      />
                    </div>
                    <span className="w-20 text-sm text-right font-mono">{cat.count} 筆</span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">確定要刪除這筆記憶嗎？此操作無法復原。</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, id: null })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Memory Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, memory: open ? viewDialog.memory : null, expanded: open ? viewDialog.expanded : false })}>
        <DialogContent 
          className={cn(
            "bg-card border-border overflow-y-auto transition-all duration-300",
            viewDialog.expanded 
              ? "max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]" 
              : "max-w-3xl max-h-[80vh]"
          )}
          showCloseButton={false}
        >
          {/* Custom header with expand button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {viewDialog.memory && (
                <span className={`text-xs px-2 py-0.5 rounded ${getCategoryInfo(viewDialog.memory.category).color}`}>
                  {getCategoryInfo(viewDialog.memory.category).label}
                </span>
              )}
              {viewDialog.memory?.score !== undefined && (
                <span className="text-xs text-green-400 font-mono">
                  {(viewDialog.memory.score * 100).toFixed(0)}% 相似
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Expand/Collapse button - 放大/縮小圖示 */}
              <button
                onClick={() => setViewDialog({ ...viewDialog, expanded: !viewDialog.expanded })}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title={viewDialog.expanded ? "縮小" : "最大化"}
              >
                {viewDialog.expanded ? (
                  // 縮小圖示 (兩個箭頭向內)
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0h4m-4 0v-4m11-6l5-5m0 0h-4m4 0v4" />
                  </svg>
                ) : (
                  // 最大化圖示 (四角向外展開)
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              {/* Close button - X 圖示 */}
              <button
                onClick={() => setViewDialog({ open: false, memory: null, expanded: false })}
                className="p-2 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                title="關閉"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {viewDialog.memory && (
            <div className={cn(
              "prose prose-invert max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-2 [&>p]:text-foreground/90 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-3 [&>li]:mb-1.5 [&>li]:text-foreground/85 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>code]:bg-secondary [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-blue-400 [&>code]:text-sm [&>pre]:bg-secondary [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>hr]:border-border [&>hr]:my-4 [&>a]:text-blue-400 [&>a]:underline [&>a]:hover:text-blue-300 [&_mark]:bg-yellow-500/40 [&_mark]:text-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded [&>table]:w-full [&>table]:border-collapse [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-border [&>table>thead>tr>th]:p-2 [&>table>thead>tr>th]:bg-secondary/50 [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-border [&>table>tbody>tr>td]:p-2",
              viewDialog.expanded 
                ? "prose-base [&_img]:max-w-full [&_img]:max-h-[70vh] [&_img]:w-auto [&_img]:h-auto [&_img]:mx-auto" 
                : "prose-sm [&_img]:max-w-md [&_img]:max-h-64"
            )}>
              {searchQuery ? (
                <HighlightedMarkdown content={viewDialog.memory.content} query={searchQuery} />
              ) : (
                <ReactMarkdown>{viewDialog.memory.content}</ReactMarkdown>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <p className="text-xs text-muted-foreground font-mono">
              {viewDialog.memory && new Date(viewDialog.memory.timestamp).toLocaleString('zh-TW')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => {
                  if (viewDialog.memory) {
                    setViewDialog({ open: false, memory: null, expanded: false });
                    setDeleteDialog({ open: true, id: viewDialog.memory.id });
                  }
                }}
              >
                🗑️ 刪除
              </Button>
              <Button variant="ghost" onClick={() => setViewDialog({ open: false, memory: null, expanded: false })}>
                關閉
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
