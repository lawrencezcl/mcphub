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
    updateURL({ category: value === 'all' ? null : value });
  };

  const handleTagChange = (value: string) => {
    updateURL({ tag: value === 'all' ? null : value });
  };

  const handleRuntimeChange = (value: string) => {
    updateURL({ runtime: value === 'all' ? null : value });
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
    <div className="space-y-8">
      {/* 搜索栏 */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="搜索 MCP 工具、功能或用途..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-12 pr-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-xl focus:shadow-xl"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchValue('');
                setShowSuggestions(false);
                updateURL({ q: null });
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* 搜索建议 */}
        {showSuggestions && searchValue && (
          <SearchSuggestions
            ref={suggestionsRef}
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </div>

      {/* 筛选控制栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start border-2 hover:border-blue-300 transition-colors rounded-xl"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sm:hidden md:inline">筛选器</span>
            <span className="hidden sm:inline md:hidden">筛选</span>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
          
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-1 sm:flex-none justify-center sm:justify-start rounded-xl"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">清除筛选</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Sparkles className="h-4 w-4 text-blue-500 hidden lg:block" />
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] border-2 hover:border-blue-300 rounded-xl">
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
        <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                分类
              </label>
              <Select value={currentCategory || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full border-2 hover:border-blue-300 rounded-xl bg-white/80">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                标签
              </label>
              <Select value={currentTag || 'all'} onValueChange={handleTagChange}>
                <SelectTrigger className="w-full border-2 hover:border-blue-300 rounded-xl bg-white/80">
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部标签</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.slug} value={tag.slug}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                运行时
              </label>
              <Select value={currentRuntime || 'all'} onValueChange={handleRuntimeChange}>
                <SelectTrigger className="w-full border-2 hover:border-blue-300 rounded-xl bg-white/80">
                  <SelectValue placeholder="选择运行时" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部运行时</SelectItem>
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