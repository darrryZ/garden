import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, Sun, Thermometer, Droplets, Calendar, Trophy, Plus, Check, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import type { OwnedPlant, Milestone } from '@/types';
import { getUserPlantById } from '@/services/userPlantService';
import { getDiaryEntries, createDiaryEntry } from '@/services/diaryService';

export function OwnedPlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 植物数据状态
  const [plant, setPlant] = useState<OwnedPlant | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 里程碑输入状态
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneContent, setMilestoneContent] = useState('');
  const [milestonePhotos, setMilestonePhotos] = useState<string[]>([]);
  const [milestoneMood, setMilestoneMood] = useState('happy');
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 心情选项
  const moodOptions = [
    { value: 'happy', emoji: '🌱', label: '开心' },
    { value: 'excited', emoji: '🌸', label: '兴奋' },
    { value: 'tired', emoji: '🍃', label: '疲惫' },
    { value: 'sad', emoji: '🥀', label: '难过' },
  ];

  // 加载植物数据
  useEffect(() => {
    if (!id) return;
    
    const loadPlant = async () => {
      setIsLoading(true);
      try {
        const userPlant = await getUserPlantById(id);
        if (userPlant) {
          setPlant(userPlant);
          // 加载日记作为里程碑
          const entries = await getDiaryEntries(id);
          setMilestones(entries);
        }
      } catch (err) {
        console.error('Failed to load plant:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlant();
  }, [id]);

  // 处理图片选择
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).slice(0, 3 - milestonePhotos.length).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMilestonePhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 移除已选图片
  const removePhoto = (index: number) => {
    setMilestonePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // 添加里程碑
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
      
      // 刷新里程碑列表
      const entries = await getDiaryEntries(id);
      setMilestones(entries);
      
      // 重置表单
      setMilestoneTitle('');
      setMilestoneContent('');
      setMilestonePhotos([]);
      setMilestoneMood('happy');
      setShowMilestoneInput(false);
    } catch (err) {
      console.error('Failed to create milestone:', err);
    }
  };

  if (isLoading) return <div className="p-6">加载中...</div>;
  if (!plant) return <div>Plant not found</div>;

  return (
    <div className="pb-40 min-h-screen bg-white">
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold">{plant.nickname}</h1>
        <button className="p-2 -mr-2 text-gray-400 flex items-center gap-1 text-xs">
          icon设置
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
            <p className="text-xs text-gray-500 mb-2">植物类别 某个科</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              难度🌟 室外植物
            </div>
            <Badge className="bg-primary hover:bg-primary text-white border-none rounded-lg px-4 py-1 mb-2">
              健康
            </Badge>
            <button className="text-[10px] text-gray-400 flex items-center gap-1">
              养护技巧 <ChevronLeft size={10} className="rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-orange-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Sun size={18} className="text-orange-400" />
            <span className="text-[10px] font-bold">光照</span>
            <span className="text-[8px] text-gray-400">喜欢阳光</span>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Thermometer size={18} className="text-red-400" />
            <span className="text-[10px] font-bold">温度</span>
            <span className="text-[8px] text-gray-400">18°C - 25°C</span>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Droplets size={18} className="text-blue-400" />
            <span className="text-[10px] font-bold">湿度</span>
            <span className="text-[8px] text-gray-400">非常喜喝水</span>
          </div>
        </div>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 rounded-lg" />
              <h3 className="font-bold">养护日历</h3>
            </div>
            <button className="text-xs text-gray-400">查看全部</button>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
             <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-full border border-gray-100 flex items-center justify-center text-[10px]">
                    {i === 9 ? '💧' : i === 15 ? '☁️' : i === 18 ? '☀️' : i === 19 ? '💧' : ''}
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
            <button className="text-xs text-gray-400">icon保存</button>
          </div>
          
          {/* 分支式时间线 */}
          <div className="relative">
            {/* 中央主干线 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-200 -translate-x-1/2" />
            
            {/* 里程碑列表 */}
            <div className="space-y-8">
              {milestones.slice().reverse().map((m, i) => (
                <div key={m.id} className="relative flex items-center">
                  {/* 左侧内容 */}
                  <div className={cn("flex-1 pr-4", i % 2 === 0 ? "visible" : "invisible")}>
                    {i % 2 === 0 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{m.date}</span>
                          <h4 className="font-bold text-sm">{m.title}</h4>
                        </div>
                        {m.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.description}</p>
                        )}
                        {/* 图片展示 */}
                        {m.photos && m.photos.length > 0 ? (
                          <div className={cn(
                            "grid gap-1 rounded-xl overflow-hidden",
                            m.photos.length === 1 ? "grid-cols-1 aspect-video" :
                            m.photos.length === 2 ? "grid-cols-2 aspect-[2/1]" :
                            "grid-cols-3 aspect-[3/1]"
                          )}>
                            {m.photos.slice(0, 3).map((photo: string, idx: number) => (
                              <img key={idx} src={photo} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{m.mood ? (m.mood === 'happy' ? '🌱' : m.mood === 'sad' ? '🥀' : m.mood === 'excited' ? '🌸' : m.mood === 'tired' ? '🍃' : '🌿') : '🌿'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 中央节点 */}
                  <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-green-400 flex-shrink-0" />
                  
                  {/* 右侧内容 */}
                  <div className={cn("flex-1 pl-4", i % 2 === 1 ? "visible" : "invisible")}>
                    {i % 2 === 1 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{m.date}</span>
                          <h4 className="font-bold text-sm">{m.title}</h4>
                        </div>
                        {m.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.description}</p>
                        )}
                        {/* 图片展示 */}
                        {m.photos && m.photos.length > 0 ? (
                          <div className={cn(
                            "grid gap-1 rounded-xl overflow-hidden",
                            m.photos.length === 1 ? "grid-cols-1 aspect-video" :
                            m.photos.length === 2 ? "grid-cols-2 aspect-[2/1]" :
                            "grid-cols-3 aspect-[3/1]"
                          )}>
                            {m.photos.slice(0, 3).map((photo: string, idx: number) => (
                              <img key={idx} src={photo} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{m.mood ? (m.mood === 'happy' ? '🌱' : m.mood === 'sad' ? '🥀' : m.mood === 'excited' ? '🌸' : m.mood === 'tired' ? '🍃' : '🌿') : '🌿'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 添加新里程碑 */}
              <div className="relative flex items-center">
                <div className="flex-1 pr-4" />
                <div className="relative z-10 w-4 h-4 rounded-full bg-gray-200 border-2 border-white flex-shrink-0" />
                <div className="flex-1 pl-4">
                  {!showMilestoneInput ? (
                    <button 
                      onClick={() => setShowMilestoneInput(true)}
                      className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center hover:border-green-400 transition-colors"
                    >
                      <Plus size={24} className="text-gray-300" />
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
                      
                      {/* 心情选择 */}
                      <div className="flex gap-2">
                        {moodOptions.map((mood) => (
                          <button
                            key={mood.value}
                            onClick={() => setMilestoneMood(mood.value)}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all",
                              milestoneMood === mood.value ? "bg-green-100 ring-2 ring-green-400" : "bg-gray-50 hover:bg-gray-100"
                            )}
                            title={mood.label}
                          >
                            {mood.emoji}
                          </button>
                        ))}
                      </div>
                      
                      {/* 图片上传 */}
                      <div className="flex gap-2">
                        {milestonePhotos.map((photo, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <img src={photo} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(idx)}
                              className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {milestonePhotos.length < 3 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-400 transition-colors"
                          >
                            <Camera size={20} className="text-gray-400" />
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

        <Button variant="destructive" className="w-full py-8 rounded-2xl font-bold text-lg mb-8">
          宣布死亡
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-primary/40 backdrop-blur-xl rounded-t-[40px] p-8 z-50">
        <div className="flex justify-between items-center mb-6 text-white">
          <h3 className="text-xl font-bold">今日任务</h3>
          <button className="text-xs opacity-80">一键完成</button>
        </div>
        <div className="space-y-3">
          {plant.tasks && plant.tasks.length > 0 ? (
            plant.tasks.map((task) => (
              <div key={task.id} className="bg-white/90 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-bold text-gray-800">{task.title}</span>
                <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center text-white">
                  <Check size={16} />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/90 rounded-2xl p-4 text-center text-gray-500">
              暂无任务
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
