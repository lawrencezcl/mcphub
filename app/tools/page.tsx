import { Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { tools, categories, tags, toolTags, toolCategories } from '@/db/schema';
import { SearchQuerySchema } from '@/lib/validators';
import { ToolCard } from '@/components/cards/ToolCard';
import { ToolFilters } from '@/components/filters/ToolFilters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm';

interface ToolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">MCP 工具库</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          发现和探索 Model Context Protocol 生态系统中的优秀工具
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersSection />
      </Suspense>

      <Suspense fallback={<ToolsGridSkeleton />}>
        <ToolsGrid searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}

async function FiltersSection() {
  const [categoriesData, tagsData] = await Promise.all([
    db.select({ slug: categories.slug, name: categories.name }).from(categories),
    db.select({ slug: tags.slug, name: tags.name }).from(tags),
  ]);

  return <ToolFilters categories={categoriesData} tags={tagsData} />;
}

async function ToolsGrid({ searchParams }: { searchParams: Record<string, any> }) {
  const validatedQuery = SearchQuerySchema.safeParse(searchParams);
  
  if (!validatedQuery.success) {
    return <div className="text-center py-12 text-red-600">查询参数无效</div>;
  }

  const { page, pageSize, sort, order, q, category, tag, runtime } = validatedQuery.data;
  const offset = (page - 1) * pageSize;

  // 构建查询条件
  const conditions = [eq(tools.status, 'approved')];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(tools.description, `%${q}%`)
      )!
    );
  }

  if (runtime) {
    const filterJson = { [runtime]: true };
    conditions.push(
      sql`${tools.runtimeSupport} @> ${JSON.stringify(filterJson)}::jsonb`
    );
  }

  // 构建排序
  let orderBy;
  switch (sort) {
    case 'popular':
      orderBy = order === 'asc' ? asc(tools.popularityScore) : desc(tools.popularityScore);
      break;
    case 'name':
      orderBy = order === 'asc' ? asc(tools.name) : desc(tools.name);
      break;
    case 'updated':
      orderBy = order === 'asc' ? asc(tools.updatedAt) : desc(tools.updatedAt);
      break;
    default:
      orderBy = order === 'asc' ? asc(tools.createdAt) : desc(tools.createdAt);
  }

  const [toolsResult, totalResult] = await Promise.all([
    db
      .select({
        id: tools.id,
        slug: tools.slug,
        name: tools.name,
        description: tools.description,
        author: tools.author,
        logoUrl: tools.logoUrl,
        repoUrl: tools.repoUrl,
        homepageUrl: tools.homepageUrl,
        runtimeSupport: tools.runtimeSupport,
        popularityScore: tools.popularityScore,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
      })
      .from(tools)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(tools)
      .where(and(...conditions))
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (toolsResult.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg mb-4">没有找到匹配的工具</p>
        <p className="text-gray-500 mb-6">尝试调整搜索条件，或按分类与标签浏览</p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/categories">浏览分类</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tags">浏览标签</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/tools">查看全部</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          找到 {total} 个工具，第 {page} 页，共 {totalPages} 页
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {toolsResult.map((tool) => {
          const normalizeDate = (value: unknown): string => {
            if (typeof value === 'string') return value;
            if (value instanceof Date) return value.toISOString();
            return new Date().toISOString();
          };

          return (
            <ToolCard
              key={tool.id}
              tool={{
                id: tool.id.toString(),
                slug: tool.slug,
                name: tool.name,
                description: tool.description || '',
                author: tool.author || undefined,
                logoUrl: tool.logoUrl || undefined,
                repoUrl: tool.repoUrl || undefined,
                homepageUrl: tool.homepageUrl || undefined,
                runtimeSupport: tool.runtimeSupport || undefined,
                popularityScore: tool.popularityScore ?? 0,
                createdAt: normalizeDate(tool.createdAt),
                updatedAt: normalizeDate(tool.updatedAt),
              }}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 sm:mt-8">
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/tools"
          />
        </div>
      )}
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
    </div>
  );
}

function ToolsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="border rounded-2xl p-4 sm:p-5 lg:p-6 space-y-4 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const metadata = {
  title: 'MCP 工具库 - MCPHub',
  description: '发现和探索 Model Context Protocol 生态系统中的优秀工具',
};