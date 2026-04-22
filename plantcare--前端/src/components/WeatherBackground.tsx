import { useState, useEffect, useRef } from 'react';
import { getWeather, type WeatherData } from '@/services/weatherService';

interface WeatherBackgroundProps {
  defaultCity?: string;
}

// 粒子类型
type ParticleType = 'rain' | 'snow' | 'sun' | 'cloud' | 'none';

// 粒子类
class Particle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
  opacity: number;
  type: ParticleType;
  life: number;
  maxLife: number;

  constructor(canvasWidth: number, canvasHeight: number, type: ParticleType) {
    this.type = type;
    this.life = 0;
    this.maxLife = 100 + Math.random() * 100;
    
    if (type === 'rain') {
      this.x = Math.random() * canvasWidth;
      this.y = -10;
      this.speedX = -0.5 + Math.random() * 1;
      this.speedY = 8 + Math.random() * 5;
      this.size = 1 + Math.random() * 1.5;
      this.opacity = 0.4 + Math.random() * 0.3;
    } else if (type === 'snow') {
      this.x = Math.random() * canvasWidth;
      this.y = -10;
      this.speedX = -1 + Math.random() * 2;
      this.speedY = 1 + Math.random() * 2;
      this.size = 2 + Math.random() * 3;
      this.opacity = 0.4 + Math.random() * 0.4;
    } else if (type === 'sun') {
      this.x = Math.random() * canvasWidth;
      this.y = 160 + Math.random() * 40;
      this.speedX = -0.5 + Math.random() * 1;
      this.speedY = -0.3 - Math.random() * 0.5;
      this.size = 2 + Math.random() * 4;
      this.opacity = 0.2 + Math.random() * 0.3;
    } else if (type === 'cloud') {
      this.x = -50 - Math.random() * 100;
      this.y = 20 + Math.random() * 100;
      this.speedX = 0.2 + Math.random() * 0.3;
      this.speedY = 0;
      this.size = 30 + Math.random() * 40;
      this.opacity = 0.3 + Math.random() * 0.3;
    } else {
      this.x = 0;
      this.y = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.size = 0;
      this.opacity = 0;
    }
  }

  update(canvasWidth: number, canvasHeight: number): boolean {
    this.life++;
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.type === 'rain') {
      return this.y < canvasHeight + 10;
    } else if (this.type === 'snow') {
      this.x += Math.sin(this.life * 0.02) * 0.5;
      return this.y < canvasHeight + 10;
    } else if (this.type === 'sun') {
      return this.y > -10 && this.life < this.maxLife;
    } else if (this.type === 'cloud') {
      return this.x < canvasWidth + 100;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    if (this.type === 'rain') {
      ctx.strokeStyle = '#8bb3d9';
      ctx.lineWidth = this.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.speedX * 1.5, this.y + this.size * 6);
      ctx.stroke();
    } else if (this.type === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'sun') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'cloud') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.arc(this.x + this.size * 0.5, this.y - this.size * 0.2, this.size * 0.8, 0, Math.PI * 2);
      ctx.arc(this.x - this.size * 0.5, this.y - this.size * 0.1, this.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

// 获取天气背景渐变
function getWeatherBackground(condition: string): string {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('rain') || conditionLower.includes('雨')) {
    return 'bg-gradient-to-b from-slate-500/40 via-slate-400/20 to-transparent';
  } else if (conditionLower.includes('snow') || conditionLower.includes('雪')) {
    return 'bg-gradient-to-b from-slate-300/40 via-blue-100/20 to-transparent';
  } else if (conditionLower.includes('sun') || conditionLower.includes('clear') || conditionLower.includes('晴')) {
    return 'bg-gradient-to-b from-sky-400/40 via-blue-300/20 to-transparent';
  } else if (conditionLower.includes('cloud') || conditionLower.includes('云') || conditionLower.includes('阴')) {
    return 'bg-gradient-to-b from-gray-400/40 via-gray-300/20 to-transparent';
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('雾')) {
    return 'bg-gradient-to-b from-gray-300/40 via-gray-200/20 to-transparent';
  }
  return 'bg-gradient-to-b from-sky-400/40 via-blue-300/20 to-transparent';
}

