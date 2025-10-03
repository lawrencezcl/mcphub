import { useState, useEffect } from 'react';

interface FavoriteState {
  isFavorited: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useFavorites(toolId: number) {
  const [state, setState] = useState<FavoriteState>({
    isFavorited: false,
    isLoading: true,
    error: null,
  });

  // 获取收藏状态
  const fetchFavoriteStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/favorites?toolId=${toolId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取收藏状态失败');
      }
      
      setState(prev => ({
        ...prev,
        isFavorited: data.isFavorited,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '未知错误',
        isLoading: false,
      }));
    }
  };

  // 切换收藏状态
  const toggleFavorite = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const method = state.isFavorited ? 'DELETE' : 'POST';
      const url = state.isFavorited 
        ? `/api/favorites?toolId=${toolId}`
        : '/api/favorites';
      
      const body = state.isFavorited ? undefined : JSON.stringify({ toolId });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '操作失败');
      }
      
      setState(prev => ({
        ...prev,
        isFavorited: !prev.isFavorited,
        isLoading: false,
      }));
      
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '未知错误',
        isLoading: false,
      }));
      throw error;
    }
  };

  useEffect(() => {
    if (toolId) {
      fetchFavoriteStatus();
    }
  }, [toolId]);

  return {
    isFavorited: state.isFavorited,
    isLoading: state.isLoading,
    error: state.error,
    toggleFavorite,
    refetch: fetchFavoriteStatus,
  };
}