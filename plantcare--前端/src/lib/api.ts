const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Token 管理
export const TOKEN_KEY = 'plantcare_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 核心请求函数
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, init);

    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
      return { success: false, error: '未授权，请重新登录' };
    }

    if (!response.ok) {
      let errorMsg = `请求失败 (${response.status})`;
      try {
        const errData = await response.json();
        if (errData?.error) errorMsg = errData.error;
        else if (errData?.message) errorMsg = errData.message;
      } catch {
        // 忽略 JSON 解析失败
      }
      return { success: false, error: errorMsg };
    }

    const data = await response.json() as T;
    return { success: true, data };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '网络连接失败';
    return { success: false, error: errorMsg };
  }
}
