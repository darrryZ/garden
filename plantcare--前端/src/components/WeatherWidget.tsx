import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeather, type WeatherData, getWeatherIcon } from '@/services/weatherService';
import { MapPin, RefreshCw } from 'lucide-react';

interface WeatherWidgetProps {
  defaultCity?: string;
  className?: string;
}

export function WeatherWidget({ defaultCity = 'Shanghai', className = '' }: WeatherWidgetProps) {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState(() => {
    // 从本地存储读取上次选择的城市
    return localStorage.getItem('selectedCity') || defaultCity;
  });

  // 获取天气
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeather(city);
      if (data) {
        setWeather(data);
      } else {
        setError('获取天气失败');
      }
    } catch (err) {
      setError('获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // 每30分钟刷新一次
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  // 监听本地存储变化（当从城市选择页返回时）
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCity = localStorage.getItem('selectedCity');
      if (savedCity && savedCity !== city) {
        setCity(savedCity);
      }
    };
    
    // 每秒检查一次本地存储（简单方案）
    const checkInterval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(checkInterval);
  }, [city]);

  // 点击刷新
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchWeather();
  };

  // 点击跳转到城市选择页面
  const handleCityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('点击天气，准备跳转到城市选择页面');
    navigate('/city-select', { replace: false });
  };

  // 加载状态
  if (loading && !weather) {
    return (
      <div className={`text-right ${className}`}>
        <span className="text-3xl font-light">--°</span>
        <p className="text-xs text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div 
      className={`text-right cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      onClick={handleCityClick}
      title="点击选择城市"
    >
      <div className="flex items-start justify-end gap-2">
        <button 
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="刷新天气"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div>
          <span className="text-3xl font-light">{weather?.temperature ?? 27}°</span>
          <span className="text-xl ml-1">{weather ? getWeatherIcon(weather.condition) : '🌤️'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
        <MapPin size={12} />
        {weather?.location ?? '上海市'}
      </p>
    </div>
  );
}
