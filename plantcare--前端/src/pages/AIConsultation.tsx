import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Bot, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askPlantExpert } from '@/lib/gemini';
import { search } from '@/services/searchService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const HISTORY_KEY = 'plantcare_ai_history';
const QUICK_QUESTIONS = ['叶子发黄怎么办？', '多久浇一次水？', '这是什么植物？'];

export function AIConsultation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }

    return [{ id: '1', text: '您好！我是您的植物养护助手。有什么我可以帮您的吗？', sender: 'bot' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const prompt = (location.state as { prompt?: string } | null)?.prompt;
    if (prompt) {
      setInput(prompt);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSend = async (customInput?: string) => {
    const text = (customInput ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    const currentInput = text;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 先查询后端知识库
    const searchResults = await search(currentInput);

    let botText: string;
    if (searchResults.length > 0) {
      // 有知识库结果，拼接为上下文传给 Gemini
      const knowledgeContext = searchResults
        .map(r => `【${r.name}】${r.content}`)
        .join('\n\n');
      try {
        botText = await askPlantExpert(currentInput, undefined, knowledgeContext);
      } catch {
        // Gemini 失败，仅展示知识库结果
        botText = searchResults.map(r => `【${r.name}】\n${r.content}`).join('\n\n');
      }
    } else {
      // 无知识库结果，直接调用 Gemini
      botText = await askPlantExpert(currentInput);
    }

    const botMsg: Message = { id: (Date.now() + 1).toString(), text: botText, sender: 'bot' };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto relative z-50">
      <header className="flex items-center gap-4 p-6 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold">AI在线问诊</h1>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                msg.sender === 'user' ? "bg-primary text-white" : "bg-gray-100 text-primary"
              )}>
                {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.sender === 'user' 
                  ? "bg-primary/10 text-gray-800 rounded-tr-none" 
                  : "bg-gray-50 text-gray-800 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-primary flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-white space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_QUESTIONS.map(question => (
            <button
              key={question}
              onClick={() => handleSend(question)}
              className="px-3 py-2 rounded-full bg-gray-100 text-xs text-gray-600 whitespace-nowrap"
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="描述您的问题..."
            className="flex-1 py-6 rounded-2xl bg-gray-50 border-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            onClick={handleSend}
            disabled={isLoading}
            className="w-12 h-12 rounded-2xl p-0 shrink-0"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
