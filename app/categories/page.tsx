import { Suspense } from 'react';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Folder, Hash } from 'lucide-react';

export const metadata = {
  title: '分类 - MCPHub',
  description: '浏览所有工具分类，按分类探索 MCP 工具',
};

export default async function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">工具分类</h1>
        <p className="text-gray-600">
          浏览不同类别的 AI 工具，找到适合您需求的解决方案
        </p>
      </div>

      <Suspense fallback={<CategoriesListSkeleton />}>
        <CategoriesList />
      </Suspense>
    </div>
  );
}

async function CategoriesList() {
  const list = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      slug: categories.slug,
      icon: categories.icon,
    })
    .from(categories);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {list.map((category) => (
        <Link key={category.id} href={`/tools?category=${category.slug}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100"
                >
                  {category.icon ? (
                    <span className="text-xl">{category.icon}</span>
                  ) : (
                    <Folder className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600 mb-4">
                {category.description || '暂无描述'}
              </CardDescription>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {category.slug}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CategoriesListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i} className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-6 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}