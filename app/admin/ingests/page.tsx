import { Suspense } from 'react';
import { db } from '@/db';
import { ingests, llmJobs, crawlResults, tools, users } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { eq, desc, isNull } from 'drizzle-orm';

export default async function IngestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">审核工具</h1>
            <p className="text-gray-600">审核待入库的工具和内容</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">批量审核</Button>
            <Button>自动审核</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Suspense fallback={<StatsSkeleton />}>
          <IngestStats />
        </Suspense>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<IngestsListSkeleton />}>
          <IngestsList />
        </Suspense>
      </div>
    </div>
  );
}

async function IngestStats() {
  const stats = await db
    .select({
      id: ingests.id,
      status: ingests.status,
    })
    .from(ingests);

  const totalIngests = stats.length;
  const pendingIngests = stats.filter(s => s.status === 'pending_review').length;
  const approvedIngests = stats.filter(s => s.status === 'approved').length;
  const rejectedIngests = stats.filter(s => s.status === 'rejected').length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总入库请求</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIngests}</div>
          <p className="text-xs text-muted-foreground">
            所有入库请求总数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待审核</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingIngests}</div>
          <p className="text-xs text-muted-foreground">
            等待人工审核
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已通过</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedIngests}</div>
          <p className="text-xs text-muted-foreground">
            审核通过并入库
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rejectedIngests}</div>
          <p className="text-xs text-muted-foreground">
            审核未通过
          </p>
        </CardContent>
      </Card>
    </>
  );
}

async function IngestsList() {
  const ingestsList = await db
    .select({
      id: ingests.id,
      status: ingests.status,
      reason: ingests.reason,
      createdAt: ingests.createdAt,
      updatedAt: ingests.updatedAt,
      toolId: ingests.toolId,
      llmOutput: llmJobs.output,
      crawlResult: {
        id: crawlResults.id,
        canonicalUrl: crawlResults.canonicalUrl,
        rawTitle: crawlResults.rawTitle,
        rawDescription: crawlResults.rawDescription,
        rawMetadata: crawlResults.rawMetadata,
      },
      moderator: {
        id: users.id,
        firstName: users.firstName,
        username: users.username,
      },
      tool: {
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
      }
    })
    .from(ingests)
    .leftJoin(llmJobs, eq(ingests.llmJobId, llmJobs.id))
    .leftJoin(crawlResults, eq(llmJobs.resultId, crawlResults.id))
    .leftJoin(users, eq(ingests.moderatorId, users.id))
    .leftJoin(tools, eq(ingests.toolId, tools.id))
    .orderBy(desc(ingests.createdAt))
    .limit(50);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100"><Clock className="h-3 w-3 mr-1" />待审核</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-700 bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />已通过</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-red-700 bg-red-100"><XCircle className="h-3 w-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">入库请求列表</h2>
        <div className="text-sm text-gray-500">
          共 {ingestsList.length} 个请求
        </div>
      </div>

      <div className="grid gap-4">
        {ingestsList.map((ingest) => (
          <Card key={ingest.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">
                      {ingest.crawlResult?.rawTitle || '未知工具'}
                    </CardTitle>
                    {getStatusBadge(ingest.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {ingest.crawlResult?.rawDescription || '暂无描述'}
                  </CardDescription>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {ingest.createdAt?.toLocaleDateString('zh-CN')}
                    </div>
                    {ingest.moderator && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ingest.moderator.displayName}
                      </div>
                    )}
                    {ingest.crawlResult?.canonicalUrl && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        <a 
                          href={ingest.crawlResult.canonicalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          查看原始链接
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {ingest.status === 'pending_review' && (
                    <>
                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {(ingest.reason || ingest.llmOutput) && (
              <CardContent className="pt-0">
                {ingest.reason && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      拒绝原因
                    </div>
                    <p className="text-sm text-red-600">{ingest.reason}</p>
                  </div>
                )}
                
                {ingest.llmOutput && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">LLM 分析结果</h4>
                    <div className="text-sm bg-gray-50 p-3 rounded">
                      {typeof ingest.llmOutput === 'object' ? (
                        <div className="space-y-2">
                          {(ingest.llmOutput as any).summary && (
                            <div>
                              <strong>摘要:</strong> {(ingest.llmOutput as any).summary}
                            </div>
                          )}
                          {(ingest.llmOutput as any).tags && (
                            <div>
                              <strong>标签:</strong> {(ingest.llmOutput as any).tags.join(', ')}
                            </div>
                          )}
                          {(ingest.llmOutput as any).runtimeSupport && (
                            <div>
                              <strong>运行时支持:</strong> {JSON.stringify((ingest.llmOutput as any).runtimeSupport)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(ingest.llmOutput, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {ingestsList.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无入库请求</h3>
            <p className="text-gray-500 mb-4">当前没有需要审核的工具入库请求</p>
            <Button variant="outline">
              刷新列表
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

function IngestsListSkeleton() {
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-4 mt-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Skeleton className="h-8 w-8" />
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
  title: '审核工具 - MCPHub Admin',
  description: '审核待入库的工具和内容',
};