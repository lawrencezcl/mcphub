import Link from 'next/link';
import { db } from '@/db';
import { tags } from '@/db/schema';

export const metadata = {
  title: '标签 - MCPHub',
  description: '浏览所有工具标签，按标签探索 MCP 工具',
};

export default async function TagsPage() {
  const list = await db.select({ slug: tags.slug, name: tags.name, color: tags.color }).from(tags);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">工具标签</h1>
        <p className="text-gray-600">按标签浏览与筛选 MCP 工具</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">暂无标签</p>
          <p className="text-gray-500">稍后再试，或前往工具列表进行搜索</p>
          <div className="mt-6">
            <Link href="/tools" className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">
              浏览所有工具
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => (
            <Link
              key={t.slug}
              href={`/tools?tag=${encodeURIComponent(t.slug)}`}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
              style={t.color ? { borderColor: t.color } : undefined}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-gray-500">点击查看该标签下的工具</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}