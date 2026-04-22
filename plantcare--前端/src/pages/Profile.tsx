import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, MessageSquare, Heart, LogOut, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlants } from '@/services/userPlantService';
import { getFavorites } from '@/services/favoriteService';

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [plantCount, setPlantCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [careDays, setCareDays] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([getUserPlants(), getFavorites()]).then(([plants, favorites]) => {
      setPlantCount(plants.length);
      setWishlistCount(favorites.length);

      if (plants.length === 0) {
        setCareDays(0);
        return;
      }

      const firstDate = plants
        .map(plant => new Date(plant.addedDate))
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      if (!firstDate) {
        setCareDays(0);
        return;
      }

      setCareDays(Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (24 * 60 * 60 * 1000))));
    });
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = useMemo(
    () => [
      {
        label: '我的收藏',
        icon: Heart,
        onClick: () => navigate('/favorites'),
      },
      {
        label: '设置',
        icon: Settings,
        onClick: () => navigate('/settings'),
      },
      {
        label: '问题反馈',
        icon: MessageSquare,
        onClick: () => navigate('/feedback'),
      },
    ],
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="pb-24 min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-24 min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500 text-center">登录后查看个人资料</p>
        <button onClick={() => navigate('/login')} className="px-8 py-3 rounded-2xl bg-primary text-white font-bold">
          去登录
        </button>
      </div>
    );
  }

  const avatarFallback = user!.username.charAt(0).toUpperCase();

  return (
    <div className="pb-24 min-h-screen bg-white">
      <div className="relative pt-20 pb-12 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-50 to-transparent -z-10" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 -z-10" />

        <div className="flex justify-between items-center mb-12">
          <div onClick={() => navigate('/edit-profile')} className="cursor-pointer group flex-1">
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
            <div className="text-2xl font-bold mb-1">{careDays}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">养护天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">{wishlistCount}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">心愿单</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-gradient-to-r from-primary/60 to-primary/30 rounded-3xl p-8 text-white flex justify-between items-center mb-12 shadow-lg shadow-primary/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Crown size={28} />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-black tracking-tight opacity-90">VIP 功能筹备中</h2>
              <p className="text-sm text-white/80 mt-1">已开放设置入口与权益说明，后续将继续补齐。</p>
            </div>
          </div>
          <ChevronRight size={20} />
        </button>

        <div className="space-y-6">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-primary">
                    <Icon size={20} />
                  </div>
                  <span className="font-bold">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            );
          })}

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
