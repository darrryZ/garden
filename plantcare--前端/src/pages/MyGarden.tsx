import { useState, useEffect } from 'react';
import { Plus, Wrench, MessageSquare, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlants } from '@/services/userPlantService';
import { getUpcomingReminders, type Reminder } from '@/services/reminderService';
import { WeatherBackground } from '@/components/WeatherBackground';
import { DateDisplay } from '@/components/DateDisplay';
import { getWeather, type WeatherData, getWeatherIcon } from '@/services/weatherService';
import type { OwnedPlant } from '@/types';



// 天气信息组件
function WeatherInfo({ city }: { city: string }) {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const data = await getWeather(city);
      if (data) setWeather(data);
    } catch (err) {
      // 静默失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchWeather();
  };

  // 点击跳转到城市选择页面
  const handleCityClick = () => {
    navigate('/city-select');
  };

  return (
    <div 
      className="text-right cursor-pointer transition-opacity hover:opacity-80"
      onClick={handleCityClick}
      title="点击选择城市"
    >
      <div className="flex items-start justify-end gap-2">
        <button 
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-white/50 transition-colors"
          title="刷新天气"
        >
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div>
          <span className="text-3xl font-light text-gray-800">{weather?.temperature ?? 27}°</span>
          <span className="text-xl ml-1">{weather ? getWeatherIcon(weather.condition) : '🌤️'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
        <MapPin size={12} />
        {weather?.location ?? '上海市'}
      </p>
    </div>
  );
}

export function MyGarden() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plants, setPlants] = useState<OwnedPlant[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState(() => {
    // 从 localStorage 读取保存的城市（优先使用 selectedCity，兼容旧版 weatherCity）
    return localStorage.getItem('selectedCity') || localStorage.getItem('weatherCity') || 'Shanghai';
  });

  // 监听 localStorage 变化（从城市选择页返回时更新）
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCity = localStorage.getItem('selectedCity') || localStorage.getItem('weatherCity');
      if (savedCity && savedCity !== currentCity) {
        setCurrentCity(savedCity);
      }
    };
    
    // 每秒检查一次 localStorage
    const checkInterval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(checkInterval);
  }, [currentCity]);



  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([getUserPlants(), getUpcomingReminders(7)])
      .then(([plantsData, remindersData]) => {
        setPlants(plantsData);
        setReminders(remindersData);
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  // 等待认证状态初始化 - 仍然显示背景和天气
  if (authLoading) {
    return (
      <div className="pb-24 min-h-screen bg-sky-50/50 relative">
        <WeatherBackground defaultCity={currentCity} />
        <div className="relative z-10 pt-12 pb-8 px-6 flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-gray-400">加载中...</div>
        </div>
      </div>
    );
  }

  // 未登录：显示登录引导 - 仍然显示背景和天气
  if (!isAuthenticated) {
    return (
      <div className="pb-24 min-h-screen bg-sky-50/50 relative">
        <WeatherBackground defaultCity={currentCity} />
        <div className="relative z-10 pt-12 pb-8 px-6 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-500 text-center">登录后即可查看你的花园</p>
          <Button onClick={() => navigate('/login')} className="rounded-xl px-8">
            去登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-sky-50/50 relative">
      {/* 天气渐变背景 - 全宽 */}
      <WeatherBackground defaultCity={currentCity} />
      
      {/* 顶部内容区域 */}
      <div className="relative z-10 pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-gray-800">{user?.username ?? '我'}的花园</h1>
            <DateDisplay className="text-sm text-gray-500" />
          </div>
          {/* 天气信息 - 右上角 */}
          <WeatherInfo city={currentCity} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/ai-consultation" className="w-full">
            <Button className="w-full bg-primary/40 hover:bg-primary/50 text-primary-foreground rounded-xl py-6 flex gap-2 border-none">
              <MessageSquare size={18} />
              AI在线问诊
            </Button>
          </Link>
          <Button className="bg-green-100 hover:bg-green-200 text-green-700 rounded-xl py-6 flex gap-2 border-none">
            <Wrench size={18} />
            工具库
          </Button>
        </div>
      </div>

      <div className="px-6 relative z-10">
        <div className="bg-green-600 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 mb-8 relative">
          <span className="text-xs">这里是对主人说的话</span>
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-green-600 rotate-45" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="aspect-square mb-3 bg-gray-200 rounded-[32px]" />
                <div className="bg-gray-100 rounded-2xl p-3 h-12" />
              </div>
            ))}
          </div>
        ) : plants.length === 0 ? (
          // 花园为空：引导添加第一株植物
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-gray-400 text-sm text-center">你的花园还没有植物，快去添加第一株吧！</p>
            <Link to="/all-plants">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 border-2 border-dashed border-primary/20 rounded-[32px] flex items-center justify-center">
                  <Plus size={32} className="text-primary/40" />
                </div>
                <div className="bg-white/50 rounded-2xl px-6 py-2 border border-dashed border-primary/10">
                  <h3 className="font-bold text-sm text-gray-300">添加</h3>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {plants.map((plant) => (
              <Link key={plant.id} to={`/garden/${plant.id}`} className="flex flex-col">
                <div className="aspect-square mb-3 relative">
                  <img
                    src={plant.image}
                    alt={plant.nickname}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-primary/10 shadow-sm">
                  <h3 className="font-bold text-sm">{plant.nickname}</h3>
                  <p className="text-[10px] text-gray-400">{plant.addedDate}</p>
                </div>
              </Link>
            ))}

            <Link to="/all-plants" className="flex flex-col">
              <div className="aspect-square mb-3 border-2 border-dashed border-primary/20 rounded-[32px] flex items-center justify-center hover:bg-primary/5 transition-colors">
                <Plus size={32} className="text-primary/40" />
              </div>
              <div className="bg-white/50 rounded-2xl p-3 text-center border border-dashed border-primary/10">
                <h3 className="font-bold text-sm text-gray-300">添加</h3>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
