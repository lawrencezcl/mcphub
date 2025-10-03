import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Heart, Star, Download, Eye, Calendar, Zap } from 'lucide-react';
import { ShareButton } from '@/components/ui/ShareButton';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

interface ToolCardProps {
  tool: {
    id: string;
    slug: string;
    name: string;
    description: string;
    author?: string;
    logoUrl?: string;
    repoUrl?: string;
    homepageUrl?: string;
    runtimeSupport?: {
      node: boolean;
      edge: boolean;
      browser: boolean;
    };
    popularityScore?: number;
    createdAt: string;
    updatedAt: string;
    tags?: Array<{
      id: string;
      name: string;
      slug: string;
      color?: string;
    }>;
    stats?: {
      likes: number;
      favorites: number;
      downloads?: number;
      views?: number;
    };
  };
  showActions?: boolean;
}

export function ToolCard({ tool, showActions = true }: ToolCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRuntimeBadgeColor = (runtime: string) => {
    switch (runtime) {
      case 'node': return 'bg-green-100 text-green-800 border-green-200';
      case 'edge': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'browser': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300 h-full flex flex-col">
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
        <div className="flex items-start gap-2 sm:gap-3">
          {tool.logoUrl && (
            <div className="flex-shrink-0">
              <Image
                src={tool.logoUrl}
                alt={`${tool.name} logo`}
                width={32}
                height={32}
                className="rounded-lg sm:w-10 sm:h-10 lg:w-12 lg:h-12"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {tool.name}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">{formatDate(tool.createdAt)}</span>
              </div>
            </div>
            {tool.author && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                by {tool.author}
              </p>
            )}
            {tool.popularityScore !== undefined && tool.popularityScore > 0 && (
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600">
                  热度 {tool.popularityScore}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Runtime Support Badges */}
        {tool.runtimeSupport && (
          <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
            {tool.runtimeSupport.node && (
              <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${getRuntimeBadgeColor('node')}`}>
                Node.js
              </Badge>
            )}
            {tool.runtimeSupport.edge && (
              <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${getRuntimeBadgeColor('edge')}`}>
                Edge
              </Badge>
            )}
            {tool.runtimeSupport.browser && (
              <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${getRuntimeBadgeColor('browser')}`}>
                Browser
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 flex-1 flex flex-col">
        {/* 工具描述 */}
        <CardDescription className="text-gray-700 text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-3 flex-1">
          {tool.description}
        </CardDescription>
        
        {/* 标签 */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {tool.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag.slug} 
                variant="outline" 
                className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 transition-colors"
              >
                {tag.name}
              </Badge>
            ))}
            {tool.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border-gray-200">
                +{tool.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 操作按钮和统计信息 */}
        {showActions && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-gray-100 mt-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 text-sm text-gray-500">
              {tool.stats?.likes !== undefined && (
                <div className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm">{tool.stats.likes}</span>
                </div>
              )}
              {tool.stats?.favorites !== undefined && (
                <div className="flex items-center space-x-1 hover:text-yellow-500 transition-colors cursor-pointer">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm">{tool.stats.favorites}</span>
                </div>
              )}
              {tool.stats?.downloads !== undefined && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium text-xs sm:text-sm">{tool.stats.downloads}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto">
              <FavoriteButton 
                toolId={parseInt(tool.id)} 
                variant="ghost"
                size="sm"
              />
              <ShareButton 
                toolId={parseInt(tool.id)} 
                toolName={tool.name}
                variant="ghost"
                size="sm"
              />
              {tool.repoUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="h-7 sm:h-8 px-2 sm:px-3 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <Link href={tool.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
              )}
              {tool.homepageUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="h-7 sm:h-8 px-2 sm:px-3 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <Link href={tool.homepageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="h-7 sm:h-8 px-2 sm:px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Link href={`/tools/${tool.slug}`}>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">查看详情</span>
                  <span className="sm:hidden">详情</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}