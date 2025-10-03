import { Suspense } from 'react';
import { db } from '@/db';
import { llmJobs, crawlResults, sources } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
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
  Zap
} from 'lucide-react';
import { count, eq, desc, sql } from 'drizzle-orm';

export default function IngestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">摄取管理</h1>
        <p className="text-gray-600">管理和监控数据摄取任务</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<IngestStatsSkeleton />}>
          <IngestStats />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">处理队列</h2>
          <Suspense fallback={<ProcessingQueueSkeleton />}>
            <ProcessingQueue />
          </Suspense>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">摄取性能</h2>
          <Suspense fallback={<IngestPerformanceSkeleton />}>
            <IngestPerformance />
          </Suspense>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">最近任务</h2>
        <Suspense fallback={<IngestsListSkeleton />}>
          <IngestsList />
        </Suspense>
      </div>
    </div>
  );
}

async function IngestStats() {
  const [totalJobs, completedJobs, failedJobs, runningJobs] = await Promise.all([
    db.select({ count: count() }).from(llmJobs),
    db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'completed')),
    db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'failed')),
    db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'running')),
  ]);

  const stats = [
    {
      title: '总摄取任务',
      value: totalJobs[0]?.count || 0,
      icon: Brain,
      description: '所有摄取任务',
      color: 'text-purple-600',
    },
    {
      title: '已完成',
      value: completedJobs[0]?.count || 0,
      icon: CheckCircle,
      description: '成功完成的任务',
      color: 'text-green-600',
    },
    {
      title: '失败任务',
      value: failedJobs[0]?.count || 0,
      icon: AlertCircle,
      description: '执行失败的任务',
      color: 'text-red-600',
    },
    {
      title: '运行中',
      value: runningJobs[0]?.count || 0,
      icon: Clock,
      description: '正在执行的任务',
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

async function ProcessingQueue() {
  const queuedJobs = await db
    .select({
      id: llmJobs.id,
      resultId: llmJobs.resultId,
      status: llmJobs.status,
      createdAt: llmJobs.createdAt,
      finishedAt: llmJobs.finishedAt,
    })
    .from(llmJobs)
    .where(eq(llmJobs.status, 'queued'))
    .orderBy(desc(llmJobs.createdAt))
    .limit(5);

  return (
    <div className="space-y-4">
      {queuedJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          队列为空
        </div>
      ) : (
        queuedJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium">LLM任务 #{job.id}</h3>
                  <p className="text-sm text-gray-500">
                    创建时间: {job.createdAt ? 
                      new Date(job.createdAt).toLocaleString() : 
                      '未知时间'
                    }
                  </p>
                </div>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  等待中
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  任务 ID: {job.id}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    开始
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

async function IngestPerformance() {
  // 模拟性能数据
  const performanceData = {
    successRate: 92,
    avgProcessingTime: 25,
    recentTrend: 'up' as 'up' | 'down' | 'stable',
    totalProcessed: 850,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">性能指标</CardTitle>
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
            <span className="text-sm text-gray-600">平均处理时间</span>
            <span className="text-sm font-medium">{performanceData.avgProcessingTime}s</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">总处理量</span>
            <span className="text-sm font-medium">{performanceData.totalProcessed.toLocaleString()}</span>
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

async function IngestsList() {
  const recentJobs = await db
    .select({
      id: llmJobs.id,
      resultId: llmJobs.resultId,
      status: llmJobs.status,
      createdAt: llmJobs.createdAt,
      finishedAt: llmJobs.finishedAt,
    })
    .from(llmJobs)
    .orderBy(desc(llmJobs.createdAt))
    .limit(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>摄取任务列表</CardTitle>
        <CardDescription>最近的数据摄取任务执行记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无摄取任务
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {job.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {job.status === 'running' && <Brain className="h-5 w-5 text-purple-600 animate-pulse" />}
                    {job.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600" />}
                    {job.status === 'queued' && <Clock className="h-5 w-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">LLM任务 #{job.id}</p>
                    <p className="text-sm text-gray-500">
                      结果ID: {job.resultId}
                    </p>
                    <p className="text-xs text-gray-400">
                      创建时间: {job.createdAt ? 
                        new Date(job.createdAt).toLocaleString() : 
                        '未知时间'
                      }
                      {job.finishedAt && (
                        <span className="ml-2">
                          完成时间: {new Date(job.finishedAt).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'running' ? 'secondary' :
                      job.status === 'failed' ? 'destructive' : 'outline'
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
                  {job.status === 'failed' && (
                    <Button size="sm" variant="outline">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      重试
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function IngestStatsSkeleton() {
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

function ProcessingQueueSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IngestPerformanceSkeleton() {
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

function IngestsListSkeleton() {
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
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}