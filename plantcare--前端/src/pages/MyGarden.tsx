import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  CalendarCheck2,
  Droplets,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Sprout,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlants, updateUserPlant } from '@/services/userPlantService';
import { WeatherBackground } from '@/components/WeatherBackground';
import { DateDisplay } from '@/components/DateDisplay';
import { getWeather, type WeatherData, getWeatherIcon } from '@/services/weatherService';
import { formatDateLabel, getCareMessage, getDaysUntilDue, getPlantHealthScore } from '@/lib/care';
import type { OwnedPlant } from '@/types';

function WeatherInfo({
  city,
  onWeatherChange,
}: {
  city: string;
  onWeatherChange?: (weather: WeatherData | null) => void;
}) {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const data = await getWeather(city);
      setWeather(data);
      onWeatherChange?.(data);
    } catch {
      onWeatherChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const handleRefresh = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fetchWeather();
  };

  return (
    <div
      className="text-right cursor-pointer transition-opacity hover:opacity-80"
      onClick={() => navigate('/city-select')}
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

function getWeatherBubble(weather: WeatherData | null) {
  const condition = weather?.condition ?? '';

  if (/雨|rain/i.test(condition)) {
    return '今天空气湿润，记得把植物放在通风处，避免盆土积水。';
  }

  if (/晴|clear|sun/i.test(condition)) {
    return '天气晴朗，适合让喜光植物晒晒太阳。';
  }

  if (/云|cloud/i.test(condition)) {
    return '今天光线柔和，适合观察叶片状态并简单整理枝叶。';
  }

  return '今天也和植物们打个招呼吧，它们在等你照顾。';
}

export function MyGarden() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plants, setPlants] = useState<OwnedPlant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('selectedCity') || localStorage.getItem('weatherCity') || 'Shanghai';
  });

  const reloadPlants = async () => {
    if (!isAuthenticated) return;
    const plantsData = await getUserPlants();
    setPlants(plantsData);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCity = localStorage.getItem('selectedCity') || localStorage.getItem('weatherCity');
      if (savedCity && savedCity !== currentCity) {
        setCurrentCity(savedCity);
      }
    };

    const checkInterval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(checkInterval);
  }, [currentCity]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    reloadPlants().finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const careTasks = useMemo(() => {
    return plants
      .flatMap(plant => {
        const waterDueIn = getDaysUntilDue(plant.lastWatered, plant.waterFrequency ?? 7);
        const fertilizeDueIn = getDaysUntilDue(plant.lastFertilized, plant.fertilizeFrequency ?? 30);

        return [
          {
            key: `${plant.id}-water`,
            plant,
            type: 'water' as const,
            title: waterDueIn <= 0 ? '今天浇水' : `${waterDueIn}天后浇水`,
            dueIn: waterDueIn,
          },
          {
            key: `${plant.id}-fertilize`,
            plant,
            type: 'fertilize' as const,
            title: fertilizeDueIn <= 0 ? '今天施肥' : `${fertilizeDueIn}天后施肥`,
            dueIn: fertilizeDueIn,
          },
        ];
      })
      .sort((a, b) => a.dueIn - b.dueIn);
  }, [plants]);

  const dueTasks = useMemo(() => careTasks.filter(task => task.dueIn <= 0), [careTasks]);
  const upcomingTasks = useMemo(() => careTasks.filter(task => task.dueIn > 0).slice(0, 4), [careTasks]);
  const averageHealth = useMemo(() => {
    if (plants.length === 0) return 100;
    return Math.round(plants.reduce((total, plant) => total + getPlantHealthScore(plant), 0) / plants.length);
  }, [plants]);

  const careDays = useMemo(() => {
    if (plants.length === 0) return 0;
    const firstDate = plants
      .map(plant => new Date(plant.addedDate))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (!firstDate) return 0;
    return Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (24 * 60 * 60 * 1000)));
  }, [plants]);

  const bubbleMessage = useMemo(() => {
    if (dueTasks.length > 0) {
      return getCareMessage(dueTasks[0].plant);
    }

    if (plants.length > 0) {
      return `${getWeatherBubble(weather)} ${getCareMessage(plants[0])}`;
    }

    return getWeatherBubble(weather);
  }, [dueTasks, plants, weather]);

  const handleCareAction = async (plant: OwnedPlant, type: 'water' | 'fertilize') => {
    const key = `${plant.id}-${type}`;
    setActionKey(key);

    const today = new Date().toISOString().split('T')[0];
    const payload =
      type === 'water'
        ? { lastWatered: today }
        : { lastFertilized: today };

    try {
      await updateUserPlant(plant.id, payload);
      await reloadPlants();
    } finally {
      setActionKey(null);
    }
  };

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
      <WeatherBackground defaultCity={currentCity} />

      <div className="relative z-10 pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-gray-800">{user?.username ?? '我'}的花园</h1>
            <DateDisplay className="text-sm text-gray-500" />
          </div>
          <WeatherInfo city={currentCity} onWeatherChange={setWeather} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/ai-consultation" className="w-full">
            <Button className="w-full bg-primary/40 hover:bg-primary/50 text-primary-foreground rounded-xl py-6 flex gap-2 border-none">
              <MessageSquare size={18} />
              AI在线问诊
            </Button>
          </Link>
          <Button
            className="bg-green-100 hover:bg-green-200 text-green-700 rounded-xl py-6 flex gap-2 border-none"
            onClick={() => setIsToolsOpen(true)}
          >
            <Wrench size={18} />
            工具库
          </Button>
        </div>
      </div>

      <div className="px-6 relative z-10 space-y-6">
        <div className="bg-green-600 text-white px-4 py-3 rounded-3xl inline-flex items-start gap-3 mb-2 relative max-w-[85%]">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span className="text-xs leading-5">{bubbleMessage}</span>
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-green-600 rotate-45" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/90 rounded-3xl p-4 border border-white/70 shadow-sm">
            <p className="text-xs text-gray-400 mb-2">植物总数</p>
            <p className="text-2xl font-bold text-gray-800">{plants.length}</p>
          </div>
          <div className="bg-white/90 rounded-3xl p-4 border border-white/70 shadow-sm">
            <p className="text-xs text-gray-400 mb-2">健康评分</p>
            <p className="text-2xl font-bold text-gray-800">{averageHealth}</p>
          </div>
          <div className="bg-white/90 rounded-3xl p-4 border border-white/70 shadow-sm">
            <p className="text-xs text-gray-400 mb-2">养护天数</p>
            <p className="text-2xl font-bold text-gray-800">{careDays}</p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">今日待办</h2>
            <span className="text-xs text-gray-500">{dueTasks.length} 项待完成</span>
          </div>

          {dueTasks.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-5 border border-white/70 text-sm text-gray-500">
              今天暂无紧急任务，继续保持这份好状态。
            </div>
          ) : (
            dueTasks.slice(0, 3).map(task => (
              <div key={task.key} className="bg-white/90 rounded-3xl p-4 border border-white/70 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{task.plant.nickname}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.type === 'water' ? '浇水提醒' : '施肥提醒'}</p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full px-4"
                    disabled={actionKey === task.key}
                    onClick={() => handleCareAction(task.plant, task.type)}
                  >
                    {actionKey === task.key ? '记录中...' : '立即完成'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {[1, 2].map(i => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="aspect-square mb-3 bg-gray-200 rounded-[32px]" />
                <div className="bg-gray-100 rounded-2xl p-3 h-12" />
              </div>
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-gray-400 text-sm text-center">你的花园还没有植物，快去添加第一株吧！</p>
            <Link to="/all-plants">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 border-2 border-dashed border-primary/20 rounded-[32px] flex items-center justify-center">
                  <Sprout size={32} className="text-primary/40" />
                </div>
                <div className="bg-white/50 rounded-2xl px-6 py-2 border border-dashed border-primary/10">
                  <h3 className="font-bold text-sm text-gray-300">添加</h3>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {plants.map(plant => (
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
                  <p className="text-[10px] text-gray-400 mt-1">
                    上次浇水：{formatDateLabel(plant.lastWatered)}
                  </p>
                </div>
              </Link>
            ))}

            <Link to="/all-plants" className="flex flex-col">
              <div className="aspect-square mb-3 border-2 border-dashed border-primary/20 rounded-[32px] flex items-center justify-center hover:bg-primary/5 transition-colors">
                <Sprout size={32} className="text-primary/40" />
              </div>
              <div className="bg-white/50 rounded-2xl p-3 text-center border border-dashed border-primary/10">
                <h3 className="font-bold text-sm text-gray-300">添加</h3>
              </div>
            </Link>
          </div>
        )}
      </div>

      {isToolsOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">工具库</h2>
                <p className="text-sm text-gray-500 mt-1">快速记录浇水、施肥并查看提醒节奏</p>
              </div>
              <button onClick={() => setIsToolsOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Link
                to="/ai-consultation"
                className="block rounded-3xl bg-green-50 p-4 border border-green-100"
                onClick={() => setIsToolsOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-green-600" size={18} />
                  <div>
                    <p className="font-bold text-gray-800">病虫害识别</p>
                    <p className="text-xs text-gray-500 mt-1">上传描述或图片，快速进入 AI 问诊。</p>
                  </div>
                </div>
              </Link>

              {plants.map(plant => (
                <div key={plant.id} className="rounded-3xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-bold text-gray-800">{plant.nickname}</p>
                      <p className="text-xs text-gray-500 mt-1">{getCareMessage(plant)}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                      健康 {getPlantHealthScore(plant)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl bg-blue-50 p-3">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Droplets size={16} />
                        <span className="text-xs font-bold">浇水记录</span>
                      </div>
                      <p className="text-xs text-gray-500">上次：{formatDateLabel(plant.lastWatered)}</p>
                      <p className="text-xs text-gray-500 mt-1">频率：每 {plant.waterFrequency ?? 7} 天</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-3">
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <CalendarCheck2 size={16} />
                        <span className="text-xs font-bold">施肥日历</span>
                      </div>
                      <p className="text-xs text-gray-500">上次：{formatDateLabel(plant.lastFertilized)}</p>
                      <p className="text-xs text-gray-500 mt-1">频率：每 {plant.fertilizeFrequency ?? 30} 天</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      className="rounded-2xl"
                      disabled={actionKey === `${plant.id}-water`}
                      onClick={() => handleCareAction(plant, 'water')}
                    >
                      {actionKey === `${plant.id}-water` ? '记录中...' : '一键浇水打卡'}
                    </Button>
                    <Button
                      className="rounded-2xl"
                      disabled={actionKey === `${plant.id}-fertilize`}
                      onClick={() => handleCareAction(plant, 'fertilize')}
                    >
                      {actionKey === `${plant.id}-fertilize` ? '记录中...' : '记录施肥'}
                    </Button>
                  </div>
                </div>
              ))}

              {upcomingTasks.length > 0 && (
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="font-bold text-gray-800 mb-3">未来提醒</p>
                  <div className="space-y-2">
                    {upcomingTasks.map(task => (
                      <div key={task.key} className="flex items-center justify-between text-sm text-gray-600">
                        <span>{task.plant.nickname} · {task.type === 'water' ? '浇水' : '施肥'}</span>
                        <span>{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
