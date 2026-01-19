
import React, { useState, useEffect } from 'react';
import { User, Course, StudentLevel, Grade, PlatformConfig } from '../types';
import { GRADE_LABELS, LEVEL_LABELS, Icons } from '../constants';

interface DashboardProps {
  user: User;
  allUsers: User[]; 
  stats: {
    studentCount: number;
    courseCount: number;
    lectureCount: number;
    levelCounts: Record<StudentLevel, number>;
    gradeCounts: Record<Grade, number>;
  };
  recentCourses: Course[];
  onCourseClick: (course: Course) => void;
  config: PlatformConfig; 
}

const Dashboard: React.FC<DashboardProps> = ({ user, allUsers, stats, recentCourses, onCourseClick, config }) => {
  const isAdmin = user.role === 'ADMIN';
  
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<Grade | 'ALL'>('ALL');
  const [winner, setWinner] = useState<User | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [shufflingName, setShufflingName] = useState('');

  const calculateProgress = (course: Course) => {
    if (!course.lectures || course.lectures.length === 0) return 0;
    const completedCount = course.lectures.filter(l => user.completedLectures?.includes(l.id)).length;
    return Math.round((completedCount / course.lectures.length) * 100);
  };

  const handlePickWinner = () => {
    const studentsPool = allUsers.filter(u => u.role === 'STUDENT' && !u.isBlocked);
    const filteredPool = selectedGradeFilter === 'ALL' 
      ? studentsPool 
      : studentsPool.filter(u => u.grade === selectedGradeFilter);

    if (filteredPool.length === 0) {
      alert('لا يوجد طلاب في هذا القسم حالياً.');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    
    let count = 0;
    const interval = setInterval(() => {
      const randomName = filteredPool[Math.floor(Math.random() * filteredPool.length)].fullName;
      setShufflingName(randomName);
      count++;
      if (count > 20) {
        clearInterval(interval);
        const finalWinner = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        setWinner(finalWinner);
        setIsSpinning(false);
      }
    }, 100);
  };

  const termPlan = config.termPlans[user.grade];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn text-right overflow-x-hidden">
      {showWinnerModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(37,99,235,0.3)] relative text-center border-4 border-blue-600/20">
            <button onClick={() => setShowWinnerModal(false)} className="absolute top-6 left-6 text-gray-400 hover:text-red-500 font-black">✖</button>
            <h3 className="text-2xl font-black text-blue-900 dark:text-blue-400 mb-6">قرعة مستر مصر للمسابقات 🏆</h3>
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {(['ALL', '1SEC', '2SEC', '3SEC'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeFilter(g)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedGradeFilter === g ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
                >
                  {g === 'ALL' ? 'كل الطلاب' : GRADE_LABELS[g]}
                </button>
              ))}
            </div>
            <div className="h-48 flex items-center justify-center border-4 border-dashed border-blue-100 dark:border-slate-800 rounded-[2rem] mb-8 bg-gray-50/50 dark:bg-slate-950/50">
              {isSpinning ? (
                <div className="text-2xl font-black text-blue-600 animate-pulse">{shufflingName}</div>
              ) : winner ? (
                <div className="animate-scaleUp space-y-3">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-600 mx-auto overflow-hidden shadow-xl">
                    <img src={winner.profilePicture || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">{winner.fullName}</div>
                  <div className="text-[10px] font-black text-gray-400">{GRADE_LABELS[winner.grade]} | كود: {winner.studentCode}</div>
                  <div className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full inline-block">{winner.governorate}</div>
                </div>
              ) : (
                <div className="text-gray-300 font-black">جاهز للسحب؟ 🎲</div>
              )}
            </div>
            <button
              onClick={handlePickWinner}
              disabled={isSpinning}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isSpinning ? 'جاري السحب...' : winner ? 'سحب مرة أخرى 🔄' : 'ابدأ السحب الآن 🚀'}
            </button>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-l from-blue-800 to-blue-600 dark:from-blue-900 dark:to-indigo-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 sm:w-80 h-64 sm:h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">مرحباً بك، {user.fullName.split(' ')[0]} 👋</h1>
              <p className="text-sm sm:text-base opacity-90 font-bold">
                {isAdmin ? 'إدارة المنصة التعليمية - لوحة التحكم الشاملة' : `أنت تدرس حالياً في ${GRADE_LABELS[user.grade]}`}
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowWinnerModal(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 group border-b-4 border-yellow-700 active:translate-y-1 active:border-b-0"
              >
                <span className="text-lg group-hover:rotate-12 transition-transform">🏆</span>
                سحب عشوائي للمسابقات
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black">{stats.studentCount}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-60">إجمالي الطلاب بالمنصة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black">{stats.courseCount}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-60">إجمالي الكورسات</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black">{stats.lectureCount}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-60">إجمالي المحاضرات</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black">{isAdmin ? stats.levelCounts.EXCELLENT : user.loginCount}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-60">{isAdmin ? 'طلاب متفوقون (A)' : 'مرات الدخول'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* روابط التواصل الاجتماعي في الداشبورد */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href={config.facebook} target="_blank" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-50 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 dark:text-white text-sm">صفحة فيسبوك</h4>
              <p className="text-[10px] text-gray-400 font-bold">تابع أحدث المنشورات</p>
            </div>
          </div>
          <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">🔗</span>
        </a>
        <a href={config.youtube} target="_blank" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-50 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 dark:text-white text-sm">قناة يوتيوب</h4>
              <p className="text-[10px] text-gray-400 font-bold">شروحات ومراجعات</p>
            </div>
          </div>
          <span className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">🔗</span>
        </a>
        <a href={config.telegramGeneral} target="_blank" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-50 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Icons.Telegram />
            </div>
            <div>
              <h4 className="font-black text-gray-800 dark:text-white text-sm">تليجرام العام</h4>
              <p className="text-[10px] text-gray-400 font-bold">أهم الملفات والتنبيهات</p>
            </div>
          </div>
          <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">🔗</span>
        </a>
        
        {/* روابط التليجرام لجميع الصفوف الدراسية */}
        {!isAdmin && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-3">
             {(['1SEC', '2SEC', '3SEC'] as const).map((grade) => (
               <a 
                 key={grade}
                 href={config.telegramGrades[grade]} 
                 target="_blank" 
                 className={`p-6 rounded-[2rem] shadow-sm border flex items-center justify-between group hover:shadow-xl transition-all ${
                   user.grade === grade 
                     ? 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20' 
                     : 'bg-white dark:bg-slate-900 border-gray-50 dark:border-slate-800'
                 }`}
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${
                     user.grade === grade ? 'bg-sky-600' : 'bg-sky-400'
                   }`}>
                     <Icons.Telegram />
                   </div>
                   <div>
                     <h4 className={`font-black text-sm ${user.grade === grade ? 'text-sky-900 dark:text-sky-400' : 'text-gray-800 dark:text-white'}`}>تليجرام {GRADE_LABELS[grade]}</h4>
                     <p className="text-[10px] text-gray-400 font-bold">انضم لمجتمع زملائك</p>
                   </div>
                 </div>
                 {user.grade === grade ? (
                   <div className="bg-sky-600 text-white px-3 py-1 rounded-lg text-[8px] font-black animate-pulse">صفك الدراسي ✨</div>
                 ) : (
                   <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">🔗</span>
                 )}
               </a>
             ))}
           </div>
        )}
      </section>

      {/* قسم خطة الترم الدراسي */}
      {!isAdmin && termPlan && (
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-blue-50 dark:border-slate-800 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400">خطة منهجك الدراسي</h2>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 sm:p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {termPlan}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest italic">Educational Roadmap by {config.teacherName}</span>
          </div>
        </section>
      )}

      {/* Recent Courses Section */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400">أحدث الكورسات المضافة 📚</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentCourses.map(course => (
            <div 
              key={course.id} 
              onClick={() => onCourseClick(course)}
              className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border dark:border-slate-800 cursor-pointer group hover:shadow-xl transition-all"
            >
              <div className="h-32 rounded-2xl overflow-hidden mb-3">
                <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt={course.title} />
              </div>
              <h3 className="font-black text-sm text-gray-800 dark:text-white truncate">{course.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">{GRADE_LABELS[course.grade]}</p>
            </div>
          ))}
          {recentCourses.length === 0 && (
            <p className="text-center text-gray-400 font-bold py-10 w-full col-span-full">لا توجد كورسات مضافة حديثاً لهذا الصف</p>
          )}
        </div>
      </section>

      {isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-blue-600 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl text-white flex flex-col items-center">
              <h4 className="font-black text-sm sm:text-base mb-1">الصف الأول الثانوي</h4>
              <div className="text-3xl sm:text-4xl font-black">{stats.gradeCounts['1SEC']}</div>
              <p className="text-[10px] opacity-70 font-bold">طالب مسجل</p>
            </div>
            <div className="bg-indigo-600 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl text-white flex flex-col items-center">
              <h4 className="font-black text-sm sm:text-base mb-1">الصف الثاني الثانوي</h4>
              <div className="text-3xl sm:text-4xl font-black">{stats.gradeCounts['2SEC']}</div>
              <p className="text-[10px] opacity-70 font-bold">طالب مسجل</p>
            </div>
            <div className="bg-violet-600 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl text-white flex flex-col items-center">
              <h4 className="font-black text-sm sm:text-base mb-1">الصف الثالث الثانوي</h4>
              <div className="text-3xl sm:text-4xl font-black">{stats.gradeCounts['3SEC']}</div>
              <p className="text-[10px] opacity-70 font-bold">طالب مسجل</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 text-center">
              <div className="text-2xl font-black text-green-600">{stats.levelCounts.EXCELLENT}</div>
              <div className="text-[10px] font-black text-gray-400">طلاب متميزون</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 text-center">
              <div className="text-2xl font-black text-blue-600">{stats.levelCounts.AVERAGE}</div>
              <div className="text-[10px] font-black text-gray-400">طلاب متوسطون</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 text-center">
              <div className="text-2xl font-black text-red-600">{stats.levelCounts.WEAK}</div>
              <div className="text-[10px] font-black text-gray-400">طلاب ضعاف</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
