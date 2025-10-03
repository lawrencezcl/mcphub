import { Suspense } from 'react';
import { db } from '@/db';
import { sources } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  Settings, 
  CheckCircle, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Github,
  Package,
  Globe,
  List
} from 'lucide-react';
import { desc } from 'drizzle-orm';

export default async function SourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">数据源管理</h1>
            <p className="text-gray-600">配置和管理爬取数据源</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加数据源
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<StatsSkeleton />}>
          <SourceStats />
        </Suspense>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<SourcesListSkeleton />}>
          <SourcesList />
        </Suspense>
      </div>
    </div>
  );
}

async function SourceStats() {
  const stats = await db
    .select({
      total: sources.id,
      type: sources.type,
      enabled: sources.enabled,
    })
    .from(sources);

  const totalSources = stats.length;
  const enabledSources = stats.filter(s => s.enabled).length;
  const githubSources = stats.filter(s => s.type === 'github_topic').length;
  const npmSources = stats.filter(s => s.type === 'npm_query').length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总数据源</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSources}</div>
          <p className="text-xs text-muted-foreground">
            已配置的数据源总数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">启用中</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{enabledSources}</div>
          <p className="text-xs text-muted-foreground">
            正在运行的数据源
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GitHub 主题</CardTitle>
          <Github className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{githubSources}</div>
          <p className="text-xs text-muted-foreground">
            GitHub 主题数据源
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">NPM 查询</CardTitle>
          <Package className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{npmSources}</div>
          <p className="text-xs text-muted-foreground">
            NPM 包查询数据源
          </p>
        </CardContent>
      </Card>
    </>
  );
}

async function SourcesList() {
  const sourcesList = await db
    .select()
    .from(sources)
    .orderBy(desc(sources.createdAt));

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'github_topic':
        return <Github className="h-5 w-5 text-gray-600" />;
      case 'npm_query':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'awesome_list':
        return <List className="h-5 w-5 text-purple-600" />;
      case 'website':
        return <Globe className="h-5 w-5 text-blue-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'github_topic':
        return 'GitHub 主题';
      case 'npm_query':
        return 'NPM 查询';
      case 'awesome_list':
        return 'Awesome 列表';
      case 'website':
        return '网站';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">数据源列表</h2>
        <div className="text-sm text-gray-500">
          共 {sourcesList.length} 个数据源
        </div>
      </div>

      <div className="grid gap-4">
        {sourcesList.map((source) => (
          <Card key={source.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSourceIcon(source.type)}
                  <div>
                    <CardTitle className="text-lg">{source.identifier}</CardTitle>
                    <CardDescription>
                      {getTypeLabel(source.type)} • 创建于 {source.createdAt?.toLocaleDateString('zh-CN')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={source.enabled ? "default" : "secondary"}>
                    {source.enabled ? "启用" : "禁用"}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {source.config && (
              <CardContent>
                <div className="text-sm text-gray-600">
                  <strong>配置:</strong>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(source.config, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {sourcesList.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据源</h3>
            <p className="text-gray-500 mb-4">开始添加第一个数据源来抓取工具信息</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加数据源
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function SourcesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: '数据源管理 - MCPHub Admin',
  description: '配置和管理爬取数据源',
};