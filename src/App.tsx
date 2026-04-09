import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { idioms } from './data/idioms';
import { discriminations } from './data/discrimination';
import { WordEntry, DiscriminationEntry } from './types';
import WordCard from './components/WordCard';
import SearchBar from './components/SearchBar';
import DetailModal from './components/DetailModal';
import QuizView from './components/QuizView';
import { BookOpen, Sparkles, GraduationCap, Search, MessageSquare, X, Send, Loader2, Bookmark, Target, CheckCircle2, Settings2, Brain } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<WordEntry | DiscriminationEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'idiom' | 'discrimination' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [learnedToday, setLearnedToday] = useState<string[]>(() => {
    const saved = localStorage.getItem('learnedToday');
    const lastDate = localStorage.getItem('lastStudyDate');
    const today = new Date().toLocaleDateString();
    if (lastDate === today && saved) {
      return JSON.parse(saved);
    }
    return [];
  });
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved) : 10;
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [lastMarkedId, setLastMarkedId] = useState<string | null>(() => {
    return localStorage.getItem('lastMarkedId');
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: '你好！我是公考知识助手。你可以问我关于成语释义、词语辨析的问题，我会结合知识库为你解答。' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('learnedToday', JSON.stringify(learnedToday));
    localStorage.setItem('lastStudyDate', new Date().toLocaleDateString());
  }, [learnedToday]);

  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [dailyGoal]);

  useEffect(() => {
    if (lastMarkedId) {
      localStorage.setItem('lastMarkedId', lastMarkedId);
    } else {
      localStorage.removeItem('lastMarkedId');
    }
  }, [lastMarkedId]);

  const allEntries = useMemo(() => [...idioms, ...discriminations], []);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const matchesSearch = entry.type === 'idiom' 
        ? (entry as WordEntry).word.includes(searchQuery) || (entry as WordEntry).explanation.includes(searchQuery)
        : (entry as DiscriminationEntry).words.some(w => w.includes(searchQuery)) || (entry as DiscriminationEntry).content.includes(searchQuery);
      
      const isFavorited = favorites.includes(entry.id);
      const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'favorites' 
          ? isFavorited 
          : entry.type === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, allEntries, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const toggleLearned = (id: string) => {
    setLearnedToday(prev => 
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };

  const toggleMark = (id: string) => {
    setLastMarkedId(prev => prev === id ? null : id);
  };

  const jumpToMark = () => {
    if (!lastMarkedId) return;
    
    // Ensure we are on the "all" tab or the tab that contains the marked item
    const markedEntry = allEntries.find(e => e.id === lastMarkedId);
    if (markedEntry) {
      if (activeTab !== 'all' && activeTab !== markedEntry.type) {
        setActiveTab('all');
      }
      
      // Wait for tab switch and render
      setTimeout(() => {
        const element = document.getElementById(`word-${lastMarkedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          element.classList.add('ring-4', 'ring-blue-400');
          setTimeout(() => element.classList.remove('ring-4', 'ring-blue-400'), 2000);
        }
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Create context from knowledge base
      const context = `
        你是一个考公知识助手。以下是你的知识库内容：
        成语部分：${idioms.map(i => `${i.word}: ${i.explanation}`).join('; ')}
        辨析部分：${discriminations.map(d => `${d.words.join('和')}的辨析: ${d.content}`).join('; ')}
        
        【重要指令】
        1. 请直接输出纯文本内容，禁止使用任何 Markdown 格式（如 **粗体**、# 标题、- 列表符号、\` 代码块等）。
        2. 如果需要分段或列举，请直接使用换行符或数字编号（如 1. 2. 3.）。
        3. 保持回答专业、准确、简洁。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'user', parts: [{ text: userMessage }] }
        ],
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || '抱歉，我暂时无法回答这个问题。' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，连接AI助手时出了点问题。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">公考知识宝典</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Civil Service Exam Prep</p>
            </div>
          </div>
          
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'idiom', 'discrimination', 'favorites'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'all' ? '全部' : tab === 'idiom' ? '高频成语' : tab === 'discrimination' ? '词语辨析' : '我的收藏'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuizOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all font-bold text-sm border border-purple-100"
            >
              <Brain size={18} />
              <span className="hidden sm:inline">知识测验</span>
            </button>

            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all font-bold text-sm border border-green-100"
            >
              <Target size={18} />
              <span className="hidden sm:inline">学习计划</span>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {learnedToday.length}/{dailyGoal}
              </span>
            </button>

            {lastMarkedId && (
              <button
                onClick={jumpToMark}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm border border-blue-100"
              >
                <Bookmark size={18} fill="currentColor" />
                <span>继续阅读</span>
              </button>
            )}
            
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <Sparkles size={18} />
              <span className="hidden sm:inline font-bold text-sm">AI 助手</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            攻克言语理解，从这里开始
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            收录 800+ 高频考点成语及深度词语辨析，助你精准掌握考公言语核心知识点。
          </p>
          
          {/* Progress Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">今日学习进度</span>
              <span className="text-sm font-black text-green-600">{Math.round((learnedToday.length / dailyGoal) * 100)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((learnedToday.length / dailyGoal) * 100, 100)}%` }}
                className="h-full bg-green-500 rounded-full shadow-sm"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              今日已学 <span className="text-slate-900 font-bold">{learnedToday.length}</span> 个，目标 <span className="text-slate-900 font-bold">{dailyGoal}</span> 个
            </p>
          </div>

          {lastMarkedId && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={jumpToMark}
              className="mt-6 inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
            >
              <Bookmark size={16} fill="currentColor" />
              上次读到这里，点击继续浏览
            </motion.button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-slate-200/50 p-1 rounded-xl mb-8 overflow-x-auto scrollbar-hide">
          {(['all', 'idiom', 'discrimination', 'favorites'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'idiom' ? '成语' : tab === 'discrimination' ? '辨析' : '收藏'}
            </button>
          ))}
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <WordCard 
                key={entry.id} 
                entry={entry} 
                isFavorited={favorites.includes(entry.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  toggleFavorite(entry.id);
                }}
                isMarked={lastMarkedId === entry.id}
                onMarkProgress={(e) => {
                  e.stopPropagation();
                  toggleMark(entry.id);
                }}
                isLearned={learnedToday.includes(entry.id)}
                onToggleLearned={(e) => {
                  e.stopPropagation();
                  toggleLearned(entry.id);
                }}
                onClick={() => setSelectedEntry(entry)} 
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">未找到相关内容</h3>
            <p className="text-slate-500">换个关键词试试，或者问问 AI 助手？</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <DetailModal 
        entry={selectedEntry} 
        isFavorited={selectedEntry ? favorites.includes(selectedEntry.id) : false}
        onToggleFavorite={() => selectedEntry && toggleFavorite(selectedEntry.id)}
        isMarked={selectedEntry ? lastMarkedId === selectedEntry.id : false}
        onMarkProgress={() => selectedEntry && toggleMark(selectedEntry.id)}
        isLearned={selectedEntry ? learnedToday.includes(selectedEntry.id) : false}
        onToggleLearned={() => selectedEntry && toggleLearned(selectedEntry.id)}
        onClose={() => setSelectedEntry(null)} 
      />

      {/* Goal Settings Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 relative"
            >
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                  <Settings2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">设定每日目标</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">每日学习词条数</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-600"
                    />
                    <span className="text-2xl font-black text-slate-900 min-w-[3rem] text-center">{dailyGoal}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    设定一个合理的目标可以帮助你保持学习动力。建议初学者每天设定 <span className="font-bold text-green-600">10-15</span> 个词条。
                  </p>
                </div>

                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  保存设置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">公考 AI 助手</h3>
                    <p className="text-[10px] text-blue-200 font-bold uppercase">Intelligent Tutor</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="text-xs text-slate-400 font-medium italic">助手正在思考中...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="问问成语用法或辨析..."
                    className="w-full pl-4 pr-12 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quiz View */}
      <AnimatePresence>
        {isQuizOpen && (
          <QuizView onClose={() => setIsQuizOpen(false)} />
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
