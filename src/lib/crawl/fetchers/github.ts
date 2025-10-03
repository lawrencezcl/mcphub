interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  license: {
    key: string;
    name: string;
  } | null;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepository[];
}

export class GitHubFetcher {
  private apiKey?: string;
  private baseUrl = 'https://api.github.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const {
      sort = 'stars',
      order = 'desc',
      per_page = 30,
      page = 1
    } = options;

    const searchQuery = encodeURIComponent(`${query} in:name,description,readme`);
    const url = `${this.baseUrl}/search/repositories?q=${searchQuery}&sort=${sort}&order=${order}&per_page=${per_page}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API 速率限制，请稍后重试');
        }
        throw new Error(`GitHub API 错误: ${response.statusText}`);
      }

      const data: GitHubSearchResponse = await response.json();
      return data.items;
    } catch (error) {
      console.error('GitHub search error:', error);
      throw new Error(`GitHub 搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API 错误: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub repo fetch error:', error);
      throw new Error(`获取仓库信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getReadme(owner: string, repo: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/readme`;

    try {
      const response = await fetch(url, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/vnd.github.raw',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return ''; // README 不存在
        }
        throw new Error(`GitHub API 错误: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('GitHub README fetch error:', error);
      return ''; // 获取失败时返回空字符串
    }
  }

  // 获取多个文档文件内容
  async getDocumentationFiles(owner: string, repo: string): Promise<{
    readme: string;
    docs: string[];
    examples: string[];
  }> {
    try {
      const [readme, docsContent, examplesContent] = await Promise.all([
        this.getReadme(owner, repo),
        this.getDirectoryContents(owner, repo, 'docs'),
        this.getDirectoryContents(owner, repo, 'examples')
      ]);

      return {
        readme,
        docs: docsContent,
        examples: examplesContent
      };
    } catch (error) {
      console.error('获取文档文件失败:', error);
      return {
        readme: '',
        docs: [],
        examples: []
      };
    }
  }

  // 获取目录内容
  private async getDirectoryContents(owner: string, repo: string, path: string): Promise<string[]> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const contents = await response.json();
      if (!Array.isArray(contents)) {
        return [];
      }

      // 获取markdown文件内容
      const markdownFiles = contents.filter((item: any) => 
        item.type === 'file' && 
        (item.name.endsWith('.md') || item.name.endsWith('.txt'))
      );

      const fileContents = await Promise.all(
        markdownFiles.map(async (file: any) => {
          try {
            const fileResponse = await fetch(file.download_url);
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              return `=== ${file.name} ===\n${content}\n`;
            }
            return '';
          } catch (error) {
            console.error(`获取文件 ${file.name} 失败:`, error);
            return '';
          }
        })
      );

      return fileContents.filter(content => content.length > 0);
    } catch (error) {
      console.error(`获取目录 ${path} 内容失败:`, error);
      return [];
    }
  }

  // 获取增强的仓库信息，包括所有相关文档
  async getEnhancedRepositoryInfo(owner: string, repo: string): Promise<{
    repository: GitHubRepository;
    readme: string;
    packageJson: any;
    documentation: {
      readme: string;
      docs: string[];
      examples: string[];
    };
    additionalFiles: string[];
  }> {
    try {
      const [repository, packageJson, documentation, additionalFiles] = await Promise.all([
        this.getRepository(owner, repo),
        this.getPackageJson(owner, repo),
        this.getDocumentationFiles(owner, repo),
        this.getAdditionalConfigFiles(owner, repo)
      ]);

      return {
        repository,
        readme: documentation.readme,
        packageJson,
        documentation,
        additionalFiles
      };
    } catch (error) {
      console.error('获取增强仓库信息失败:', error);
      throw error;
    }
  }

  // 获取额外的配置文件
  private async getAdditionalConfigFiles(owner: string, repo: string): Promise<string[]> {
    const configFiles = [
      'tsconfig.json',
      '.mcprc.json',
      'mcp.config.json',
      'config.json',
      'settings.json'
    ];

    const fileContents = await Promise.all(
      configFiles.map(async (filename) => {
        try {
          const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${filename}`;
          const response = await fetch(url, {
            headers: {
              ...this.getHeaders(),
              'Accept': 'application/vnd.github.raw',
            },
          });

          if (response.ok) {
            const content = await response.text();
            return `=== ${filename} ===\n${content}\n`;
          }
          return '';
        } catch (error) {
          return '';
        }
      })
    );

    return fileContents.filter(content => content.length > 0);
  }

  async getPackageJson(owner: string, repo: string): Promise<any> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/package.json`;

    try {
      const response = await fetch(url, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/vnd.github.raw',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // package.json 不存在
        }
        throw new Error(`GitHub API 错误: ${response.statusText}`);
      }

      const content = await response.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('GitHub package.json fetch error:', error);
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCPHub-Crawler/1.0',
    };

    if (this.apiKey) {
      headers['Authorization'] = `token ${this.apiKey}`;
    }

    return headers;
  }

  // 检查仓库是否与 MCP 相关
  isMCPRelated(repo: GitHubRepository, readme: string, packageJson: any): boolean {
    const mcpKeywords = [
      'model context protocol',
      'mcp',
      'context protocol',
      'anthropic mcp',
      'claude mcp'
    ];

    const searchText = [
      repo.name,
      repo.description || '',
      readme,
      ...(repo.topics || []),
      packageJson?.description || '',
      packageJson?.keywords?.join(' ') || ''
    ].join(' ').toLowerCase();

    return mcpKeywords.some(keyword => searchText.includes(keyword));
  }

  // 提取安装命令
  extractInstallCommand(packageJson: any, repo: GitHubRepository): string | null {
    if (packageJson?.name) {
      return `npm install ${packageJson.name}`;
    }

    // 如果没有 package.json，尝试从 README 中提取
    return `git clone ${repo.clone_url}`;
  }
}