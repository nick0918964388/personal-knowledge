'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES, CategoryValue } from '@/types/memory';

interface CategoryTabsProps {
  value: CategoryValue | 'all';
  onChange: (value: CategoryValue | 'all') => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as CategoryValue | 'all')}>
      <TabsList className="bg-secondary/50 p-1">
        <TabsTrigger 
          value="all" 
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono text-xs"
        >
          全部
        </TabsTrigger>
        {CATEGORIES.map((cat) => (
          <TabsTrigger
            key={cat.value}
            value={cat.value}
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono text-xs"
          >
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