// 根据天气获取粒子类型
function getParticleType(condition: string): ParticleType {
  const conditionLower = condition.toLowerCase();
  
  // 雨/雷暴/ drizzle
  if (conditionLower.includes('rain') || 
      conditionLower.includes('雨') || 
      conditionLower.includes('drizzle') ||
      conditionLower.includes('thunder') ||
      conditionLower.includes('storm') ||
      conditionLower.includes('shower')) {
    return 'rain';
  } 
  // 雪
  else if (conditionLower.includes('snow') || conditionLower.includes('雪')) {
    return 'snow';
  } 
  // 晴天/晴朗
  else if (conditionLower.includes('sun') || 
           conditionLower.includes('clear') || 
           conditionLower.includes('晴')) {
    return 'sun';
  } 
  // 多云/阴天
  else if (conditionLower.includes('cloud') || 
           conditionLower.includes('云') || 
           conditionLower.includes('阴') ||
           conditionLower.includes('overcast') ||
           conditionLower.includes('fog') ||
           conditionLower.includes('mist') ||
           conditionLower.includes('haze') ||
           conditionLower.includes('smoke')) {
    return 'cloud';
  }
  // 默认晴天
  return 'sun';
}

export function WeatherBackground({ defaultCity = 'Shanghai' }: WeatherBackgroundProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [particleType, setParticleType] = useState<ParticleType>('sun');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const isActiveRef = useRef(true);

  // 强制重新挂载标识
  const mountKeyRef = useRef(0);
  
  // 获取天气
  useEffect(() => {
    mountKeyRef.current++;
    console.log('WeatherBackground: 组件挂载/更新, key:', mountKeyRef.current, '城市:', defaultCity);
    
    // 每次挂载都重置为晴天粒子，确保动画立即开始
    setWeather(null);
    setParticleType('sun');
    
    const fetchWeather = async () => {
      try {
        const data = await getWeather(defaultCity);
        console.log('WeatherBackground: 获取到天气数据', data);
        if (data) {
          setWeather(data);
          const pType = getParticleType(data.condition);
          setParticleType(pType);
          console.log('天气:', data.condition, '粒子类型:', pType, '城市:', defaultCity);
        } else {
          console.log('无天气数据，保持晴天');
        }
      } catch (err) {
        console.log('获取天气失败，保持晴天', err);
      }
    };
    
    // 延迟一点获取天气，确保粒子动画先开始
    const timer = setTimeout(fetchWeather, 100);
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [defaultCity]);

  // Canvas 动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重置状态
    particlesRef.current = [];
    frameCountRef.current = 0;
    isActiveRef.current = true;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        console.log('Canvas resized:', canvas.width, 'x', canvas.height);
      }
    };

    resizeCanvas();
    console.log('Canvas initial size:', canvas.width, 'x', canvas.height, '粒子类型:', particleType);
    window.addEventListener('resize', resizeCanvas);

    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (!isActiveRef.current) return;
      
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 16) {
        if (!canvasRef.current) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        const currentCtx = canvasRef.current.getContext('2d');
        if (!currentCtx) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        currentCtx.clearRect(0, 0, canvas.width, canvas.height);
        frameCountRef.current++;
        
        // 添加新粒子
        if (particleType !== 'none') {
          const spawnRate = particleType === 'rain' ? 4 : particleType === 'snow' ? 3 : particleType === 'sun' ? 2 : 1;
          for (let i = 0; i < spawnRate; i++) {
            if (Math.random() < 0.7) {
              particlesRef.current.push(new Particle(canvas.width, canvas.height, particleType));
            }
          }
        }

        // 更新和绘制粒子
        let drawnCount = 0;
        particlesRef.current = particlesRef.current.filter(particle => {
          const alive = particle.update(canvas.width, canvas.height);
          if (alive) {
            particle.draw(currentCtx);
            drawnCount++;
          }
          return alive;
        });

        if (frameCountRef.current % 60 === 0) {
          console.log('Canvas:', canvas.width, 'x', canvas.height, '粒子类型:', particleType, '绘制:', drawnCount, '存活:', particlesRef.current.length);
        }

        lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActiveRef.current = false;
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      particlesRef.current = [];
    };
  }, [particleType]); // 依赖 particleType，类型变化时重新启动动画

  const bgClass = weather ? getWeatherBackground(weather.condition) : 'bg-gradient-to-b from-sky-400/40 via-blue-300/20 to-transparent';
  
  return (
    <div className={`absolute inset-x-0 top-0 h-[500px] ${bgClass} pointer-events-none z-0 overflow-hidden`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

    </div>
  );
}
