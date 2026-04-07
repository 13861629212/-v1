import { motion, AnimatePresence } from 'motion/react';
import { WordEntry, DiscriminationEntry } from '../types';
import { X, BookOpen, Tag, Layers, Info, Star, Bookmark, CheckCircle2 } from 'lucide-react';

interface DetailModalProps {
  entry: WordEntry | DiscriminationEntry | null;
  onClose: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  isMarked?: boolean;
  onMarkProgress?: () => void;
  isLearned?: boolean;
  onToggleLearned?: () => void;
}

export default function DetailModal({ 
  entry, 
  onClose, 
  isFavorited, 
  onToggleFavorite,
  isMarked,
  onMarkProgress,
  isLearned,
  onToggleLearned
}: DetailModalProps) {
  if (!entry) return null;

  const isIdiom = entry.type === 'idiom';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={onToggleLearned}
              title={isLearned ? "取消已学" : "标记为已学"}
              className={`p-2 rounded-full transition-all ${
                isLearned 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-slate-300 hover:text-green-400 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={24} fill={isLearned ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onMarkProgress}
              title={isMarked ? "当前阅读进度" : "标记为阅读进度"}
              className={`p-2 rounded-full transition-all ${
                isMarked 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-300 hover:text-blue-400 hover:bg-slate-50'
              }`}
            >
              <Bookmark size={24} fill={isMarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onToggleFavorite}
              title="收藏"
              className={`p-2 rounded-full transition-all ${
                isFavorited 
                  ? 'text-amber-500 bg-amber-50' 
                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
              }`}
            >
              <Star size={24} fill={isFavorited ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-2xl ${isIdiom ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                {isIdiom ? <Tag size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isIdiom ? (entry as WordEntry).word : (entry as DiscriminationEntry).words.join(' · ')}
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  {isIdiom ? '高频考点成语' : '词语深度辨析'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                  <Info size={16} className="text-blue-500" />
                  详细释义
                </h4>
                <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {isIdiom ? (entry as WordEntry).explanation : (entry as DiscriminationEntry).content}
                </div>
              </section>

              {isIdiom && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">所属分组</p>
                    <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                      <Layers size={14} className="text-slate-400" />
                      {(entry as WordEntry).group}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">分类标签</p>
                    <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                      <Tag size={14} className="text-slate-400" />
                      {(entry as WordEntry).category}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                我知道了
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
