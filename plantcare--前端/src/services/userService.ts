import { request } from '../lib/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatar?: string;
}

interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

// 更新用户资料
export async function updateProfile(data: UpdateProfileData): Promise<UserProfile | null> {
  try {
    const res = await request<{ success: boolean; data: UserProfile }>('PUT', '/api/auth/profile', data);
    if (res.success && res.data) {
      return (res.data as any).data || (res.data as any);
    }
    return null;
  } catch (error) {
    console.error('更新资料失败:', error);
    throw error;
  }
}

// 上传头像
export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error('上传失败');
    }
    
    const data = await res.json();
    return data.url || null;
  } catch (error) {
    console.error('上传头像失败:', error);
    // 如果没有上传接口，返回 base64 数据
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }
}

export async function changePassword(data: ChangePasswordData): Promise<boolean> {
  try {
    const res = await request<{ success: boolean }>('POST', '/api/auth/change-password', data);
    return !!res.success;
  } catch (error) {
    console.error('修改密码失败:', error);
    throw error;
  }
}
