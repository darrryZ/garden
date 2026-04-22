import { useState, useEffect } from 'react';

interface DateDisplayProps {
  className?: string;
}

export function DateDisplay({ className = '' }: DateDisplayProps) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[now.getDay()];
      setDateStr(`${month}月${date.toString().padStart(2, '0')}日 ${weekday}`);
    };

    updateDate();
    // 每分钟更新一次
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return <p className={className}>{dateStr}</p>;
}
