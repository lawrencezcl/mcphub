interface NPMPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: {
    name: string;
    email?: string;
  } | string;
  license: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  maintainers: Array<{
    name: string;
    email: string;
  }>;
  time: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
}

interface NPMSearchResult {
  package: {
    name: string;
    version: string;
    description: string;
    keywords: string[];
    author: any;
    publisher: {
      username: string;
      email: string;
    };
    maintainers: Array<{
      username: string;
      email: string;
    }>;
    links: {
      npm: string;
      homepage?: string;
      repository?: string;
      bugs?: string;
    };
    date: string;
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
}

interface NPMSearchResponse {
  objects: NPMSearchResult[];
  total: number;
  time: string;
}

export class NPMFetcher {
  private baseUrl = 'https://registry.npmjs.org';
  private searchUrl = 'https://registry.npmjs.com/-/v1/search';

  async searchPackages(query: string, options: {
    size?: number;
    from?: number;
    quality?: number;
    popularity?: number;
    maintenance?: number;
  } = {}): Promise<NPMSearchResult[]> {
    const {
      size = 20,
      from = 0,
      quality = 0.65,
      popularity = 0.98,
      maintenance = 0.5
    } = options;

    const searchParams = new URLSearchParams({
      text: query,
      size: size.toString(),
      from: from.toString(),
      quality: quality.toString(),
      popularity: popularity.toString(),
      maintenance: maintenance.toString(),
    });

    try {
      const response = await fetch(`${this.searchUrl}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`NPM API 错误: ${response.statusText}`);
      }

      const data: NPMSearchResponse = await response.json();
      return data.objects;
    } catch (error) {
      console.error('NPM search error:', error);
      throw new Error(`NPM 搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getPackageDetails(packageName: string): Promise<NPMPackage> {
    const url = `${this.baseUrl}/${encodeURIComponent(packageName)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`包 ${packageName} 不存在`);
        }
        throw new Error(`NPM API 错误: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NPM package fetch error:', error);
      throw new Error(`获取包信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取包的README内容
  async getPackageReadme(packageName: string, version?: string): Promise<string> {
    const versionParam = version || 'latest';
    const url = `${this.baseUrl}/${encodeURIComponent(packageName)}/${versionParam}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`无法获取 ${packageName} 的README`);
        return '';
      }

      const data = await response.json();
      return data.readme || '';
    } catch (error) {
      console.error('获取README失败:', error);
      return '';
    }
  }

  // 获取包的完整元数据，包括README和其他详细信息
  async getEnhancedPackageDetails(packageName: string): Promise<{
    package: NPMPackage;
    readme: string;
    downloads: number;
    repositoryContent?: string;
  }> {
    try {
      // 并行获取包信息、README和下载统计
      const [packageData, readme, downloads] = await Promise.all([
        this.getPackageDetails(packageName),
        this.getPackageReadme(packageName),
        this.getDownloadStats(packageName)
      ]);

      // 如果有仓库URL，尝试获取仓库内容
      let repositoryContent = '';
      const repoUrl = this.extractRepositoryUrl(packageData);
      if (repoUrl) {
        try {
          // 这里可以集成GitHub API来获取更多仓库信息
          repositoryContent = await this.fetchRepositoryInfo(repoUrl);
        } catch (error) {
          console.warn('获取仓库信息失败:', error);
        }
      }

      return {
        package: packageData,
        readme,
        downloads,
        repositoryContent
      };
    } catch (error) {
      console.error('获取增强包详情失败:', error);
      throw error;
    }
  }

  // 从仓库URL获取额外信息
  private async fetchRepositoryInfo(repoUrl: string): Promise<string> {
    try {
      // 解析GitHub URL
      const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!githubMatch) {
        return '';
      }

      const [, owner, repo] = githubMatch;
      const cleanRepo = repo.replace(/\.git$/, '');
      
      // 获取仓库的README
      const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/readme`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'MCPHub-Crawler'
        }
      });

      if (response.ok) {
        return await response.text();
      }
      
      return '';
    } catch (error) {
      console.error('获取GitHub仓库信息失败:', error);
      return '';
    }
  }

  async getDownloadStats(packageName: string, period: 'last-day' | 'last-week' | 'last-month' = 'last-month'): Promise<number> {
    const url = `https://api.npmjs.org/downloads/point/${period}/${encodeURIComponent(packageName)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return 0; // 如果获取失败，返回 0
      }

      const data = await response.json();
      return data.downloads || 0;
    } catch (error) {
      console.error('NPM download stats error:', error);
      return 0;
    }
  }

  // 检查包是否与 MCP 相关
  isMCPRelated(pkg: NPMPackage | NPMSearchResult['package']): boolean {
    const mcpKeywords = [
      'mcp',
      'model context protocol',
      'context protocol',
      'anthropic',
      'claude'
    ];

    const searchText = [
      pkg.name,
      pkg.description || '',
      ...(pkg.keywords || [])
    ].join(' ').toLowerCase();

    return mcpKeywords.some(keyword => searchText.includes(keyword));
  }

  // 提取仓库 URL
  extractRepositoryUrl(pkg: NPMPackage): string | null {
    if (!pkg.repository) return null;

    if (typeof pkg.repository === 'string') {
      return pkg.repository;
    }

    if (pkg.repository.url) {
      // 清理 git+ 前缀和 .git 后缀
      return pkg.repository.url
        .replace(/^git\+/, '')
        .replace(/\.git$/, '')
        .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/');
    }

    return null;
  }

  // 提取作者信息
  extractAuthor(pkg: NPMPackage): string | null {
    if (!pkg.author) return null;

    if (typeof pkg.author === 'string') {
      return pkg.author;
    }

    return pkg.author.name || null;
  }

  // 生成安装命令
  generateInstallCommand(packageName: string): string {
    return `npm install ${packageName}`;
  }

  // 计算包的受欢迎程度分数
  calculatePopularityScore(searchResult: NPMSearchResult, downloads: number): number {
    const scoreWeight = 0.6;
    const downloadWeight = 0.4;
    
    // 标准化下载量（假设 10000 下载量为满分）
    const normalizedDownloads = Math.min(downloads / 10000, 1);
    
    return Math.round(
      (searchResult.score.final * scoreWeight + normalizedDownloads * downloadWeight) * 100
    );
  }
}