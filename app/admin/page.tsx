import { Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { tools, sources, crawlJobs, ingests } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Activity,
  TrendingUp
} from 'lucide-react';
import { eq, count, desc } from 'drizzle-orm';

export default async function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">管理后台</h1>
        <p className="text-gray-600">MCPHub 系统管理和监控</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsCards />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentCrawlJobs />
        </Suspense>
        
        <Suspense fallback={<PendingReviewSkeleton />}>
          <PendingReviews />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActions />
      </div>
    </div>
  );
}

async function StatsCards() {
  const [
    totalTools,
    totalSources,
    pendingReviews,
    recentCrawls
  ] = await Promise.all([
    db.select({ count: count() }).from(tools),
    db.select({ count: count() }).from(sources).where(eq(sources.enabled, true)),
    db.select({ count: count() }).from(ingests).where(eq(ingests.status, 'pending_review')),
    db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'completed'))
  ]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">工具总数</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTools[0]?.count || 0}</div>
          <p className="text-xs text-muted-foreground">已发布的工具</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">数据源</CardTitle>
          <Search className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSources[0]?.count || 0}</div>
          <p className="text-xs text-muted-foreground">活跃数据源</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待审核</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingReviews[0]?.count || 0}</div>
          <p className="text-xs text-muted-foreground">等待审核的项目</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">爬取任务</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentCrawls[0]?.count || 0}</div>
          <p className="text-xs text-muted-foreground">已完成任务</p>
        </CardContent>
      </Card>
    </>
  );
}

async function RecentCrawlJobs() {
  const recentJobs = await db
    .select({
      id: crawlJobs.id,
      status: crawlJobs.status,
      startedAt: crawlJobs.startedAt,
      finishedAt: crawlJobs.finishedAt,
      stats: crawlJobs.stats,
      error: crawlJobs.error,
      sourceId: crawlJobs.sourceId,
    })
    .from(crawlJobs)
    .orderBy(desc(crawlJobs.startedAt))
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近的爬取任务</CardTitle>
        <CardDescription>系统自动爬取任务执行情况</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-500">暂无爬取任务</p>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {job.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {job.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {job.status === 'running' && (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">数据源 #{job.sourceId}</p>
                    <p className="text-xs text-gray-500">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString('zh-CN') : '未开始'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {job.stats && (
                    <p className="text-sm">
                      {job.stats.itemsProcessed || 0}/{job.stats.itemsFound || 0}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/crawl">查看全部</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

async function PendingReviews() {
  const pendingIngests = await db
    .select({
      id: ingests.id,
      createdAt: ingests.createdAt,
      llmJobId: ingests.llmJobId,
    })
    .from(ingests)
    .where(eq(ingests.status, 'pending_review'))
    .orderBy(desc(ingests.createdAt))
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>待审核项目</CardTitle>
        <CardDescription>需要人工审核的工具入库请求</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingIngests.length === 0 ? (
            <p className="text-sm text-gray-500">暂无待审核项目</p>
          ) : (
            pendingIngests.map((ingest) => (
              <div key={ingest.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">入库请求 #{ingest.id}</p>
                    <p className="text-xs text-gray-500">
                      {ingest.createdAt ? new Date(ingest.createdAt).toLocaleString('zh-CN') : '未知时间'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">待审核</Badge>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/ingests">开始审核</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      title: '数据源管理',
      description: '配置和管理爬取数据源',
      href: '/admin/sources',
      icon: Settings,
      color: 'text-blue-600',
    },
    {
      title: '审核工具',
      description: '审核待入库的工具',
      href: '/admin/ingests',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: '系统监控',
      description: '查看系统运行状态',
      href: '/admin/monitoring',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <Card key={action.href} className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href={action.href}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
          </Link>
        </Card>
      ))}
    </>
  );
}

function StatsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PendingReviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const metadata = {
  title: '管理后台 - MCPHub',
  description: 'MCPHub 系统管理和监控',
};