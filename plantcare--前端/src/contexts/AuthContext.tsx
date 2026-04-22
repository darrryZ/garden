import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { request, getToken, setToken, clearToken } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // 应用启动时恢复会话
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    request<any>('GET', '/api/auth/me')
      .then((res) => {
        if (res.success && res.data) {
          // 处理双重嵌套的情况
          let userData = res.data;
          if (userData.data && userData.data.id) {
            userData = userData.data;
          }
          setUser(userData);
        } else {
          clearToken();
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // 监听 auth:logout 事件（由 api.ts 401 处理触发）
  useEffect(() => {
    const handleAuthLogout = () => logout();
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [logout]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await request<{ token: string; user: User }>('POST', '/api/auth/login', {
      email,
      password,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error ?? '登录失败');
    }
    // 处理双重嵌套：res.data = { success: true, data: { user, token } }
    const responseData = (res.data as any).data || res.data;
    setToken(responseData.token);
    setUser(responseData.user);
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<void> => {
    const res = await request<{ token: string; user: User }>('POST', '/api/auth/register', {
      username,
      email,
      password,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error ?? '注册失败');
    }
    // 处理双重嵌套
    const responseData = (res.data as any).data || res.data;
    setToken(responseData.token);
    setUser(responseData.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
