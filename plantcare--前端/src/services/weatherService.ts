import { request } from '../lib/api';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind: string;
  feelsLike: number;
  description: string;
}

// 使用 wttr.in 获取天气（通过后端代理或直接请求）
export async function getWeather(city: string = 'Shanghai'): Promise<WeatherData | null> {
  try {
    // 尝试通过 wttr.in 获取天气
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    const current = data.current_condition[0];
    const area = data.nearest_area[0];

    return {
      location: `${area.areaName[0].value}·${area.region[0].value}`,
      temperature: parseInt(current.temp_C),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      wind: current.windspeedKmph,
      feelsLike: parseInt(current.FeelsLikeC),
      description: current.weatherDesc[0].value,
    };
  } catch (error) {
    console.error('获取天气失败:', error);
    return null;
  }
}

// 获取简化版天气（仅温度和地点）
export async function getSimpleWeather(city: string = 'Shanghai'): Promise<{ temperature: number; location: string } | null> {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%l`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const text = await response.text();
    // 格式: "+25°C Shanghai, China"
    const match = text.match(/([+-]?\d+)°C\s+(.+)/);
    if (match) {
      return {
        temperature: parseInt(match[1]),
        location: match[2].split(',')[0], // 只取城市名
      };
    }
    return null;
  } catch (error) {
    console.error('获取天气失败:', error);
    return null;
  }
}

// 获取天气图标
export function getWeatherIcon(condition: string): string {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
    return '☀️';
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return '☁️';
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return '🌧️';
  } else if (conditionLower.includes('snow')) {
    return '❄️';
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return '⛈️';
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return '🌫️';
  }
  return '🌤️';
}
