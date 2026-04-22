import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Lock, User, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, updateProfile } from '@/services/userService';

export function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updates: { username?: string; bio?: string; avatar?: string } = {};
      
      if (username !== user?.username) {
        updates.username = username;
      }
      if (bio !== user?.bio) {
        updates.bio = bio;
      }
      if (avatar !== user?.avatar) {
        updates.avatar = avatar;
      }

      const shouldChangePassword = !!(passwordForm.oldPassword || passwordForm.newPassword || passwordForm.confirmPassword);

      if (shouldChangePassword) {
        if (passwordForm.newPassword.length < 6) {
          throw new Error('新密码至少需要 6 位');
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          throw new Error('两次输入的新密码不一致');
        }

        const passwordChanged = await changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        });

        if (!passwordChanged) {
          throw new Error('密码修改失败');
        }
      }

      if (Object.keys(updates).length === 0) {
        navigate('/profile');
        return;
      }

      const updatedUser = await updateProfile(updates);
      if (updatedUser) {
        setUser(updatedUser);
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const avatarFallback = username.charAt(0).toUpperCase();

  return (
    <div className="pb-24 min-h-screen bg-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold">编辑资料</h1>
          <div className="w-10" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8">
        {/* 头像 */}
        <div className="flex flex-col items-center mb-10">
          <div 
            onClick={handleAvatarClick}
            className="relative w-28 h-28 rounded-full overflow-hidden cursor-pointer group"
          >
            {avatar ? (
              <img 
                src={avatar} 
                alt="avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-600">
                {avatarFallback}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={28} className="text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-gray-400 mt-3">点击更换头像</p>
        </div>

        {/* 用户名 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            昵称
          </label>
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="请输入昵称"
              maxLength={20}
            />
          </div>
        </div>

        {/* 个性签名 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            个性签名
          </label>
          <div className="relative">
            <FileText size={20} className="absolute left-4 top-4 text-gray-400" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all resize-none"
              placeholder="写点什么介绍自己..."
              maxLength={100}
              rows={3}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/100</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 保存按钮 */}
        <div className="mb-6 mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">修改密码</h2>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="原密码（可选）"
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="新密码（至少 6 位）"
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="确认新密码"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}
