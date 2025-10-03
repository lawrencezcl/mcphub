'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Twitter, Linkedin, Facebook, Mail, MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useShare } from '@/hooks/useShare';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  toolId: number;
  toolName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export function ShareButton({ 
  toolId, 
  toolName, 
  variant = 'ghost', 
  size = 'sm',
  showText = false,
  className
}: ShareButtonProps) {
  const { shareToplatform, copyToClipboard, createShare, isSharing } = useShare();
  const [copied, setCopied] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // 简单的toast实现，可以后续替换为更好的toast库
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

  const handleCopyLink = async () => {
    const content = await createShare(toolId, 'link');
    if (content) {
      const success = await copyToClipboard(content.shareUrl);
      if (success) {
        setCopied(true);
        showToast('链接已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      } else {
        showToast('复制失败，请手动复制', 'error');
      }
    }
  };

  const handleShare = async (platform: string) => {
    try {
      await shareToplatform(toolId, platform);
      showToast(`正在分享到${getPlatformName(platform)}`);
    } catch (error) {
      showToast('分享失败，请稍后重试', 'error');
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      email: '邮件',
      wechat: '微信',
      weibo: '微博',
    };
    return names[platform] || platform;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isSharing}
          className={cn("gap-1", className)}
        >
          <Share2 className="h-4 w-4" />
          {showText && '分享'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? '已复制' : '复制链接'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="gap-2">
          <Twitter className="h-4 w-4" />
          分享到 Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="gap-2">
          <Linkedin className="h-4 w-4" />
          分享到 LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="gap-2">
          <Facebook className="h-4 w-4" />
          分享到 Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('email')} className="gap-2">
          <Mail className="h-4 w-4" />
          通过邮件分享
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleShare('wechat')} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          分享到微信
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('weibo')} className="gap-2">
          <Globe className="h-4 w-4" />
          分享到微博
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}