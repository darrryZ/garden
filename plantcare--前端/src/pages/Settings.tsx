import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Moon, Shield, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SETTINGS_KEY = 'plantcare_settings';

interface LocalSettings {
  notifications: boolean;
  darkMode: boolean;
  profileVisible: boolean;
}

const DEFAULT_SETTINGS: LocalSettings = {
  notifications: true,
  darkMode: false,
  profileVisible: true,
};

export function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LocalSettings>(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings]);

  return (
    <div className="pb-24 min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold">设置</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {[
          {
            key: 'notifications' as const,
            icon: Bell,
            title: '通知设置',
            description: '接收养护提醒与系统消息',
          },
          {
            key: 'darkMode' as const,
            icon: Moon,
            title: '深色模式',
            description: '手动切换界面亮暗主题',
          },
          {
            key: 'profileVisible' as const,
            icon: Shield,
            title: '隐私设置',
            description: '控制资料页展示状态',
          },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-[28px] border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-primary flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`w-12 h-7 rounded-full transition-colors ${settings[item.key] ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}

        <div className="rounded-[28px] border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <p className="font-bold">清除缓存</p>
                <p className="text-xs text-gray-500 mt-1">删除 AI 问诊历史与设置缓存</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('plantcare_ai_history');
                localStorage.removeItem(SETTINGS_KEY);
                setSettings(DEFAULT_SETTINGS);
              }}
              className="text-sm text-red-500"
            >
              清除
            </button>
          </div>
        </div>

        <div className="rounded-[28px] bg-gray-50 p-5">
          <p className="font-bold">关于我们</p>
          <p className="text-sm text-gray-500 mt-2">智能植护致力于帮助植物爱好者更轻松地完成日常养护。</p>
          <p className="text-xs text-gray-400 mt-4">版本信息 v1.0</p>
        </div>
      </div>
    </div>
  );
}
