export interface Plant {
  id: string;
  name: string;
  scientificName?: string;
  family?: string; // 科属
  category: 'Outdoor' | 'Indoor' | 'Office' | 'Others';
  originalCategory?: string; // 后端原始分类: foliage/flowering/succulent/herbaceous/vine
  image: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  difficultyLevel?: number; // 1-5 难度等级
  light: string;
  temperature: string;
  humidity: string;
  size: 'Small' | 'Medium' | 'Large';
  tags?: string[]; // 标签：新手友好、耐阴、净化空气等
}

export interface OwnedPlant extends Plant {
  nickname: string;
  addedDate: string;
  healthStatus: 'Healthy' | 'Warning' | 'Critical';
  lastWatered?: string;
  milestones: Milestone[];
  tasks: Task[];
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description?: string;
  image?: string;
  photos?: string[]; // 多张图片
  mood?: string; // 心情
  tasks?: Task[]; // 当天的任务
  isLeft?: boolean; // 时间线左右分支
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}
