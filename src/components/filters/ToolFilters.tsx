'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { SearchSuggestions, type SearchSuggestion } from '@/components/ui/search-suggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

interface ToolFiltersProps {
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
}

export function ToolFilters({ categories, tags }: ToolFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 使用搜索建议Hook
  const { suggestions, isLoading: isSuggestionsLoading } = useSearchSuggestions(searchValue);

  const currentCategory = searchParams.get('category');
  const currentTag = searchParams.get('tag');
  const currentRuntime = searchParams.get('runtime');
  const currentSort = searchParams.get('sort') || 'latest';
  const currentOrder = searchParams.get('order') || 'desc';

  const updateURL = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // 重置到第一页
    params.delete('page');
    
    router.push(`/tools?${params.toString()}`);
  }, [router, searchParams]);

  const handleSearch = () => {
    updateURL({ q: searchValue || null });
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchValue(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'tool':
        setSearchValue(suggestion.name);
        updateURL({ q: suggestion.name });
        break;
      case 'category':
        updateURL({ category: suggestion.slug });
        break;
      case 'tag':
        updateURL({ tag: suggestion.slug });
        break;
    }
    setShowSuggestions(false);
  };

  const handleCategoryChange = (value: string) => {
    updateURL({ category: value || null });
  };

  const handleTagChange = (value: string) => {
    updateURL({ tag: value || null });
  };

  const handleRuntimeChange = (value: string) => {
    updateURL({ runtime: value || null });
  };

  const handleSortChange = (value: string) => {
    updateURL({ sort: value });
  };

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setShowSuggestions(false);
    router.push('/tools');
  }, [router]);

  // 点击外部关闭搜索建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeFilters = [
    currentCategory && { type: 'category', value: currentCategory, label: `分类: ${currentCategory}` },
    currentTag && { type: 'tag', value: currentTag, label: `标签: ${currentTag}` },
    currentRuntime && { type: 'runtime', value: currentRuntime, label: `运行时: ${currentRuntime}` },
  ].filter((filter): filter is { type: string; value: string; label: string } => Boolean(filter));

  const runtimeOptions = [
    { value: 'node', label: 'Node.js', icon: '🟢' },
    { value: 'edge', label: 'Edge Runtime', icon: '🔵' },
    { value: 'browser', label: 'Browser', icon: '🟣' },
  ];

  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'name', label: '名称排序' },
    { value: 'updated', label: '最近更新' },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="relative" ref={searchInputRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="搜索工具名称或描述..."
          value={searchValue}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
              setShowSuggestions(false);
            }
          }}
          className="pl-10 pr-4 py-2 w-full"
        />
        {showSuggestions && (
          <div ref={suggestionsRef}>
            <SearchSuggestions
              suggestions={suggestions}
              isLoading={isSuggestionsLoading}
              onSelect={handleSuggestionSelect}
            />
          </div>
        )}
      </div>

      {/* 筛选控制栏 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sm:hidden md:inline">筛选器</span>
            <span className="hidden sm:inline md:hidden">筛选</span>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
          
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <X className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">清除筛选</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Sparkles className="h-4 w-4 text-gray-400 hidden lg:block" />
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[160px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 筛选面板 */}
      {isFilterOpen && (
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">分类</label>
              <Select value={currentCategory || ''} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">标签</label>
              <Select value={currentTag || ''} onValueChange={handleTagChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部标签</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.slug} value={tag.slug}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">运行时</label>
              <Select value={currentRuntime || ''} onValueChange={handleRuntimeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择运行时" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部运行时</SelectItem>
                  {runtimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选器标签 */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 cursor-pointer"
              onClick={() => {
                updateURL({ [filter.type]: null });
              }}
            >
              {filter.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}