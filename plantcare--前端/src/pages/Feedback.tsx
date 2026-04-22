import { useState } from 'react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';

export function Feedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    category: 'product',
    message: '',
    contact: '',
    screenshot: '',
  });

  const handleScreenshot = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, screenshot: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    const res = await request('POST', '/api/feedback', form);
    setLoading(false);

    if (res.success) {
      setSuccess('感谢反馈，我们已经收到你的建议。');
      setForm({
        category: 'product',
        message: '',
        contact: '',
        screenshot: '',
      });
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold">问题反馈</h1>
          <div className="w-10" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">反馈类型</label>
          <select
            value={form.category}
            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 outline-none"
          >
            <option value="product">产品建议</option>
            <option value="bug">问题反馈</option>
            <option value="service">服务体验</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">反馈内容</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
            className="w-full min-h-40 rounded-2xl border border-gray-200 px-4 py-4 outline-none resize-none"
            placeholder="告诉我们你遇到的问题或建议..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">联系方式</label>
          <input
            value={form.contact}
            onChange={(e) => setForm(prev => ({ ...prev, contact: e.target.value }))}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 outline-none"
            placeholder="邮箱 / 手机号 / 微信号（选填）"
          />
        </div>

        <label className="block rounded-[28px] border border-dashed border-gray-300 p-5 cursor-pointer">
          <div className="flex items-center gap-3 text-gray-500">
            <ImagePlus size={18} />
            <span className="text-sm">{form.screenshot ? '已添加截图，点击重新选择' : '上传截图（选填）'}</span>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleScreenshot(e.target.files?.[0])} />
        </label>

        {success && <div className="rounded-2xl bg-green-50 text-green-700 px-4 py-3 text-sm">{success}</div>}

        <Button type="submit" className="w-full rounded-2xl py-6" disabled={loading}>
          {loading ? '提交中...' : '提交反馈'}
        </Button>
      </form>
    </div>
  );
}
