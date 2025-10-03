"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const popularTags = [
  'AI',
  'Machine Learning',
  'Web开发',
  '移动开发',
  '数据科学',
  '设计',
  '营销',
  '自动化',
  '生产力',
  '开源'
]

export function TagFilter() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  const clearAll = () => {
    setSelectedTags([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">标签筛选</h3>
        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            清除全部
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag) => (
          <Button
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">已选择的标签:</span>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}