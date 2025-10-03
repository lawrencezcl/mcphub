import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tools, categories, tags, toolTags, toolCategories } from '@/db/schema';
import { eq, ilike, or, and, desc, sql } from 'drizzle-orm';

export const runtime = 'edge';

interface SearchSuggestion {
  type: 'tool' | 'category' | 'tag';
  id: string;
  name: string;
  description?: string;
  slug: string;
  count?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchPattern = `%${query}%`;
    const limit = 10;

    // 并行查询工具、分类和标签
    const [toolSuggestions, categorySuggestions, tagSuggestions] = await Promise.all([
      // 搜索工具
      db
        .select({
          id: tools.id,
          name: tools.name,
          description: tools.description,
          slug: tools.slug,
        })
        .from(tools)
        .where(
          and(
            eq(tools.status, 'approved'),
            or(
              ilike(tools.name, searchPattern),
              ilike(tools.description, searchPattern)
            )
          )
        )
        .orderBy(desc(tools.popularityScore))
        .limit(limit),

      // 搜索分类
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          count: sql<number>`count(${toolCategories.toolId})`.as('count'),
        })
        .from(categories)
        .leftJoin(toolCategories, eq(categories.id, toolCategories.categoryId))
        .where(ilike(categories.name, searchPattern))
        .groupBy(categories.id, categories.name, categories.slug)
        .orderBy(desc(sql`count(${toolCategories.toolId})`))
        .limit(5),

      // 搜索标签
      db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          count: sql<number>`count(${toolTags.toolId})`.as('count'),
        })
        .from(tags)
        .leftJoin(toolTags, eq(tags.id, toolTags.tagId))
        .where(ilike(tags.name, searchPattern))
        .groupBy(tags.id, tags.name, tags.slug)
        .orderBy(desc(sql`count(${toolTags.toolId})`))
        .limit(5),
    ]);

    // 格式化建议结果
    const suggestions: SearchSuggestion[] = [
      // 工具建议
      ...toolSuggestions.map(tool => ({
        type: 'tool' as const,
        id: tool.id.toString(),
        name: tool.name,
        description: tool.description || undefined,
        slug: tool.slug,
      })),
      // 分类建议
      ...categorySuggestions.map(category => ({
        type: 'category' as const,
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
        count: category.count,
      })),
      // 标签建议
      ...tagSuggestions.map(tag => ({
        type: 'tag' as const,
        id: tag.id.toString(),
        name: tag.name,
        slug: tag.slug,
        count: tag.count,
      })),
    ];

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}