'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  toolId: number;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export function FavoriteButton({ 
  toolId, 
  variant = 'ghost', 
  size = 'sm',
  showText = false,
  className
}: FavoriteButtonProps) {
  const { isFavorited, isLoading, toggleFavorite } = useFavorites(toolId);
  const [isToggling, setIsToggling] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 9999;
      font-size: 14px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const handleToggle = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    const previousState = isFavorited;
    
    try {
      await toggleFavorite();
      showToast(
        !previousState ? '已添加到收藏' : '已从收藏中移除'
      );
    } catch (error) {
      showToast('操作失败，请稍后重试', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading || isToggling}
      className={cn(
        'gap-1 transition-colors',
        isFavorited && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
    >
      <Star 
        className={cn(
          'h-4 w-4 transition-all',
          isFavorited && 'fill-current'
        )} 
      />
      {showText && (isFavorited ? '已收藏' : '收藏')}
    </Button>
  );
}