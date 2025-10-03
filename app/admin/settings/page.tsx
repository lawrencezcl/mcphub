import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  Key, 
  Users,
  Bell,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">系统设置</h1>
            <p className="text-gray-600">管理系统配置和参数</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧设置菜单 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">设置分类</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <SettingsNavItem icon={Settings} label="基本设置" active />
                <SettingsNavItem icon={Shield} label="安全设置" />
                <SettingsNavItem icon={Database} label="数据库配置" />
                <SettingsNavItem icon={Mail} label="邮件设置" />
                <SettingsNavItem icon={Globe} label="API配置" />
                <SettingsNavItem icon={Bell} label="通知设置" />
                <SettingsNavItem icon={Users} label="用户管理" />
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* 右侧设置内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<SettingsSkeleton />}>
            <BasicSettings />
          </Suspense>
          
          <Suspense fallback={<SettingsSkeleton />}>
            <SecuritySettings />
          </Suspense>
          
          <Suspense fallback={<SettingsSkeleton />}>
            <DatabaseSettings />
          </Suspense>
          
          <Suspense fallback={<SettingsSkeleton />}>
            <APISettings />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ 
  icon: Icon, 
  label, 
  active = false 
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
}) {
  return (
    <button
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

async function BasicSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          基本设置
        </CardTitle>
        <CardDescription>配置系统的基本信息和参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">网站名称</Label>
            <Input id="site-name" defaultValue="MCPHub" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-url">网站URL</Label>
            <Input id="site-url" defaultValue="https://mcphub.io" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="site-description">网站描述</Label>
          <Textarea 
            id="site-description" 
            defaultValue="发现和分享最优质的MCP工具"
            rows={3}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">功能开关</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>用户注册</Label>
                <p className="text-sm text-gray-500">允许新用户注册账号</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>工具提交</Label>
                <p className="text-sm text-gray-500">允许用户提交新工具</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>评论功能</Label>
                <p className="text-sm text-gray-500">启用工具评论功能</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          安全设置
        </CardTitle>
        <CardDescription>配置系统安全相关参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin-token">管理员令牌</Label>
            <div className="flex space-x-2">
              <Input 
                id="admin-token" 
                type="password" 
                defaultValue="••••••••••••••••" 
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-secret">定时任务密钥</Label>
            <div className="flex space-x-2">
              <Input 
                id="cron-secret" 
                type="password" 
                defaultValue="••••••••••••••••" 
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">安全策略</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>强制HTTPS</Label>
                <p className="text-sm text-gray-500">重定向所有HTTP请求到HTTPS</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>API速率限制</Label>
                <p className="text-sm text-gray-500">启用API请求频率限制</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP白名单</Label>
                <p className="text-sm text-gray-500">仅允许白名单IP访问管理后台</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">安全提醒</h4>
              <p className="text-sm text-yellow-700 mt-1">
                请定期更新管理员令牌和其他敏感配置，确保系统安全。
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function DatabaseSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          数据库配置
        </CardTitle>
        <CardDescription>数据库连接和性能设置</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-url">数据库连接字符串</Label>
            <Input 
              id="db-url" 
              type="password" 
              defaultValue="postgresql://••••••••••••••••" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db-pool-min">最小连接数</Label>
              <Input id="db-pool-min" type="number" defaultValue="2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-pool-max">最大连接数</Label>
              <Input id="db-pool-max" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-timeout">连接超时(ms)</Label>
              <Input id="db-timeout" type="number" defaultValue="30000" />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">数据库状态</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">正常</div>
              <div className="text-xs text-gray-500">连接状态</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">8/10</div>
              <div className="text-xs text-gray-500">活跃连接</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">45ms</div>
              <div className="text-xs text-gray-500">平均延迟</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">2.3GB</div>
              <div className="text-xs text-gray-500">存储使用</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function APISettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          API配置
        </CardTitle>
        <CardDescription>外部API和服务配置</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-token">GitHub Token</Label>
            <div className="flex space-x-2">
              <Input 
                id="github-token" 
                type="password" 
                defaultValue="ghp_••••••••••••••••" 
                className="flex-1"
              />
              <Badge variant="secondary" className="text-green-600">已配置</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
            <div className="flex space-x-2">
              <Input 
                id="deepseek-key" 
                type="password" 
                defaultValue="sk-••••••••••••••••" 
                className="flex-1"
              />
              <Badge variant="secondary" className="text-green-600">已配置</Badge>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">API限制设置</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate-limit">请求频率限制 (次/分钟)</Label>
              <Input id="rate-limit" type="number" defaultValue="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">请求超时时间 (秒)</Label>
              <Input id="timeout" type="number" defaultValue="30" />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium">缓存设置</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用Redis缓存</Label>
                <p className="text-sm text-gray-500">使用Redis进行数据缓存</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>CDN缓存</Label>
                <p className="text-sm text-gray-500">启用CDN边缘缓存</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}