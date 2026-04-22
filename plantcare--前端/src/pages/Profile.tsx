import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, MessageSquare, Heart, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlants } from '@/services/userPlantService';

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // 植物数量统计
  const [plantCount, setPlantCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      getUserPlants().then((plants) => setPlantCount(plants.length));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 加载中占位
  if (isLoading) {
    return (
      <div className="pb-24 min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
      </div>
    );
  }

  // 未登录：显示登录引导
  if (!isAuthenticated) {
    return (
      <div className="pb-24 min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500 text-center">登录后查看个人资料</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 rounded-2xl bg-primary text-white font-bold"
        >
          去登录
        </button>
      </div>
    );
  }

  // 已登录：显示用户信息
  const avatarFallback = user!.username.charAt(0).toUpperCase();

  return (
    <div className="pb-24 min-h-screen bg-white">
      <div className="relative pt-20 pb-12 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-50 to-transparent -z-10" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 -z-10" />
        
        <div className="flex justify-between items-center mb-12">
          <div 
            onClick={() => navigate('/edit-profile')}
            className="cursor-pointer group flex-1"
          >
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 group-hover:text-green-600 transition-colors">
              {user!.username} <ChevronRight size={24} className="text-gray-300 group-hover:text-green-400" />
            </h1>
            {user!.bio ? (
              <p className="text-sm text-gray-500 group-hover:text-green-500 transition-colors line-clamp-1">{user!.bio}</p>
            ) : (
              <p className="text-xs text-gray-400 tracking-wider group-hover:text-green-500 transition-colors">点击编辑资料</p>
            )}
          </div>
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
            {user!.avatar && <AvatarImage src={user!.avatar} />}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12 text-center">
          <div>
            <div className="text-2xl font-bold mb-1">{plantCount}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">累计植物数</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">233天</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">养护天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">12</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">心愿单</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/60 to-primary/30 rounded-3xl p-8 text-white flex justify-between items-center mb-12 shadow-lg shadow-primary/10">
          <div>
            <h2 className="text-5xl font-black italic tracking-tighter opacity-90">VIP</h2>
          </div>
          <button className="flex items-center gap-2 font-bold text-lg">
            升级VIP <ChevronRight size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <button className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-primary">
                <Heart size={20} />
              </div>
              <span className="font-bold">我的收藏</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
          
          <button className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-primary">
                <Settings size={20} />
              </div>
              <span className="font-bold">设置</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-primary">
                <MessageSquare size={20} />
              </div>
              <span className="font-bold">问题反馈</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-red-500">退出登录</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
