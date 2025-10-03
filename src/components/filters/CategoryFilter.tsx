"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const categories = [
  'AI工具',
  '开发工具',
  '设计工具',
  '生产力工具',
  '营销工具',
  '数据分析',
  '其他'
]

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">分类筛选</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      {selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">当前筛选:</span>
          <Badge variant="secondary">{selectedCategory}</Badge>
        </div>
      )}
    </div>
  )
}