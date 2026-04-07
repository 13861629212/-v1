import React from 'react';
import { motion } from 'motion/react';
import { WordEntry, DiscriminationEntry } from '../types';
import { BookOpen, Tag, Layers, Star, Bookmark, CheckCircle2 } from 'lucide-react';

interface WordCardProps {
  entry: WordEntry | DiscriminationEntry;
  onClick?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  isMarked?: boolean;
  onMarkProgress?: (e: React.MouseEvent) => void;
  isLearned?: boolean;
  onToggleLearned?: (e: React.MouseEvent) => void;
}

const WordCard: React.FC<WordCardProps> = ({ 
  entry, 
  onClick, 
  isFavorited, 
  onToggleFavorite,
  isMarked,
  onMarkProgress,
  isLearned,
  onToggleLearned
}) => {
  const isIdiom = entry.type === 'idiom';
  
  return (
    <motion.div
      layout
      id={`word-${entry.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all cursor-pointer group relative ${
        isMarked ? 'border-blue-500 ring-1 ring-blue-500' : isLearned ? 'border-green-100 bg-green-50/30' : 'border-slate-100'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-xl font-bold group-hover:text-blue-600 transition-colors pr-20 ${isLearned ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {isIdiom ? (entry as WordEntry).word : (entry as DiscriminationEntry).words.join(' · ')}
        </h3>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isIdiom ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
            {isIdiom ? '成语' : '辨析'}
          </span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-1">
        <button
          onClick={onToggleLearned}
          title={isLearned ? "取消已学" : "标记为已学"}
          className={`p-2 rounded-full transition-all ${
            isLearned 
              ? 'text-green-600 bg-green-50' 
              : 'text-slate-300 hover:text-green-400 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={20} fill={isLearned ? "currentColor" : "none"} />
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
          <Bookmark size={20} fill={isMarked ? "currentColor" : "none"} />
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
          <Star size={20} fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      
      <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
        {isIdiom ? (entry as WordEntry).explanation : (entry as DiscriminationEntry).content}
      </p>
      
      <div className="flex flex-wrap gap-2 mt-auto">
        {isIdiom && (entry as WordEntry).group && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            <Layers size={12} />
            {(entry as WordEntry).group}
          </div>
        )}
        {isIdiom && (entry as WordEntry).category && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            <Tag size={12} />
            {(entry as WordEntry).category}
          </div>
        )}
        {!isIdiom && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            <BookOpen size={12} />
            词语辨析
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WordCard;
