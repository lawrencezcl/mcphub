import { Suspense } from 'react';
import { db } from '@/db';
import { crawlJobs, sources, crawlResults, llmJobs } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  Database,
  Settings,
  Calendar,
  Timer,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { eq, desc, count, and, isNotNull } from 'drizzle-orm';

export default async function CrawlPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">爬虫管理</h1>
            <p className="text-gray-600">管理数据源爬取任务和监控系统状态</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              配置
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              手动触发
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<CrawlStatsSkeleton />}>
          <CrawlStats />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<ActiveSourcesSkeleton />}>
          <ActiveSources />
        </Suspense>
        <Suspense fallback={<CrawlPerformanceSkeleton />}>
          <CrawlPerformance />
        </Suspense>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<RecentJobsSkeleton />}>
          <RecentJobs />
        </Suspense>
      </div>
    </div>
  );
}

async function CrawlStats() {
  const [jobStats, resultStats, llmStats] = await Promise.all([
    db
      .select({
        status: crawlJobs.status,
        count: count(),
      })
      .from(crawlJobs)
      .groupBy(crawlJobs.status),
    
    db
      .select({
        count: count(),
      })
      .from(crawlResults),
    
    db
      .select({
        status: llmJobs.status,
        count: count(),
      })
      .from(llmJobs)
      .groupBy(llmJobs.status),
  ]);

  const totalJobs = jobStats.reduce((sum, stat) => sum + stat.count, 0);
  const completedJobs = jobStats.find(s => s.status === 'completed')?.count || 0;
  const runningJobs = jobStats.find(s => s.status === 'running')?.count || 0;
  const failedJobs = jobStats.find(s => s.status === 'failed')?.count || 0;
  
  const totalResults = resultStats[0]?.count || 0;
  const completedLLM = llmStats.find(s => s.status === 'completed')?.count || 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总爬取任务</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            历史总任务数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">运行中</CardTitle>
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{runningJobs}</div>
          <p className="text-xs text-muted-foreground">
            正在执行的任务
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">爬取结果</CardTitle>
          <Database className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResults}</div>
          <p className="text-xs text-muted-foreground">
            已收集的数据条目
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LLM 处理</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedLLM}</div>
          <p className="text-xs text-muted-foreground">
            已完成 AI 分析
          </p>
        </CardContent>
      </Card>
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
      config: sources.config,
      createdAt: sources.createdAt,
    })
    .from(sources)
    .where(eq(sources.enabled, true))
    .orderBy(desc(sources.createdAt))
    .limit(10);

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'github_topic':
        return 'bg-gray-100 text-gray-800';
      case 'npm_query':
        return 'bg-red-100 text-red-800';
      case 'website':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>活跃数据源</CardTitle>
        <CardDescription>当前启用的爬取数据源</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeSources.length === 0 ? (
            <p className="text-sm text-gray-500">暂无活跃数据源</p>
          ) : (
            activeSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSourceTypeColor(source.type)}>
                      {source.type}
                    </Badge>
                    <span className="font-medium">{source.identifier}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {activeSources.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              查看所有数据源
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function CrawlPerformance() {
  const recentJobs = await db
    .select({
      id: crawlJobs.id,
      status: crawlJobs.status,
      startedAt: crawlJobs.startedAt,
      finishedAt: crawlJobs.finishedAt,
      stats: crawlJobs.stats,
    })
    .from(crawlJobs)
    .where(isNotNull(crawlJobs.finishedAt))
    .orderBy(desc(crawlJobs.finishedAt))
    .limit(10);

  const avgDuration = recentJobs.length > 0 
    ? recentJobs.reduce((sum, job) => {
        if (job.startedAt && job.finishedAt) {
          return sum + (job.finishedAt.getTime() - job.startedAt.getTime());
        }
        return sum;
      }, 0) / recentJobs.length / 1000 // 转换为秒
    : 0;

  const successRate = recentJobs.length > 0
    ? (recentJobs.filter(job => job.status === 'completed').length / recentJobs.length) * 100
    : 0;

  const totalItemsProcessed = recentJobs.reduce((sum, job) => {
    const stats = job.stats as any;
    return sum + (stats?.itemsProcessed || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>性能指标</CardTitle>
        <CardDescription>最近10次任务的性能统计</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(avgDuration)}s
              </div>
              <div className="text-sm text-blue-700">平均耗时</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(successRate)}%
              </div>
              <div className="text-sm text-green-700">成功率</div>
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {totalItemsProcessed}
            </div>
            <div className="text-sm text-purple-700">总处理项目数</div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              查看详细报告
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function RecentJobs() {
  const recentJobs = await db
    .select({
      id: crawlJobs.id,
      status: crawlJobs.status,
      startedAt: crawlJobs.startedAt,
      finishedAt: crawlJobs.finishedAt,
      stats: crawlJobs.stats,
      error: crawlJobs.error,
      sourceId: crawlJobs.sourceId,
      source: {
        id: sources.id,
        type: sources.type,
        identifier: sources.identifier,
      }
    })
    .from(crawlJobs)
    .leftJoin(sources, eq(crawlJobs.sourceId, sources.id))
    .orderBy(desc(crawlJobs.startedAt))
    .limit(20);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-green-700 bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />已完成</Badge>;
      case 'running':
        return <Badge variant="secondary" className="text-blue-700 bg-blue-100"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />运行中</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-red-700 bg-red-100"><XCircle className="h-3 w-3 mr-1" />失败</Badge>;
      case 'queued':
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-100"><Clock className="h-3 w-3 mr-1" />排队中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: Date | null, finishedAt: Date | null) => {
    if (!startedAt) return '-';
    const endTime = finishedAt || new Date();
    const duration = Math.round((endTime.getTime() - startedAt.getTime()) / 1000);
    return `${duration}s`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">最近的爬取任务</h2>
        <div className="text-sm text-gray-500">
          共 {recentJobs.length} 个任务
        </div>
      </div>

      <div className="grid gap-4">
        {recentJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">
                      任务 #{job.id}
                    </CardTitle>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {job.startedAt?.toLocaleString('zh-CN')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {formatDuration(job.startedAt, job.finishedAt)}
                    </div>
                    {job.source && (
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        <Badge variant="outline" className="text-xs">
                          {job.source.type}
                        </Badge>
                        <span>{job.source.identifier}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {job.status === 'running' && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {job.status === 'failed' && (
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {(job.stats || job.error) && (
              <CardContent className="pt-0">
                {job.stats && (
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-600">
                        {(job.stats as any)?.itemsFound || 0}
                      </div>
                      <div className="text-xs text-blue-700">发现项目</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-600">
                        {(job.stats as any)?.itemsProcessed || 0}
                      </div>
                      <div className="text-xs text-green-700">处理成功</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-semibold text-red-600">
                        {(job.stats as any)?.errors || 0}
                      </div>
                      <div className="text-xs text-red-700">错误数量</div>
                    </div>
                  </div>
                )}
                
                {job.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      错误信息
                    </div>
                    <p className="text-sm text-red-600 font-mono">{job.error}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {recentJobs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无爬取任务</h3>
            <p className="text-gray-500 mb-4">还没有执行过爬取任务</p>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              开始第一个任务
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CrawlStatsSkeleton() {
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

function ActiveSourcesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CrawlPerformanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentJobsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
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
  title: '爬虫管理 - MCPHub Admin',
  description: '管理数据源爬取任务和监控系统状态',
};