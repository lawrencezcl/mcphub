import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">欢迎来到 MCPHub</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        MCP 工具导航与发现平台正在建设中...
      </p>
      <div className="text-center">
        <p className="text-sm text-gray-500">
          请访问 <Link href="/tools" className="text-blue-600 hover:underline">/tools</Link> 查看工具列表
        </p>
      </div>
    </div>
  );
}
