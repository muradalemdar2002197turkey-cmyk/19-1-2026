
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exam, ExamQuestion } from '../types';

interface ExamSystemProps {
  exam: Exam;
  onFinish: (score: number, total: number) => void;
}

const ExamSystem: React.FC<ExamSystemProps> = ({ exam, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [timeLeft, setTimeLeft] = useState(() => (exam.durationMinutes > 0 ? exam.durationMinutes * 60 : 60));
  const [isFinished, setIsFinished] = useState(false);
  const isSubmitting = useRef(false);

  const questions = exam.questions || [];
  const hasQuestions = questions.length > 0;

  // منطق التسليم النهائي
  const handleSubmit = useCallback(() => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsFinished(true);
    
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    
    onFinish(score, questions.length);
  }, [answers, onFinish, questions]);

  // مؤقت الامتحان المستقل (لا يعتمد على حالة الإجابات لمنع الـ Reset)
  useEffect(() => {
    if (!hasQuestions || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting.current) handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasQuestions, isFinished]); // تم إزالة handleSubmit من الاعتماديات لضمان عدم إعادة تشغيل التايمر

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: string, answer: 'A' | 'B' | 'C' | 'D') => {
    if (isFinished) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // حماية من الدخول لامتحان فارغ
  if (!hasQuestions) {
    return (
      <div className="fixed inset-0 z-[600] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="text-8xl animate-bounce">⚠️</div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">عذراً، هذا الامتحان غير جاهز حالياً</h2>
          <p className="text-gray-500 font-bold">يرجى التواصل مع الإدارة لإضافة الأسئلة.</p>
          <button 
            onClick={() => onFinish(0, 0)} 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl"
          >
            العودة للمنصة
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-[600] bg-gray-50 dark:bg-slate-950 flex flex-col animate-fadeIn select-none overflow-hidden">
      {/* Header مع المؤقت */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 md:p-6 shadow-md flex justify-between items-center z-20">
        <div className="text-right">
          <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 truncate max-w-[200px] md:max-w-md">{exam.title}</h2>
          <p className="text-[10px] text-gray-400 font-bold">سؤال {currentQuestionIndex + 1} من {questions.length}</p>
        </div>
        
        <div className={`flex flex-col items-center px-5 py-2 rounded-2xl border-2 transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'}`}>
          <span className={`text-2xl font-black ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-[9px] font-black uppercase text-gray-400">المتبقي</span>
        </div>
      </header>

      {/* منطقة السؤال */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center custom-scrollbar">
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden min-h-[300px] flex items-center justify-center relative">
            {currentQuestion?.imageUrl ? (
              <img 
                src={currentQuestion.imageUrl} 
                className="w-full h-auto rounded-3xl object-contain max-h-[65vh]" 
                alt="Question" 
                onContextMenu={(e) => e.preventDefault()}
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-sm">جاري عرض السؤال...</p>
              </div>
            )}
          </div>

          {/* أزرار الاختيارات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-20">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                className={`py-5 md:py-8 rounded-[2rem] font-black text-3xl transition-all border-4 transform active:scale-95 ${
                  answers[currentQuestion.id] === option
                    ? 'bg-blue-600 text-white border-blue-400 shadow-2xl -translate-y-1'
                    : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-600 border-gray-100 dark:border-slate-800 hover:border-blue-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* التنقل السفلي */}
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-4 md:p-6 flex justify-between items-center shadow-2xl z-20">
        <div className="flex gap-2 md:gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 md:px-10 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black disabled:opacity-30 transition-all"
          >
            السابق
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-6 md:px-10 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black disabled:opacity-30 transition-all"
          >
            التالي
          </button>
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من إنهاء الامتحان وتسليم إجاباتك؟')) {
                handleSubmit();
              }
            }}
            className="px-8 md:px-14 py-3 bg-green-600 text-white rounded-2xl font-black shadow-xl hover:bg-green-700 transition-all active:scale-90"
          >
            تسليم 🏁
          </button>
        ) : (
          <div className="hidden md:block text-[10px] font-black text-gray-400">استمر.. الوقت مازال متاحاً</div>
        )}
      </footer>
    </div>
  );
};

export default ExamSystem;
