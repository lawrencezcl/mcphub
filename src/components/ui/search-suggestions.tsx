'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Search, Tag, Folder, Sparkles } from 'lucide-react';

interface SearchSuggestion {
  type: 'tool' | 'category' | 'tag';
  id: string;
  name: string;
  description?: string;
  slug: string;
  count?: number;
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClose?: () => void;
  className?: string;
}

const SearchSuggestions = forwardRef<HTMLDivElement, SearchSuggestionsProps>(
  ({ suggestions, isLoading, onSelect, onClose, className }, ref) => {
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg",
            className
          )}
        >
          <div className="p-3">
            <div className="flex items-center space-x-2 text-gray-500">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span className="text-sm">搜索中...</span>
            </div>
          </div>
        </div>
      );
    }

    if (suggestions.length === 0) {
      return null;
    }

    const getIcon = (type: string) => {
      switch (type) {
        case 'tool':
          return <Search className="h-4 w-4 text-blue-500" />;
        case 'category':
          return <Folder className="h-4 w-4 text-green-500" />;
        case 'tag':
          return <Tag className="h-4 w-4 text-purple-500" />;
        default:
          return <Search className="h-4 w-4 text-gray-500" />;
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'tool':
          return '工具';
        case 'category':
          return '分类';
        case 'tag':
          return '标签';
        default:
          return '';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto",
          className
        )}
      >
        <div className="py-2">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => onSelect(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {getTypeLabel(suggestion.type)}
                    </Badge>
                    {suggestion.count !== undefined && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {suggestion.count}
                      </Badge>
                    )}
                  </div>
                  {suggestion.description && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SearchSuggestions.displayName = 'SearchSuggestions';

export { SearchSuggestions };
export type { SearchSuggestion };