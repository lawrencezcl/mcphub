import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shares, tools } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// 创建分享链接
export async function POST(request: NextRequest) {
  try {
    const { toolId, platform = 'link' } = await request.json();
    
    if (!toolId) {
      return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
    }

    // 验证工具是否存在
    const tool = await db
      .select({ id: tools.id, slug: tools.slug, name: tools.name })
      .from(tools)
      .where(eq(tools.id, toolId))
      .limit(1);

    if (tool.length === 0) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    // 生成唯一分享ID
    const shareId = nanoid(10);
    
    // 获取用户信息
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // 记录分享
    await db.insert(shares).values({
      toolId: toolId,
      shareId: shareId,
      platform: platform,
      userAgent: userAgent,
      ipAddress: ipAddress,
    });

    // 构建分享链接
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/tools/${tool[0].slug}?share=${shareId}`;

    // 根据平台生成不同的分享内容
    const shareContent = generateShareContent(tool[0], shareUrl, platform);

    return NextResponse.json({
      success: true,
      shareId: shareId,
      shareUrl: shareUrl,
      ...shareContent
    });
  } catch (error) {
    console.error('创建分享链接失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 获取分享统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');
    
    if (!toolId) {
      return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
    }

    // 获取分享统计
    const shareStats = await db
      .select({
        platform: shares.platform,
        count: sql<number>`count(*)`
      })
      .from(shares)
      .where(eq(shares.toolId, parseInt(toolId)))
      .groupBy(shares.platform);

    const totalShares = shareStats.reduce((sum: number, stat: any) => sum + stat.count, 0);

    return NextResponse.json({
      totalShares,
      byPlatform: shareStats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.platform] = stat.count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('获取分享统计失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 生成不同平台的分享内容
function generateShareContent(tool: any, shareUrl: string, platform: string) {
  const title = `${tool.name} - MCP Hub`;
  const description = `发现这个很棒的MCP工具：${tool.name}`;
  
  switch (platform) {
    case 'twitter':
      return {
        text: `${description} ${shareUrl} #MCP #AI #Tools`,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${description} ${shareUrl} #MCP #AI #Tools`)}`
      };
    
    case 'linkedin':
      return {
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
      };
    
    case 'facebook':
      return {
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
      };
    
    case 'email':
      return {
        subject: title,
        body: `${description}\n\n查看详情：${shareUrl}`,
        url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n查看详情：${shareUrl}`)}`
      };
    
    case 'wechat':
      return {
        title: title,
        description: description,
        url: shareUrl,
        // 微信分享需要前端处理
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
      };
    
    case 'weibo':
      return {
        text: `${description} ${shareUrl}`,
        url: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(description)}`
      };
    
    default:
      return {
        title: title,
        description: description,
        url: shareUrl
      };
  }
}