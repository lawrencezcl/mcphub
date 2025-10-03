import { Suspense } from 'react';
import { db } from '@/db';
import { tools, categories, tags } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ToolCard } from '@/components/cards/ToolCard';
import { ToolFilters } from '@/components/filters/ToolFilters';
import { Skeleton } from '@/components/ui/skeleton';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            发现最好的 AI 工具
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            精选的 Model Context Protocol 工具集合，助力您的工作和创意
          </p>
        </div>

        {/* Filters Section */}
        <section className="mb-12">
          <Suspense fallback={<FiltersSkeleton />}>
            <FiltersSection />
          </Suspense>
        </section>

        {/* Featured Tools Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">精选工具</h2>
          </div>
          <Suspense fallback={<FeaturedToolsSkeleton />}>
            <FeaturedTools />
          </Suspense>
        </section>
      </div>
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

async function FeaturedTools() {
  const featuredTools = await db
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
      updatedAt: tools.updatedAt
    })
    .from(tools)
    .where(eq(tools.status, 'approved'))
    .orderBy(desc(tools.createdAt))
    .limit(6);

  // 转换数据格式以匹配ToolCard的期望类型
  const formattedTools = featuredTools.map(tool => ({
    ...tool,
    id: tool.id.toString(),
    createdAt: tool.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: tool.updatedAt?.toISOString() || new Date().toISOString(),
    description: tool.description || '',
    author: tool.author || undefined,
    logoUrl: tool.logoUrl || undefined,
    repoUrl: tool.repoUrl || undefined,
    homepageUrl: tool.homepageUrl || undefined,
    runtimeSupport: tool.runtimeSupport || undefined,
    popularityScore: tool.popularityScore || undefined,
    tags: [],
    stats: {
      likes: 0,
      favorites: 0,
      downloads: 0,
      views: 0
    }
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {formattedTools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function FeaturedToolsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
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