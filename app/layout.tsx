import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../src/app/globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCPHub - MCP 工具导航与发现平台",
  description: "发现和探索 Model Context Protocol 生态系统中的优秀工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  MCPHub
                </Link>
                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="/tools" className="text-gray-600 hover:text-gray-900 transition-colors">
                    工具库
                  </Link>
                  <Link href="/categories" className="text-gray-600 hover:text-gray-900 transition-colors">
                    分类
                  </Link>
                  <Link href="/tags" className="text-gray-600 hover:text-gray-900 transition-colors">
                    标签
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/submit">
                    提交工具
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="https://github.com/your-username/mcphub" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <footer className="border-t bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">MCPHub</h3>
                <p className="text-gray-600 text-sm">
                  MCP 工具导航与发现平台，帮助开发者找到最适合的工具。
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">工具</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/tools" className="text-gray-600 hover:text-gray-900">浏览工具</Link></li>
                  <li><Link href="/submit" className="text-gray-600 hover:text-gray-900">提交工具</Link></li>
                  <li><Link href="/categories" className="text-gray-600 hover:text-gray-900">分类浏览</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">资源</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/docs" className="text-gray-600 hover:text-gray-900">文档</Link></li>
                  <li><Link href="/api" className="text-gray-600 hover:text-gray-900">API</Link></li>
                  <li><Link href="/blog" className="text-gray-600 hover:text-gray-900">博客</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">社区</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="https://github.com/your-username/mcphub" className="text-gray-600 hover:text-gray-900">GitHub</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-gray-900">联系我们</Link></li>
                  <li><Link href="/about" className="text-gray-600 hover:text-gray-900">关于我们</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
              <p>&copy; 2024 MCPHub. All rights reserved.</p>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}