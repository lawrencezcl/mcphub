import { NextRequest } from 'next/server';
import { ApiError, ErrorCode } from './api-response';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, '缺少认证令牌', 401);
  }

  const token = authHeader.substring(7);
  
  // 简单的 token 验证（生产环境应使用更安全的方式）
  if (token !== process.env.ADMIN_TOKEN) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, '无效的认证令牌', 401);
  }

  return { role: 'admin' };
}

export async function getUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // 这里应该实现真正的 JWT 验证
    // 暂时返回 null，表示未登录用户
    return null;
  } catch {
    return null;
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const user = await getUser(request);
    
    if (!user) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '需要登录', 401);
    }

    // 暂时跳过角色检查，因为 getUser 返回 null
    // if (!allowedRoles.includes(user.role)) {
    //   throw new ApiError(ErrorCode.FORBIDDEN, '权限不足', 403);
    // }

    return user;
  };
}

// 中间件辅助函数
export function createAuthMiddleware(requiredRole?: string) {
  return async (request: NextRequest) => {
    if (requiredRole === 'admin') {
      return await requireAdmin(request);
    }
    
    return await getUser(request);
  };
}