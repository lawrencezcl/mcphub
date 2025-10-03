import { Suspense } from 'react';
import { db } from '@/db';
import { sources, crawlJobs, tools } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Database,
  Zap,
  ExternalLink,
  Calendar,
  Activity
} from 'lucide-react';
import { count, eq, desc, sql } from 'drizzle-orm';

export default function SourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据源管理</h1>
        <p className="text-gray-600">管理和监控数据源状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<SourceStatsSkeleton />}>
          <SourceStats />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">活跃数据源</h2>
          <Suspense fallback={<ActiveSourcesSkeleton />}>
            <ActiveSources />
          </Suspense>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">爬取性能</h2>
          <Suspense fallback={<CrawlPerformanceSkeleton />}>
            <CrawlPerformance />
          </Suspense>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">数据源列表</h2>
        <Suspense fallback={<SourcesListSkeleton />}>
          <SourcesList />
        </Suspense>
      </div>
    </div>
  );
}

async function SourceStats() {
  const [totalSources, activeSources, inactiveSources, recentlyUpdated] = await Promise.all([
    db.select({ count: count() }).from(sources),
    db.select({ count: count() }).from(sources).where(eq(sources.enabled, true)),
    db.select({ count: count() }).from(sources).where(eq(sources.enabled, false)),
    db.select({ count: count() }).from(sources).where(
      sql`${sources.updatedAt} > NOW() - INTERVAL '24 hours'`
    ),
  ]);

  const stats = [
    {
      title: '总数据源',
      value: totalSources[0]?.count || 0,
      icon: Globe,
      description: '所有配置的数据源',
      color: 'text-blue-600',
    },
    {
      title: '活跃数据源',
      value: activeSources[0]?.count || 0,
      icon: CheckCircle,
      description: '正在使用的数据源',
      color: 'text-green-600',
    },
    {
      title: '非活跃数据源',
      value: inactiveSources[0]?.count || 0,
      icon: AlertCircle,
      description: '已停用的数据源',
      color: 'text-red-600',
    },
    {
      title: '最近更新',
      value: recentlyUpdated[0]?.count || 0,
      icon: Clock,
      description: '24小时内更新的数据源',
      color: 'text-orange-600',
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

async function ActiveSources() {
  const activeSources = await db
    .select({
      id: sources.id,
      type: sources.type,
      identifier: sources.identifier,
      enabled: sources.enabled,
      updatedAt: sources.updatedAt,
    })
    .from(sources)
    .where(eq(sources.enabled, true))
    .orderBy(desc(sources.updatedAt))
    .limit(5);

  return (
    <div className="space-y-4">
      {activeSources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无活跃数据源
        </div>
      ) : (
        activeSources.map((source) => (
          <Card key={source.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium">{source.type}</h3>
                  <p className="text-sm text-gray-500 flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {source.identifier}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    更新时间: {source.updatedAt ? new Date(source.updatedAt).toLocaleString() : '未知'}
                  </p>
                </div>
                <Badge variant={source.enabled ? 'default' : 'secondary'}>
                  <Activity className="w-3 h-3 mr-1" />
                  {source.enabled ? '启用' : '禁用'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  类型: {source.type}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    立即爬取
                  </Button>
                  <Button size="sm" variant="outline">
                    <Pause className="w-3 h-3 mr-1" />
                    暂停
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

async function CrawlPerformance() {
  // 模拟性能数据
  const performanceData = {
    successRate: 88,
    avgCrawlTime: 45,
    recentTrend: 'stable' as 'up' | 'down' | 'stable',
    totalCrawled: 1250,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">爬取性能</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">成功率</span>
            <span className="text-sm text-gray-500">{performanceData.successRate}%</span>
          </div>
          <Progress value={performanceData.successRate} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">平均爬取时间</span>
            <span className="text-sm font-medium">{performanceData.avgCrawlTime}s</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">总爬取量</span>
            <span className="text-sm font-medium">{performanceData.totalCrawled.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">趋势</span>
            <div className="flex items-center">
              {performanceData.recentTrend === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              )}
              {performanceData.recentTrend === 'down' && (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              {performanceData.recentTrend === 'stable' && (
                <Minus className="w-4 h-4 text-gray-600 mr-1" />
              )}
              <span className="text-sm font-medium">
                {performanceData.recentTrend === 'up' ? '上升' : 
                 performanceData.recentTrend === 'down' ? '下降' : '稳定'}
              </span>
            </div>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          刷新数据
        </Button>
      </CardContent>
    </Card>
  );
}

async function SourcesList() {
  const allSources = await db
    .select({
      id: sources.id,
      type: sources.type,
      identifier: sources.identifier,
      enabled: sources.enabled,
      createdAt: sources.createdAt,
      updatedAt: sources.updatedAt,
    })
    .from(sources)
    .orderBy(desc(sources.createdAt))
    .limit(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据源列表</CardTitle>
        <CardDescription>所有配置的数据源及其状态</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无数据源
            </div>
          ) : (
            allSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{source.type}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {source.identifier}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        创建: {source.createdAt ? 
                          new Date(source.createdAt).toLocaleDateString() : 
                          '未知时间'
                        }
                      </span>
                      {source.updatedAt && (
                        <span>更新: {new Date(source.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline"
                  >
                    {source.type}
                  </Badge>
                  <Button size="sm" variant="outline">
                    编辑
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    爬取
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SourceStatsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ActiveSourcesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CrawlPerformanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

function SourcesListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-64 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}