import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">系统监控</h1>
            <p className="text-gray-600">实时监控系统性能和运行状态</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<SystemStatusSkeleton />}>
          <SystemStatusCards />
        </Suspense>
      </div>

      {/* 性能指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<PerformanceMetricsSkeleton />}>
          <PerformanceMetrics />
        </Suspense>
        
        <Suspense fallback={<ErrorLogsSkeleton />}>
          <ErrorLogs />
        </Suspense>
      </div>

      {/* 资源使用情况 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Suspense fallback={<ResourceUsageSkeleton />}>
          <DatabaseStatus />
        </Suspense>
        
        <Suspense fallback={<ResourceUsageSkeleton />}>
          <APIStatus />
        </Suspense>
        
        <Suspense fallback={<ResourceUsageSkeleton />}>
          <CrawlStatus />
        </Suspense>
      </div>
    </div>
  );
}

async function SystemStatusCards() {
  // 模拟数据，实际应该从API获取
  const systemStatus = {
    overall: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms',
    activeUsers: 1247
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">系统状态</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">正常</div>
          <p className="text-xs text-gray-600">所有服务运行正常</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">系统可用性</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.uptime}</div>
          <p className="text-xs text-gray-600">过去30天</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">响应时间</CardTitle>
          <Zap className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.responseTime}</div>
          <p className="text-xs text-gray-600">平均响应时间</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
          <Activity className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-gray-600">过去24小时</p>
        </CardContent>
      </Card>
    </>
  );
}

async function PerformanceMetrics() {
  // 模拟性能数据
  const metrics = [
    { name: 'CPU使用率', value: '45%', status: 'normal', trend: 'up' },
    { name: '内存使用率', value: '67%', status: 'warning', trend: 'stable' },
    { name: '磁盘使用率', value: '23%', status: 'normal', trend: 'down' },
    { name: '网络流量', value: '1.2GB/h', status: 'normal', trend: 'up' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="w-5 h-5 mr-2" />
          性能指标
        </CardTitle>
        <CardDescription>实时系统性能监控</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium">{metric.name}</div>
                <Badge variant={metric.status === 'warning' ? 'destructive' : 'secondary'}>
                  {metric.status === 'warning' ? '警告' : '正常'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{metric.value}</span>
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {metric.trend === 'stable' && <div className="w-4 h-4" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function ErrorLogs() {
  // 模拟错误日志数据
  const errors = [
    {
      id: 1,
      level: 'error',
      message: 'Database connection timeout',
      timestamp: '2024-01-15 14:30:25',
      count: 3
    },
    {
      id: 2,
      level: 'warning',
      message: 'High memory usage detected',
      timestamp: '2024-01-15 14:25:10',
      count: 1
    },
    {
      id: 3,
      level: 'error',
      message: 'API rate limit exceeded',
      timestamp: '2024-01-15 14:20:45',
      count: 7
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          错误日志
        </CardTitle>
        <CardDescription>最近的系统错误和警告</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((error) => (
            <div key={error.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant={error.level === 'error' ? 'destructive' : 'secondary'}>
                    {error.level === 'error' ? '错误' : '警告'}
                  </Badge>
                  {error.count > 1 && (
                    <Badge variant="outline">
                      {error.count}次
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-900 mb-1">{error.message}</p>
                <p className="text-xs text-gray-500">{error.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function DatabaseStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          数据库状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">连接状态</span>
            <Badge variant="secondary" className="text-green-600">正常</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">活跃连接</span>
            <span className="text-sm font-medium">8/20</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">查询响应时间</span>
            <span className="text-sm font-medium">45ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">存储使用</span>
            <span className="text-sm font-medium">2.3GB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function APIStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          API状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">API健康状态</span>
            <Badge variant="secondary" className="text-green-600">正常</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">请求/分钟</span>
            <span className="text-sm font-medium">1,247</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">成功率</span>
            <span className="text-sm font-medium">99.8%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">平均延迟</span>
            <span className="text-sm font-medium">120ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function CrawlStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          爬取状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">爬取服务</span>
            <Badge variant="secondary" className="text-green-600">运行中</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">活跃任务</span>
            <span className="text-sm font-medium">3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">今日完成</span>
            <span className="text-sm font-medium">127</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">成功率</span>
            <span className="text-sm font-medium">94.2%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton组件
function SystemStatusSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
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

function PerformanceMetricsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorLogsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-8" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceUsageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}