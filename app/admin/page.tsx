import { Suspense } from 'react';
import { db } from '@/db';
import { tools, crawlJobs, ingests } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Database, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { count, eq, desc } from 'drizzle-orm';

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">管理面板</h1>
        <p className="text-gray-600">系统概览和管理功能</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">最近的爬取任务</h2>
          <Suspense fallback={<RecentJobsSkeleton />}>
            <RecentCrawlJobs />
          </Suspense>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">待审核内容</h2>
          <Suspense fallback={<PendingReviewsSkeleton />}>
            <PendingReviews />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function StatsCards() {
  const [toolsCount, jobsCount, pendingReviewsCount] = await Promise.all([
    db.select({ count: count() }).from(tools),
    db.select({ count: count() }).from(crawlJobs),
    db.select({ count: count() }).from(ingests).where(eq(ingests.status, 'pending_review')),
  ]);

  const stats = [
    {
      title: '工具总数',
      value: toolsCount[0]?.count || 0,
      icon: Database,
      description: '已收录的 AI 工具',
      color: 'text-blue-600',
    },
    {
      title: '爬取任务',
      value: jobsCount[0]?.count || 0,
      icon: Activity,
      description: '总爬取任务数',
      color: 'text-green-600',
    },
    {
      title: '待审核',
      value: pendingReviewsCount[0]?.count || 0,
      icon: Clock,
      description: '等待审核的内容',
      color: 'text-orange-600',
    },
    {
      title: '活跃用户',
      value: 0,
      icon: Users,
      description: '本月活跃用户',
      color: 'text-purple-600',
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

async function RecentCrawlJobs() {// 获取最近的爬取任务
  const recentJobs = await db
    .select({
      id: crawlJobs.id,
      status: crawlJobs.status,
      startedAt: crawlJobs.startedAt,
      finishedAt: crawlJobs.finishedAt,
    })
    .from(crawlJobs)
    .orderBy(desc(crawlJobs.startedAt))
    .limit(5);

  return (
    <div className="space-y-4">
      {recentJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无爬取任务
        </div>
      ) : (
        recentJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium truncate">爬取任务 #{job.id}</p>
                  <p className="text-sm text-gray-500">
                    {job.startedAt ? new Date(job.startedAt).toLocaleString() : '未开始'}
                  </p>
                </div>
                <Badge
                  variant={
                    job.status === 'completed'
                      ? 'default'
                      : job.status === 'failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {job.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {job.status === 'running' && <Clock className="w-3 h-3 mr-1" />}
                  {job.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {job.status === 'queued' && <Clock className="w-3 h-3 mr-1" />}
                  {job.status === 'completed' ? '已完成' : 
                   job.status === 'running' ? '运行中' : 
                   job.status === 'failed' ? '失败' : '排队中'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

async function PendingReviews() {
  const pendingReviews = await db
    .select({
      id: ingests.id,
      status: ingests.status,
      createdAt: ingests.createdAt,
    })
    .from(ingests)
    .where(eq(ingests.status, 'pending_review'))
    .orderBy(desc(ingests.createdAt))
    .limit(5);

  return (
    <div className="space-y-4">
      {pendingReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无待审核内容
        </div>
      ) : (
        pendingReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">数据摄取</p>
                  <p className="text-sm text-gray-500">
                    {review.createdAt ? new Date(review.createdAt).toLocaleString() : '未知时间'}
                  </p>
                </div>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  待审核
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function StatsCardsSkeleton() {
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

function RecentJobsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PendingReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}