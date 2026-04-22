import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Check,
  Droplets,
  Scissors,
  Settings,
  ShieldAlert,
  Sprout,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [isSavingName, setIsSavingName] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [isCareSheetOpen, setIsCareSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');

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
        reader.readAsDataURL(file as File);
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
    const confirmed = window.confirm(`确认宣布 ${plant.nickname} 已死亡并移出花园吗？`);
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

  const handleOpenSettings = () => {
    if (!plant) return;
    setNicknameDraft(plant.nickname);
    setIsSettingsOpen(true);
  };

  const handleRename = async () => {
    if (!plant || isSavingName) return;

    const trimmedName = nicknameDraft.trim();
    if (!trimmedName) return;
    if (trimmedName === plant.nickname) {
      setIsSettingsOpen(false);
      return;
    }

    setIsSavingName(true);
    try {
      const success = await updateUserPlant(plant.id, { nickname: trimmedName });
      if (success) {
        await loadPlant();
        setIsSettingsOpen(false);
      }
    } finally {
      setIsSavingName(false);
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
        dueIn: waterDueIn,
      },
      {
        id: 'fertilize',
        icon: Sprout,
        title: '施肥',
        subtitle: fertilizeDueIn <= 0 ? '现在适合补充营养' : `${fertilizeDueIn} 天后需要施肥`,
        tone: 'bg-green-50 text-green-600',
        dueIn: fertilizeDueIn,
      },
      {
        id: 'prune',
        icon: Scissors,
        title: '修剪',
        subtitle: '记录一次修剪，留下养护足迹',
        tone: 'bg-amber-50 text-amber-600',
        dueIn: null,
      },
    ] as const;
  }, [plant]);

  const healthScore = plant ? getPlantHealthScore(plant) : 0;
  const healthText = getPlantHealthText(healthScore);
  const dueNowCount = careTasks.filter(task => task.dueIn !== null && task.dueIn <= 0).length;
  const nextCareHint = dueNowCount > 0 ? `有 ${dueNowCount} 项任务现在可以处理` : careTasks[0]?.subtitle ?? '展开查看今日养护安排';

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
    <div className="pb-56 min-h-screen bg-white">
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold">{plant.nickname}</h1>
        <button
          onClick={handleOpenSettings}
          className="p-2 -mr-2 text-gray-600"
          title="设置"
        >
          <Settings size={18} />
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

        <section className="mb-8">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-left transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <Trash2 size={18} />
              </div>
              <div>
                <p className="font-bold text-red-600">宣布死亡</p>
                <p className="mt-1 text-xs text-red-400">{isDeleting ? '处理中...' : '将植物移出花园并结束记录'}</p>
              </div>
            </div>
          </button>
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

      {isSettingsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-6" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold">植物设置</h3>
              <p className="mt-1 text-sm text-gray-500">修改你给植物设置的名称。</p>
            </div>
            <div className="space-y-4">
              <Input
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                placeholder="请输入植物名称"
                maxLength={20}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleRename} disabled={!nicknameDraft.trim() || isSavingName}>
                  {isSavingName ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCareSheetOpen && (
        <button
          type="button"
          aria-label="关闭养护任务面板"
          className="fixed inset-0 z-20 bg-black/20"
          onClick={() => setIsCareSheetOpen(false)}
        />
      )}

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-4">
        <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_-10px_30px_rgba(15,23,42,0.12)]">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
            onClick={() => setIsCareSheetOpen(open => !open)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-green-200" />
                <h3 className="font-bold">养护任务</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">{nextCareHint}</p>
            </div>
            <div className="rounded-full bg-gray-100 p-2 text-gray-500">
              {isCareSheetOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          </button>

          {isCareSheetOpen && (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-5">
              {careTasks.map(task => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', task.tone)}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{task.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{task.subtitle}</p>
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
          )}
        </div>
      </div>
    </div>
  );
}
