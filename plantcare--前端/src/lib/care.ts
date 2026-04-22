import type { OwnedPlant } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function formatDateLabel(value?: string): string {
  if (!value) return '未记录';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function getDaysUntilDue(lastDate: string | undefined, frequency = 7): number {
  if (!lastDate) return 0;

  const last = new Date(lastDate);
  if (Number.isNaN(last.getTime())) return 0;

  const dueAt = last.getTime() + frequency * DAY_MS;
  return Math.ceil((dueAt - Date.now()) / DAY_MS);
}

export function getDueStatus(daysUntilDue: number) {
  if (daysUntilDue <= 0) return 'due';
  if (daysUntilDue <= 2) return 'soon';
  return 'good';
}

export function getPlantHealthScore(plant: OwnedPlant): number {
  const waterDays = getDaysUntilDue(plant.lastWatered, plant.waterFrequency ?? 7);
  const fertilizeDays = getDaysUntilDue(plant.lastFertilized, plant.fertilizeFrequency ?? 30);
  const waterScore = waterDays <= 0 ? 45 : waterDays <= 2 ? 70 : 100;
  const fertilizeScore = fertilizeDays <= 0 ? 60 : fertilizeDays <= 5 ? 80 : 100;
  return clamp(Math.round((waterScore * 0.65) + (fertilizeScore * 0.35)), 0, 100);
}

export function getPlantHealthLabel(score: number): OwnedPlant['healthStatus'] {
  if (score < 55) return 'Critical';
  if (score < 80) return 'Warning';
  return 'Healthy';
}

export function getPlantHealthText(score: number): string {
  if (score < 55) return '需要立即照顾';
  if (score < 80) return '近期需要关注';
  return '状态良好';
}

export function getCareMessage(plant: OwnedPlant): string {
  const waterDays = getDaysUntilDue(plant.lastWatered, plant.waterFrequency ?? 7);
  const fertilizeDays = getDaysUntilDue(plant.lastFertilized, plant.fertilizeFrequency ?? 30);

  if (waterDays <= 0) {
    return `${plant.nickname} 今天该浇水啦，别让它口渴。`;
  }

  if (fertilizeDays <= 0) {
    return `${plant.nickname} 可以补充营养，记得安排一次施肥。`;
  }

  if (waterDays <= 2) {
    return `${plant.nickname} ${waterDays}天内要浇水，提前准备一下。`;
  }

  return `${plant.nickname} 状态不错，继续保持当前节奏。`;
}
