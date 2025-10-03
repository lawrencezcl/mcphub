import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 清理每个测试后的 DOM
afterEach(() => {
  cleanup();
});

// 模拟环境变量
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.ADMIN_TOKEN = 'test-admin-token';
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
});

// 模拟 Next.js 的一些功能
global.fetch = global.fetch || (() => Promise.resolve({
  json: () => Promise.resolve({}),
  ok: true,
  status: 200,
} as Response));

// 模拟 crypto.randomUUID
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  } as Crypto;
}