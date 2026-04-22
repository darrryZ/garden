import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Droplets,
  Scissors,
  ShieldAlert,
  Sprout,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { OwnedPlant, Milestone } from '@/types';
import { deleteUserPlant, getUserPlantById, updateUserPlant } from '@/services/userPlantService';
import { getDiaryEntries, createDiaryEntry } from '@/services/diaryService';
import { formatDateLabel, getDaysUntilDue, getPlantHealthLabel, getPlantHealthScore, getPlantHealthText } from '@/lib/care';

export function OwnedPlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plant, setPlant] = useState<OwnedPlant | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneContent, setMilestoneContent] = useState('');
  const [milestonePhotos, setMilestonePhotos] = useState<string[]>([]);
  const [milestoneMood, setMilestoneMood] = useState('happy');
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moodOptions = [
    { value: 'happy', emoji: '🌱', label: '开心' },
    { value: 'excited', emoji: '🌸', label: '兴奋' },
    { value: 'tired', emoji: '🍃', label: '疲惫' },
    { value: 'sad', emoji: '🥀', label: '难过' },
  ];

  const loadPlant = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const [userPlant, entries] = await Promise.all([
        getUserPlantById(id),
        getDiaryEntries(id),
      ]);

      if (userPlant) {
        const healthScore = getPlantHealthScore(userPlant);
        userPlant.healthStatus = getPlantHealthLabel(healthScore);
      }

      setPlant(userPlant);
      setMilestones(entries);
    } catch (err) {
      console.error('Failed to load plant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlant();
  }, [id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files)
      .slice(0, 3 - milestonePhotos.length)
      .forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMilestonePhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (index: number) => {
    setMilestonePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMilestone = async () => {
    if (!milestoneTitle.trim() || !id) return;

    try {
      await createDiaryEntry({
        userPlantId: id,
        title: milestoneTitle,
        content: milestoneContent,
        mood: milestoneMood,
        photos: milestonePhotos,
      });

      await loadPlant();
      setMilestoneTitle('');
      setMilestoneContent('');
      setMilestonePhotos([]);
      setMilestoneMood('happy');
      setShowMilestoneInput(false);
    } catch (err) {
      console.error('Failed to create milestone:', err);
    }
  };

  const handleCareAction = async (type: 'water' | 'fertilize' | 'prune') => {
    if (!plant) return;

    setActionKey(type);
    const today = new Date().toISOString().split('T')[0];

    try {
      if (type === 'prune') {
        await createDiaryEntry({
          userPlantId: plant.id,
          title: '完成修剪',
          content: '今天为植物做了一次修剪整理。',
          mood: 'happy',
        });
      } else {
        await updateUserPlant(plant.id, type === 'water' ? { lastWatered: today } : { lastFertilized: today });
      }

      await loadPlant();
    } finally {
      setActionKey(null);
    }
  };

  const handleDelete = async () => {
    if (!plant || isDeleting) return;
    const confirmed = window.confirm(`确认将 ${plant.nickname} 移出花园吗？`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const success = await deleteUserPlant(plant.id);
      if (success) {
        navigate('/garden');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const careTasks = useMemo(() => {
    if (!plant) return [];

    const waterDueIn = getDaysUntilDue(plant.lastWatered, plant.waterFrequency ?? 7);
    const fertilizeDueIn = getDaysUntilDue(plant.lastFertilized, plant.fertilizeFrequency ?? 30);

    return [
      {
        id: 'water',
        icon: Droplets,
        title: '浇水',
        subtitle: waterDueIn <= 0 ? '现在就可以浇水' : `${waterDueIn} 天后需要浇水`,
        tone: 'bg-blue-50 text-blue-600',
      },
      {
        id: 'fertilize',
        icon: Sprout,
        title: '施肥',
        subtitle: fertilizeDueIn <= 0 ? '现在适合补充营养' : `${fertilizeDueIn} 天后需要施肥`,
        tone: 'bg-green-50 text-green-600',
      },
      {
        id: 'prune',
        icon: Scissors,
        title: '修剪',
        subtitle: '记录一次修剪，留下养护足迹',
        tone: 'bg-amber-50 text-amber-600',
      },
    ] as const;
  }, [plant]);

  const healthScore = plant ? getPlantHealthScore(plant) : 0;
  const healthText = getPlantHealthText(healthScore);

  const careCalendar = useMemo(() => {
    if (!plant) return [];

    const events: Record<string, string> = {};
    if (plant.lastWatered) events[plant.lastWatered] = '💧';
    if (plant.lastFertilized) events[plant.lastFertilized] = '🌿';
    milestones.slice(0, 6).forEach(item => {
      const date = item.date.replaceAll('.', '-');
      events[date] = '📝';
    });

    return Array.from({ length: 21 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (20 - index));
      const key = date.toISOString().split('T')[0];
      return {
        key,
        label: date.getDate(),
        icon: events[key] || '',
        isToday: key === new Date().toISOString().split('T')[0],
      };
    });
  }, [milestones, plant]);

  if (isLoading) return <div className="p-6">加载中...</div>;
  if (!plant) return <div className="p-6">Plant not found</div>;

  return (
    <div className="pb-40 min-h-screen bg-white">
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold">{plant.nickname}</h1>
        <button
          onClick={handleDelete}
          className="p-2 -mr-2 text-red-500"
          disabled={isDeleting}
          title="移出花园"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="px-6">
        <div className="flex gap-6 mb-8">
          <div className="w-1/2 aspect-square">
            <img
              src={plant.image}
              alt={plant.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="w-1/2 pt-4">
            <h2 className="text-2xl font-bold mb-1">{plant.nickname}</h2>
            <p className="text-xs text-gray-400 mb-2">{plant.addedDate}</p>
            <p className="text-xs text-gray-500 mb-2">{plant.family || '室内观赏植物'}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              难度 {'⭐'.repeat(plant.difficultyLevel || 3)}
            </div>
            <Badge className="bg-primary hover:bg-primary text-white border-none rounded-lg px-4 py-1 mb-2">
              {plant.healthStatus === 'Healthy' ? '状态良好' : plant.healthStatus === 'Warning' ? '需要关注' : '急需照顾'}
            </Badge>
            <p className="text-[10px] text-gray-400">上次浇水：{formatDateLabel(plant.lastWatered)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-orange-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Sprout size={18} className="text-orange-400" />
            <span className="text-[10px] font-bold">光照</span>
            <span className="text-[8px] text-gray-400 text-center">{plant.light}</span>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Thermometer size={18} className="text-red-400" />
            <span className="text-[10px] font-bold">温度</span>
            <span className="text-[8px] text-gray-400">{plant.temperature}</span>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Droplets size={18} className="text-blue-400" />
            <span className="text-[10px] font-bold">湿度</span>
            <span className="text-[8px] text-gray-400">{plant.humidity}</span>
          </div>
        </div>

        <section className="mb-8 bg-green-50 rounded-[28px] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">健康状态评估</h3>
            <span className="text-sm font-bold text-green-700">{healthScore}/100</span>
          </div>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${healthScore}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-3">{healthText}</p>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 rounded-lg" />
              <h3 className="font-bold">养护任务</h3>
            </div>
          </div>
          <div className="space-y-3">
            {careTasks.map(task => {
              const Icon = task.icon;
              return (
                <div key={task.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', task.tone)}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{task.subtitle}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={actionKey === task.id}
                      onClick={() => handleCareAction(task.id)}
                    >
                      {actionKey === task.id ? '处理中...' : '完成'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 rounded-lg" />
              <h3 className="font-bold">养护日历</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-7 gap-2">
              {careCalendar.map(day => (
                <div
                  key={day.key}
                  className={cn(
                    'aspect-square rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-[10px]',
                    day.isToday && 'bg-primary/10 border-primary/20'
                  )}
                >
                  <span>{day.label}</span>
                  <span>{day.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 rounded-lg" />
              <h3 className="font-bold">里程碑</h3>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-200 -translate-x-1/2" />
            <div className="space-y-8">
              {milestones.slice().reverse().map((m, i) => (
                <div key={m.id} className="relative flex items-center">
                  <div className={cn('flex-1 pr-4', i % 2 === 0 ? 'visible' : 'invisible')}>
                    {i % 2 === 0 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{m.date}</span>
                          <h4 className="font-bold text-sm">{m.title}</h4>
                        </div>
                        {m.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.description}</p>}
                        {m.photos && m.photos.length > 0 ? (
                          <div className={cn('grid gap-1 rounded-xl overflow-hidden', m.photos.length === 1 ? 'grid-cols-1 aspect-video' : m.photos.length === 2 ? 'grid-cols-2 aspect-[2/1]' : 'grid-cols-3 aspect-[3/1]')}>
                            {m.photos.slice(0, 3).map((photo: string, idx: number) => (
                              <img key={idx} src={photo} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🌿</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-green-400 flex-shrink-0" />

                  <div className={cn('flex-1 pl-4', i % 2 === 1 ? 'visible' : 'invisible')}>
                    {i % 2 === 1 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{m.date}</span>
                          <h4 className="font-bold text-sm">{m.title}</h4>
                        </div>
                        {m.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.description}</p>}
                        {m.photos && m.photos.length > 0 ? (
                          <div className={cn('grid gap-1 rounded-xl overflow-hidden', m.photos.length === 1 ? 'grid-cols-1 aspect-video' : m.photos.length === 2 ? 'grid-cols-2 aspect-[2/1]' : 'grid-cols-3 aspect-[3/1]')}>
                            {m.photos.slice(0, 3).map((photo: string, idx: number) => (
                              <img key={idx} src={photo} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🌿</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="relative flex items-center">
                <div className="flex-1 pr-4" />
                <div className="relative z-10 w-4 h-4 rounded-full bg-gray-200 border-2 border-white flex-shrink-0" />
                <div className="flex-1 pl-4">
                  {!showMilestoneInput ? (
                    <button
                      onClick={() => setShowMilestoneInput(true)}
                      className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center hover:border-green-400 transition-colors"
                    >
                      <Check size={24} className="text-gray-300" />
                    </button>
                  ) : (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                      <input
                        type="text"
                        placeholder="标题"
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <textarea
                        placeholder="内容（可选）"
                        value={milestoneContent}
                        onChange={(e) => setMilestoneContent(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                      />

                      <div className="flex gap-2">
                        {moodOptions.map(mood => (
                          <button
                            key={mood.value}
                            onClick={() => setMilestoneMood(mood.value)}
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all',
                              milestoneMood === mood.value ? 'bg-green-100 ring-2 ring-green-400' : 'bg-gray-50 hover:bg-gray-100'
                            )}
                            title={mood.label}
                          >
                            {mood.emoji}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {milestonePhotos.map((photo, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <img src={photo} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(idx)}
                              className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {milestonePhotos.length < 3 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-400 transition-colors"
                          >
                            +
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddMilestone} disabled={!milestoneTitle.trim()}>
                          保存
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowMilestoneInput(false)}>
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 bg-gray-50 rounded-[28px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={18} className="text-primary" />
            <h3 className="font-bold">植物医生</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/ai-consultation', { state: { prompt: `${plant.name} 叶子发黄怎么办？` } })}
              className="w-full text-left bg-white rounded-2xl p-4 text-sm font-medium border border-gray-100"
            >
              叶子发黄怎么办？
            </button>
            <button
              onClick={() => navigate('/ai-consultation', { state: { prompt: `${plant.name} 今天需要注意什么？` } })}
              className="w-full text-left bg-white rounded-2xl p-4 text-sm font-medium border border-gray-100"
            >
              一键咨询 AI
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
