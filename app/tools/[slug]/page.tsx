import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/db';
import { tools, toolTags, toolCategories, tags, categories } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Github, Download, Calendar, User, FileText, Package } from 'lucide-react';
import { eq } from 'drizzle-orm';

interface ToolDetailPageProps {
  params: { slug: string };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const tool = await getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 工具头部信息 */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {tool.logoUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
                {tool.author && (
                  <p className="text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {tool.author}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {tool.repoUrl && (
                <Button asChild>
                  <Link href={tool.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Link>
                </Button>
              )}
              {tool.homepageUrl && (
                <Button variant="outline" asChild>
                  <Link href={tool.homepageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    网站
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {tool.description && (
            <p className="text-lg text-gray-700 mb-6">{tool.description}</p>
          )}

          {/* 标签和分类 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tool.categories?.map((category) => (
              <Badge key={category.slug} variant="default">
                {category.name}
              </Badge>
            ))}
            {tool.tags?.map((tag) => (
              <Badge 
                key={tag.slug} 
                variant="outline"
                style={tag.color ? { borderColor: tag.color } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* 运行时支持 */}
          {tool.runtimeSupport && (
            <div className="flex space-x-2 mb-6">
              <span className="text-sm font-medium text-gray-600">支持环境:</span>
              {tool.runtimeSupport.node && (
                <Badge variant="secondary">Node.js</Badge>
              )}
              {tool.runtimeSupport.edge && (
                <Badge variant="secondary">Edge Runtime</Badge>
              )}
              {tool.runtimeSupport.browser && (
                <Badge variant="secondary">Browser</Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 安装说明 */}
            {tool.installCmd && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    安装
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                    {tool.installCmd}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 使用示例 */}
            <Card>
              <CardHeader>
                <CardTitle>使用示例</CardTitle>
                <CardDescription>
                  以下是如何在你的项目中使用 {tool.name} 的基本示例
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <pre>{`// 基本使用示例
import { ${tool.name.replace(/[^a-zA-Z0-9]/g, '')} } from '${tool.packageName || tool.name}';

// 初始化
const tool = new ${tool.name.replace(/[^a-zA-Z0-9]/g, '')}();

// 使用
await tool.execute();`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>工具信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tool.version && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">版本</span>
                    <Badge variant="outline">{tool.version}</Badge>
                  </div>
                )}
                
                {tool.license && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      许可证
                    </span>
                    <span className="text-sm">{tool.license}</span>
                  </div>
                )}

                {tool.packageName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      包名
                    </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {tool.packageName}
                    </code>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    发布时间
                  </span>
                  <span className="text-sm">
                    {tool.createdAt ? new Date(tool.createdAt).toLocaleDateString('zh-CN') : '未知'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">最后更新</span>
                  <span className="text-sm">
                    {tool.updatedAt ? new Date(tool.updatedAt).toLocaleDateString('zh-CN') : '未知'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 相关工具推荐 */}
            <Card>
              <CardHeader>
                <CardTitle>相关工具</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  即将推出相关工具推荐功能
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getToolBySlug(slug: string) {
  const result = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      repoUrl: tools.repoUrl,
      homepageUrl: tools.homepageUrl,
      packageName: tools.packageName,
      installCmd: tools.installCmd,
      runtimeSupport: tools.runtimeSupport,
      author: tools.author,
      license: tools.license,
      logoUrl: tools.logoUrl,
      version: tools.version,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const tool = result[0];

  // 获取标签和分类
  const [toolTagsResult, toolCategoriesResult] = await Promise.all([
    db
      .select({
        slug: tags.slug,
        name: tags.name,
        color: tags.color,
      })
      .from(toolTags)
      .innerJoin(tags, eq(toolTags.tagId, tags.id))
      .where(eq(toolTags.toolId, tool.id)),
    
    db
      .select({
        slug: categories.slug,
        name: categories.name,
      })
      .from(toolCategories)
      .innerJoin(categories, eq(toolCategories.categoryId, categories.id))
      .where(eq(toolCategories.toolId, tool.id)),
  ]);

  return {
    ...tool,
    tags: toolTagsResult,
    categories: toolCategoriesResult,
  };
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug);

  if (!tool) {
    return {
      title: '工具未找到 - MCPHub',
    };
  }

  return {
    title: `${tool.name} - MCPHub`,
    description: tool.description || `了解更多关于 ${tool.name} 的信息`,
    openGraph: {
      title: tool.name,
      description: tool.description || `了解更多关于 ${tool.name} 的信息`,
      images: tool.logoUrl ? [tool.logoUrl] : [],
    },
  };
}