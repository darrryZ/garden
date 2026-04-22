import { request } from '@/lib/api';

// 搜索结果类型
export interface SearchResult {
  id: string;
  name: string;
  type: string; // 'plant' | 'knowledge'
  content: string;
  relevance?: number;
}

// 后端搜索响应格式
interface BackendSearchData {
  type: string;
  title: string;
  content: string;
  plant?: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
}

// 搜索函数：调用 GET /api/search?q={query}
export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const response = await request<any>('GET', `/api/search?q=${encodeURIComponent(query.trim())}`);

  if (!response.success || !response.data) {
    return [];
  }

  // 处理双重嵌套的情况
  let data = response.data;
  if (data.data && data.data.type) {
    data = data.data;
  }

  // 后端返回单个结果对象，转换为数组格式
  return [{
    id: data.plant?.id || data.type,
    name: data.plant?.name || data.title,
    type: data.plant ? 'plant' : 'knowledge',
    content: data.content,
  }];
}
