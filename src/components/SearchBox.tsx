'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBox({ onSearch, placeholder = "語義搜尋記憶..." }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <motion.div
        animate={{
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(6, 182, 212, 0.3), 0 0 20px rgba(6, 182, 212, 0.1)' 
            : '0 0 0 0px rgba(6, 182, 212, 0)'
        }}
        className="rounded-lg"
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </span>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="pl-10 h-12 font-mono text-base bg-secondary/50 border-border focus:border-cyan-500 transition-colors"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Search hint */}
      <AnimatePresence>
        {isFocused && !query && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute mt-2 text-xs text-muted-foreground font-mono"
          >
            輸入關鍵字進行語義搜尋，AI 會找出相關的記憶
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
