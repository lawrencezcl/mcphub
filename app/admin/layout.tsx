import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Database, 
  CheckCircle, 
  Settings, 
  Activity,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回前台
              </Link>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-6">管理后台</h2>
            
            <nav className="space-y-2">
              <NavLink href="/admin" icon={LayoutDashboard}>
                仪表板
              </NavLink>
              <NavLink href="/admin/sources" icon={Database}>
                数据源管理
              </NavLink>
              <NavLink href="/admin/ingests" icon={CheckCircle}>
                审核工具
              </NavLink>
              <NavLink href="/admin/crawl" icon={Activity}>
                爬取任务
              </NavLink>
              <NavLink href="/admin/settings" icon={Settings}>
                系统设置
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  icon: any; 
  children: React.ReactNode; 
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
}