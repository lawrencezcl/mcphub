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
      node?: boolean;
      edge?: boolean;
      browser?: boolean;
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-[1.02] h-full flex flex-col rounded-2xl overflow-hidden shadow-lg">
      <CardHeader className="p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <div className="flex items-start gap-3 sm:gap-4">
          {tool.logoUrl && (
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <Image
                src={tool.logoUrl}
                alt={`${tool.name} logo`}
                width={40}
                height={40}
                className="relative rounded-xl sm:w-12 sm:h-12 lg:w-14 lg:h-14 shadow-md"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                {tool.name}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 bg-white/60 rounded-full px-2 py-1">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">{formatDate(tool.createdAt)}</span>
              </div>
            </div>
            {tool.author && (
              <p className="text-sm text-gray-600 mt-1 font-medium">
                by <span className="text-blue-600">{tool.author}</span>
              </p>
            )}
            {tool.popularityScore !== undefined && tool.popularityScore > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full px-2 py-1">
                  <Zap className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-semibold text-yellow-700">
                    热度 {tool.popularityScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Runtime Support Badges */}
        {tool.runtimeSupport && (
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
            {tool.runtimeSupport.node && (
              <Badge variant="outline" className="text-xs px-3 py-1 bg-green-50 text-green-700 border-green-200 rounded-full font-medium">
                Node.js
              </Badge>
            )}
            {tool.runtimeSupport.edge && (
              <Badge variant="outline" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 rounded-full font-medium">
                Edge
              </Badge>
            )}
            {tool.runtimeSupport.browser && (
              <Badge variant="outline" className="text-xs px-3 py-1 bg-purple-50 text-purple-700 border-purple-200 rounded-full font-medium">
                Browser
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 lg:p-6 pt-0 flex-1 flex flex-col">
        {/* 工具描述 */}
        <CardDescription className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 sm:mb-5 line-clamp-3 flex-1">
          {tool.description}
        </CardDescription>
        
        {/* 标签 */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
            {tool.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag.slug} 
                variant="outline" 
                className="text-xs px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-all duration-200 rounded-full font-medium"
              >
                {tag.name}
              </Badge>
            ))}
            {tool.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-3 py-1 bg-gray-50 text-gray-500 border-gray-200 rounded-full font-medium">
                +{tool.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 操作按钮和统计信息 */}
        {showActions && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-gray-100/50 mt-auto">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {tool.stats?.likes !== undefined && (
                <div className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer group/stat">
                  <Heart className="w-4 h-4 group-hover/stat:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">{tool.stats.likes}</span>
                </div>
              )}
              {tool.stats?.favorites !== undefined && (
                <div className="flex items-center space-x-1 hover:text-yellow-500 transition-colors cursor-pointer group/stat">
                  <Star className="w-4 h-4 group-hover/stat:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">{tool.stats.favorites}</span>
                </div>
              )}
              {tool.stats?.downloads !== undefined && (
                <div className="flex items-center space-x-1 text-green-600 group/stat">
                  <Download className="w-4 h-4 group-hover/stat:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">{tool.stats.downloads}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <FavoriteButton 
                toolId={parseInt(tool.id)} 
                variant="ghost"
                size="sm"
                className="hover:bg-yellow-50 hover:text-yellow-600 rounded-xl"
              />
              <ShareButton 
                toolId={parseInt(tool.id)} 
                toolName={tool.name}
                variant="ghost"
                size="sm"
                className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
              />
              {tool.repoUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="h-8 px-3 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl transition-colors"
                >
                  <Link href={tool.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              {tool.homepageUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="h-8 px-3 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl transition-colors"
                >
                  <Link href={tool.homepageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="h-8 px-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 font-semibold flex-1 sm:flex-none text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Link href={`/tools/${tool.slug}`}>
                  <Eye className="w-4 h-4 mr-2" />
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