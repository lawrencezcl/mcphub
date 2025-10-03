import { useState } from 'react';

export interface ShareContent {
  shareId: string;
  shareUrl: string;
  title?: string;
  description?: string;
  text?: string;
  url?: string;
  subject?: string;
  body?: string;
  qrCode?: string;
}

export interface ShareStats {
  totalShares: number;
  byPlatform: Record<string, number>;
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 创建分享链接
  const createShare = async (toolId: number, platform: string = 'link'): Promise<ShareContent | null> => {
    setIsSharing(true);
    setError(null);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId, platform }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建分享链接失败');
      }

      const data = await response.json();
      setShareContent(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建分享链接失败';
      setError(errorMessage);
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  // 获取分享统计
  const getShareStats = async (toolId: number): Promise<ShareStats | null> => {
    try {
      const response = await fetch(`/api/share?toolId=${toolId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取分享统计失败');
      }

      const data = await response.json();
      setShareStats(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取分享统计失败';
      setError(errorMessage);
      return null;
    }
  };

  // 复制链接到剪贴板
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // 降级方案
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      } catch (fallbackErr) {
        console.error('复制到剪贴板失败:', fallbackErr);
        return false;
      }
    }
  };

  // 打开分享窗口
  const openShareWindow = (url: string, title: string = '分享') => {
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      url,
      title,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // 分享到指定平台
  const shareToplatform = async (toolId: number, platform: string) => {
    const content = await createShare(toolId, platform);
    if (!content) return;

    switch (platform) {
      case 'twitter':
      case 'linkedin':
      case 'facebook':
      case 'weibo':
        if (content.url) {
          openShareWindow(content.url, `分享到${platform}`);
        }
        break;
      
      case 'email':
        if (content.url) {
          window.location.href = content.url;
        }
        break;
      
      case 'link':
        await copyToClipboard(content.shareUrl);
        break;
      
      case 'wechat':
        // 微信分享需要显示二维码
        break;
      
      default:
        await copyToClipboard(content.shareUrl);
        break;
    }
  };

  return {
    isSharing,
    shareContent,
    shareStats,
    error,
    createShare,
    getShareStats,
    copyToClipboard,
    openShareWindow,
    shareToplatform,
  };
}