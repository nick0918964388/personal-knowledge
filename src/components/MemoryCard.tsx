'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Memory, CATEGORIES } from '@/types/memory';

interface MemoryCardProps {
  memory: Memory;
  index: number;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: string) => void;
}

export function MemoryCard({ memory, index, onEdit, onDelete }: MemoryCardProps) {
  const category = CATEGORIES.find(c => c.value === memory.category);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="group hover:border-cyan-500/50 transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={category?.color}>
                  {category?.label}
                </Badge>
                {memory.score !== undefined && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {(memory.score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              
              {/* Content */}
              <p className="text-sm text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap">
                {memory.content}
              </p>
              
              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                {new Date(memory.timestamp).toLocaleString('zh-TW')}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-cyan-400"
                onClick={() => onEdit?.(memory)}
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                onClick={() => onDelete?.(memory.id)}
              >
                🗑️
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
