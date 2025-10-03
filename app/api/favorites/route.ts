import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { favorites, tools } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 获取工具收藏状态（临时使用IP地址作为用户标识）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');
    
    if (!toolId) {
      return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
    }

    // 临时使用IP地址作为用户标识
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

    // 检查是否已收藏（使用IP作为临时用户ID）
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userIp.hashCode()), // 简单hash IP作为用户ID
          eq(favorites.toolId, parseInt(toolId))
        )
      )
      .limit(1);

    return NextResponse.json({ 
      isFavorited: existing.length > 0,
      count: existing.length 
    });
  } catch (error) {
    console.error('获取收藏状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const { toolId } = await request.json();
    if (!toolId) {
      return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
    }

    // 临时使用IP地址作为用户标识
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';
    const userId = userIp.hashCode(); // 简单hash IP作为用户ID

    // 检查是否已经收藏
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.toolId, toolId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: '已经收藏过该工具' }, { status: 409 });
    }

    // 添加收藏
    await db.insert(favorites).values({
      userId: userId,
      toolId: toolId,
    });

    return NextResponse.json({ success: true, message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');
    
    if (!toolId) {
      return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
    }

    // 临时使用IP地址作为用户标识
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';
    const userId = userIp.hashCode(); // 简单hash IP作为用户ID

    // 删除收藏
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.toolId, parseInt(toolId))
        )
      );

    return NextResponse.json({ success: true, message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 扩展String原型以添加hashCode方法
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};