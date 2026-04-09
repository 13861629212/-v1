import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordEntry, DiscriminationEntry } from '../types';
import { idioms } from '../data/idioms';
import { discriminations } from '../data/discrimination';
import { Brain, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, HelpCircle, BookOpen, Tag } from 'lucide-react';

interface Question {
  id: string;
  type: 'idiom' | 'discrimination';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  originalEntry: WordEntry | DiscriminationEntry;
}

export default function QuizView({ onClose }: { onClose: () => void }) {
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'result'>('setup');
  const [quizType, setQuizType] = useState<'idiom' | 'discrimination' | 'mixed'>('mixed');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const generateQuiz = (type: 'idiom' | 'discrimination' | 'mixed', count: number = 10) => {
    let pool: (WordEntry | DiscriminationEntry)[] = [];
    if (type === 'idiom') pool = idioms;
    else if (type === 'discrimination') pool = discriminations;
    else pool = [...idioms, ...discriminations];

    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    
    const generatedQuestions: Question[] = shuffled.map((entry, idx) => {
      if (entry.type === 'idiom') {
        const idiomEntry = entry as WordEntry;
        // Distractors
        const distractors = idioms
          .filter(i => i.id !== entry.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(i => i.word);
        
        const options = [idiomEntry.word, ...distractors].sort(() => Math.random() - 0.5);

        return {
          id: `q-${idx}`,
          type: 'idiom',
          question: `以下哪个成语的释义是：“${idiomEntry.explanation}”？`,
          options,
          correctAnswer: idiomEntry.word,
          explanation: idiomEntry.explanation,
          originalEntry: entry
        };
      } else {
        const discEntry = entry as DiscriminationEntry;
        // For discrimination, we use the words as options
        const options = [...discEntry.words].sort(() => Math.random() - 0.5);
        
        // If we have an example, we can make a fill-in-the-blank question
        let questionText = `请辨析以下词语的用法：${discEntry.words.join('、')}`;
        let correctAnswer = discEntry.words[0]; // Default to first word if no example logic

        if (discEntry.example) {
          // Try to find one of the words in the example and replace it
          for (const word of discEntry.words) {
            if (discEntry.example.includes(word)) {
              questionText = `请选择最合适的词填入横线处：\n“${discEntry.example.replace(word, '____')}”`;
              correctAnswer = word;
              break;
            }
          }
        }

        return {
          id: `q-${idx}`,
          type: 'discrimination',
          question: questionText,
          options,
          correctAnswer,
          explanation: discEntry.content,
          originalEntry: entry
        };
      }
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setQuizState('active');
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setQuizState('result');
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-xl text-white shadow-lg shadow-purple-100">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">知识测验</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Knowledge Quiz</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {quizState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 py-12"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trophy size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">准备好接受挑战了吗？</h3>
                <p className="text-slate-500">通过测验巩固你的学习成果，查漏补缺。</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setQuizType('idiom')}
                  className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between ${
                    quizType === 'idiom' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">成语专项</h4>
                      <p className="text-xs text-slate-400">考察成语释义及用法</p>
                    </div>
                  </div>
                  {quizType === 'idiom' && <CheckCircle2 className="text-purple-600" />}
                </button>

                <button
                  onClick={() => setQuizType('discrimination')}
                  className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between ${
                    quizType === 'discrimination' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">词语辨析</h4>
                      <p className="text-xs text-slate-400">考察近义词深度辨析</p>
                    </div>
                  </div>
                  {quizType === 'discrimination' && <CheckCircle2 className="text-purple-600" />}
                </button>

                <button
                  onClick={() => setQuizType('mixed')}
                  className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between ${
                    quizType === 'mixed' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">混合模式</h4>
                      <p className="text-xs text-slate-400">随机抽取成语与辨析</p>
                    </div>
                  </div>
                  {quizType === 'mixed' && <CheckCircle2 className="text-purple-600" />}
                </button>
              </div>

              <button
                onClick={() => generateQuiz(quizType)}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                开始测验
              </button>
            </motion.div>
          )}

          {quizState === 'active' && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-8"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  第 {currentIndex + 1} / {questions.length} 题
                </span>
                <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const isSelected = option === selectedOption;
                  
                  let buttonClass = "bg-white border-slate-100 text-slate-700 hover:border-purple-200";
                  if (isAnswered) {
                    if (isCorrect) buttonClass = "bg-green-50 border-green-500 text-green-700";
                    else if (isSelected) buttonClass = "bg-red-50 border-red-500 text-red-700";
                    else buttonClass = "bg-white border-slate-100 text-slate-300 opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      className={`p-5 rounded-2xl border-2 transition-all text-left font-bold flex items-center justify-between ${buttonClass}`}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 size={20} className="text-green-500" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <HelpCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">解析</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>

                  <button
                    onClick={nextQuestion}
                    className="w-full py-5 bg-purple-600 text-white rounded-3xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    {currentIndex === questions.length - 1 ? '查看结果' : '下一题'}
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {quizState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-8"
            >
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Trophy size={64} />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -top-2 -right-2 bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-black border-4 border-slate-50"
                >
                  {Math.round((score / questions.length) * 100)}
                </motion.div>
              </div>

              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">测验结束！</h3>
                <p className="text-slate-500">
                  你答对了 <span className="text-purple-600 font-bold">{score}</span> 题，共 <span className="font-bold">{questions.length}</span> 题。
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-600">
                  {score === questions.length ? '太棒了！你已经完全掌握了这些知识点。' : 
                   score >= questions.length * 0.8 ? '表现不错！再接再厉，争取满分。' : 
                   '还需要多加练习哦，继续加油！'}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setQuizState('setup')}
                  className="w-full py-5 bg-purple-600 text-white rounded-3xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  再测一次
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-slate-100 text-slate-600 rounded-3xl font-bold text-lg hover:bg-slate-200 transition-all"
                >
                  返回主页
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
