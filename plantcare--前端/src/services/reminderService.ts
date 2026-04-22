import { request } from '../lib/api';

// 前端 Reminder 接口（后端提醒映射）
export interface Reminder {
  id: string;
  userPlantId: string;
  type: 'water' | 'fertilize' | string;
  title: string;
  dueDate: string;
  completed: boolean;
}

// 后端提醒数据结构
interface BackendReminder {
  id: string;
  userId: string;
  userPlantId: string;
  type: string;
  title: string;
  dueDate: string;
  completed: boolean;
  recurring?: boolean;
  interval?: number;
  createdAt: string;
  updatedAt: string;
}

function mapReminder(r: BackendReminder): Reminder {
  return {
    id: r.id,
    userPlantId: r.userPlantId,
    type: r.type,
    title: r.title,
    dueDate: r.dueDate,
    completed: r.completed,
  };
}

// 获取即将到来的提醒
export async function getUpcomingReminders(days = 7): Promise<Reminder[]> {
  const res = await request<any>(
    'GET',
    `/api/reminders/upcoming?days=${days}`
  );
  if (!res.success || !res.data) return [];
  
  // 处理双重嵌套的情况
  let remindersData = res.data;
  if (remindersData.data && Array.isArray(remindersData.data)) {
    remindersData = remindersData.data;
  }
  if (!Array.isArray(remindersData)) return [];
  
  return remindersData.map(mapReminder);
}

// 标记提醒为已完成
export async function completeReminder(id: string): Promise<boolean> {
  const res = await request('POST', `/api/reminders/${id}/complete`);
  return res.success;
}
