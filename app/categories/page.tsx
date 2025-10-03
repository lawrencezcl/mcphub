import Link from 'next/link';
import { db } from '@/db';
import { categories } from '@/db/schema';

export const metadata = {
  title: '分类 - MCPHub',
  description: '浏览所有工具分类，按分类探索 MCP 工具',
};

export default async function CategoriesPage() {
  const list = await db.select({ slug: categories.slug, name: categories.name }).from(categories);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">工具分类</h1>
        <p className="text-gray-600">按分类浏览与筛选 MCP 工具</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">暂无分类</p>
          <p className="text-gray-500">稍后再试，或前往工具列表进行搜索</p>
          <div className="mt-6">
            <Link href="/tools" className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">
              浏览所有工具
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <Link
              key={c.slug}
              href={`/tools?category=${encodeURIComponent(c.slug)}`}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-500">点击查看该分类下的工具</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}