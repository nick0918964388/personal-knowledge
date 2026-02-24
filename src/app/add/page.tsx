'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, CategoryValue } from '@/types/memory';

export default function AddMemoryPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryValue>('learning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('請輸入記憶內容');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/knowledge/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });

      if (!res.ok) throw new Error('Failed to create memory');

      router.push('/knowledge');
    } catch (err) {
      setError('新增失敗，請稍後再試');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    event: 'border-blue-500 bg-blue-500/10 text-blue-400',
    decision: 'border-purple-500 bg-purple-500/10 text-purple-400',
    preference: 'border-green-500 bg-green-500/10 text-green-400',
    todo: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    learning: 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <a href="/knowledge" className="hover:text-foreground transition-colors">Knowledge Base</a>
          <span>/</span>
          <span className="text-foreground">新增記憶</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">新增記憶</h1>
        <p className="text-muted-foreground">記錄重要資訊，自動向量化存入知識庫</p>
      </div>

      <div className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                選擇分類
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-center
                      ${category === cat.value 
                        ? categoryColors[cat.value as keyof typeof categoryColors]
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-muted-foreground'
                      }
                    `}
                  >
                    <span className="text-2xl mb-2 block">
                      {cat.value === 'event' && '📅'}
                      {cat.value === 'decision' && '⚡'}
                      {cat.value === 'preference' && '❤️'}
                      {cat.value === 'todo' && '✅'}
                      {cat.value === 'learning' && '📚'}
                    </span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                記憶內容
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="輸入你想記住的內容...&#10;&#10;支援多行文字，會自動進行語義向量化"
                className="min-h-[200px] text-base leading-relaxed resize-none bg-secondary/30 border-border focus-visible:ring-1 focus-visible:ring-blue-500/50 p-4"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>將使用 Ollama mxbai-embed-large 進行向量化</span>
                <span className="font-mono">{content.length} 字元</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    處理中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    儲存記憶
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔍</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">語義搜尋</h4>
                <p className="text-sm text-muted-foreground">
                  儲存後可使用自然語言搜尋，AI 會找出語義相關的記憶
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">向量資料庫</h4>
                <p className="text-sm text-muted-foreground">
                  使用 Qdrant 向量資料庫，搜尋速度極快
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
