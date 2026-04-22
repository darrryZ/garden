import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次密码输入不一致');
        }
        await register(formData.username, formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      
      // 登录/注册成功后跳转
      const from = (location.state as any)?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || (isRegister ? '注册失败' : '登录失败'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold">{isRegister ? '注册' : '登录'}</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 pt-8">
        {/* 欢迎语 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {isRegister ? '创建新账号' : '欢迎回来'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRegister ? '注册后即可管理您的花园' : '登录以管理您的植物花园'}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5">用户名</label>
              <Input
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="h-12"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">邮箱</label>
            <Input
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">密码</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5">确认密码</label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-12"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 mt-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
          </Button>
        </form>

        {/* 切换登录/注册 */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-primary text-sm font-medium"
          >
            {isRegister ? '已有账号？去登录' : '还没有账号？去注册'}
          </button>
        </div>

        {/* 测试账号提示 */}
        {!isRegister && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">测试账号：</p>
            <p className="text-xs text-gray-600">邮箱：test@example.com</p>
            <p className="text-xs text-gray-600">密码：123456</p>
          </div>
        )}
      </div>
    </div>
  );
}
