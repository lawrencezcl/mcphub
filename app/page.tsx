import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Users, Star, ExternalLink } from 'lucide-react';
import { db } from '@/db';
import { tools } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export default async function HomePage() {
  // 获取热门工具
  const featuredTools = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      popularityScore: tools.popularityScore,
      sourceScore: tools.sourceScore,
    })
    .from(tools)
    .where(eq(tools.status, 'approved'))
    .orderBy(desc(tools.popularityScore))
    .limit(6);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              发现优秀的 <span className="text-blue-600">MCP 工具</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              探索 Model Context Protocol 生态系统中的精选工具，提升您的 AI 工作流程
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/tools">
                  浏览工具库 <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/submit">
                  提交工具
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">精选工具</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              社区推荐的高质量 MCP 工具，帮助您快速找到合适的解决方案
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredTools.map((tool: any, index: number) => (
              <Card key={tool.id} className="feature-card hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {tool.name}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      工具
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4 line-clamp-3">
                    {tool.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>热度 {tool.popularityScore || 0}</span>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/tools/${tool.slug}`}>
                        查看详情 <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/tools">
                查看更多工具 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择 MCPHub</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我们致力于为开发者提供最优质的 MCP 工具发现和分享平台
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="feature-card text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">高效发现</h3>
                <p className="text-gray-600">
                  智能分类和搜索功能，帮助您快速找到所需的 MCP 工具
                </p>
              </CardContent>
            </Card>
            
            <Card className="feature-card text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">质量保证</h3>
                <p className="text-gray-600">
                  严格的审核机制，确保平台上的每个工具都经过质量验证
                </p>
              </CardContent>
            </Card>
            
            <Card className="feature-card text-center p-6">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">社区驱动</h3>
                <p className="text-gray-600">
                  开放的社区平台，鼓励开发者分享和贡献优秀的工具
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}