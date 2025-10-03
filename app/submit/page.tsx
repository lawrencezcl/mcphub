import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Package, 
  Globe, 
  Github, 
  Tag, 
  Folder,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const metadata = {
  title: '提交工具 - MCPHub',
  description: '向 MCPHub 提交新的 MCP 工具，与社区分享优秀工具',
};

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">提交 MCP 工具</h1>
          <p className="text-gray-600">
            分享您发现或开发的优秀 MCP 工具，帮助更多开发者发现和使用
          </p>
        </div>

        {/* 提交须知 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              提交须知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                确保工具符合 Model Context Protocol 规范
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                提供准确的工具信息和描述
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                工具应该是开源或有公开文档
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                提交后将由管理员审核，通过后会在平台上展示
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 提交表单 */}
        <Card>
          <CardHeader>
            <CardTitle>工具信息</CardTitle>
            <CardDescription>
              请填写完整的工具信息，带 * 的字段为必填项
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  基本信息
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">工具名称 *</Label>
                    <Input 
                      id="name" 
                      placeholder="例如：@modelcontextprotocol/server-filesystem"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="author">作者</Label>
                    <Input 
                      id="author" 
                      placeholder="例如：Anthropic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">工具描述 *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="简要描述工具的功能和用途..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">分类 *</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="选择工具分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                      <SelectItem value="development">Development Tools</SelectItem>
                      <SelectItem value="data-processing">Data Processing</SelectItem>
                      <SelectItem value="web-scraping">Web Scraping</SelectItem>
                      <SelectItem value="api-integration">API Integration</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* 链接信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  链接信息
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repoUrl">GitHub 仓库 *</Label>
                    <Input 
                      id="repoUrl" 
                      type="url"
                      placeholder="https://github.com/username/repository"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npmUrl">NPM 包地址</Label>
                    <Input 
                      id="npmUrl" 
                      type="url"
                      placeholder="https://www.npmjs.com/package/package-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docsUrl">文档地址</Label>
                    <Input 
                      id="docsUrl" 
                      type="url"
                      placeholder="https://docs.example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo 地址</Label>
                    <Input 
                      id="logoUrl" 
                      type="url"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 技术信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  技术信息
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="runtime">运行时环境</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择运行时" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nodejs">Node.js</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="browser">Browser</SelectItem>
                        <SelectItem value="edge-runtime">Edge Runtime</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">开源协议</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择协议" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIT">MIT</SelectItem>
                        <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                        <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                        <SelectItem value="BSD-3-Clause">BSD 3-Clause</SelectItem>
                        <SelectItem value="ISC">ISC</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">标签</Label>
                  <Input 
                    id="tags" 
                    placeholder="用逗号分隔，例如：typescript, ai, automation"
                  />
                  <p className="text-sm text-gray-500">
                    添加相关标签帮助用户更好地发现您的工具
                  </p>
                </div>
              </div>

              <Separator />

              {/* 联系信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">联系信息</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="your@email.com"
                  />
                  <p className="text-sm text-gray-500">
                    可选，用于审核结果通知和后续沟通
                  </p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  提交工具
                </Button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  提交后我们会在 1-3 个工作日内完成审核
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}