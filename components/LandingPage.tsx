
import React from 'react';
import { PlatformConfig, Grade, StudentLevel } from '../types';
import { GRADE_LABELS, Icons } from '../constants';

interface LandingPageProps {
  config: PlatformConfig;
  onEnter: () => void;
  stats: {
    studentCount: number;
    courseCount: number;
    gradeCounts: Record<Grade, number>;
    levelCounts: Record<StudentLevel, number>;
  };
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ config, onEnter, stats, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-right transition-colors duration-500 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-row-reverse">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={config.logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border dark:border-slate-700" />
            <span className="text-base sm:text-xl font-black text-blue-900 dark:text-blue-400">{config.teacherName}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className="text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={onEnter}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full font-black hover:bg-blue-700 transition-all shadow-lg text-xs sm:text-sm"
            >
              دخول المنصة
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-12">
          <div className="flex-1 space-y-6 relative text-right w-full order-2 md:order-1">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-tight">
              تعلم الإنجليزية مع <span className="text-blue-600 dark:text-blue-400">{config.teacherName}</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-bold">
              {config.teacherBio}
            </p>
            <div className="flex gap-4 pt-4 flex-wrap justify-end">
              <button 
                onClick={onEnter}
                className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 sm:px-12 sm:py-5 rounded-[2.5rem] font-black text-lg sm:text-xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 shadow-blue-100 dark:shadow-none"
              >
                ابدأ رحلتك التعليمية الآن 🚀
              </button>
            </div>
            
            <div className="flex gap-4 sm:gap-6 mt-8 sm:mt-12 justify-end">
              <div className="flex-1 sm:flex-none bg-blue-50 dark:bg-blue-900/20 px-4 sm:px-6 py-3 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center">
                 <div className="text-blue-600 dark:text-blue-400 font-black text-xl sm:text-2xl">{stats.studentCount}</div>
                 <div className="text-blue-900/60 dark:text-blue-300/60 font-bold text-[9px] sm:text-xs uppercase tracking-wider">طالب انضم لنا</div>
              </div>
              <div className="flex-1 sm:flex-none bg-purple-50 dark:bg-purple-900/20 px-4 sm:px-6 py-3 rounded-2xl border border-purple-100 dark:border-purple-900/50 text-center">
                 <div className="text-purple-600 dark:text-purple-400 font-black text-xl sm:text-2xl">{stats.courseCount}</div>
                 <div className="text-purple-900/60 dark:text-purple-300/60 font-bold text-[9px] sm:text-xs uppercase tracking-wider">كورس متميز</div>
              </div>
            </div>
          </div>
          <div className="flex-1 relative w-full order-1 md:order-2 max-w-lg md:max-w-none">
            <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] sm:rounded-[3rem] rotate-6 -z-10 opacity-10 dark:opacity-20"></div>
            <img 
              src={config.landingHeroImage} 
              alt="Hero" 
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-cover rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border-4 sm:border-8 border-white dark:border-slate-800"
            />
          </div>
        </div>
      </header>

      {/* Full Statistics Section - NEW Addition requested by user */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">إحصائيات عائلة مستر مصر 📊</h2>
            <p className="opacity-80 font-bold">نحن لا نعلم فقط، بل نبني مستقبلاً بأرقام حقيقية</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Grades Stats */}
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20">
               <h3 className="text-xl font-black mb-6 text-center border-b border-white/20 pb-4">توزيع الطلاب حسب الصف الدراسي</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <span className="font-bold">الصف الأول الثانوي:</span>
                    <span className="text-2xl font-black">{stats.gradeCounts['1SEC']}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <span className="font-bold">الصف الثاني الثانوي:</span>
                    <span className="text-2xl font-black">{stats.gradeCounts['2SEC']}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <span className="font-bold">الصف الثالث الثانوي:</span>
                    <span className="text-2xl font-black">{stats.gradeCounts['3SEC']}</span>
                  </div>
               </div>
            </div>

            {/* Total Student Stat Large */}
            <div className="bg-white text-blue-600 p-10 rounded-[3rem] flex flex-col items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
               <span className="text-6xl mb-4">👥</span>
               <h3 className="text-2xl font-black mb-2">إجمالي الطلاب</h3>
               <div className="text-7xl font-black">{stats.studentCount}</div>
               <p className="mt-4 opacity-70 font-bold">بطل وبطلة في رحلة النجاح</p>
            </div>

            {/* Level Stats */}
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20">
               <h3 className="text-xl font-black mb-6 text-center border-b border-white/20 pb-4">توزيع الطلاب حسب المستوى</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-green-500/20 p-4 rounded-2xl border border-green-400/30">
                    <span className="font-bold flex items-center gap-2"><span>⭐</span> المتفوقون:</span>
                    <span className="text-2xl font-black">{stats.levelCounts.EXCELLENT}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-500/20 p-4 rounded-2xl border border-blue-400/30">
                    <span className="font-bold flex items-center gap-2"><span>📈</span> المتوسطون:</span>
                    <span className="text-2xl font-black">{stats.levelCounts.AVERAGE}</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-500/20 p-4 rounded-2xl border border-red-400/30">
                    <span className="font-bold flex items-center gap-2"><span>⚠️</span> الضعاف:</span>
                    <span className="text-2xl font-black">{stats.levelCounts.WEAK}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black mb-12 sm:mb-16 text-center text-gray-900 dark:text-white flex flex-col items-center gap-3 sm:gap-4">
            تواصل معنا وتابع الجديد
            <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-blue-600 rounded-full"></div>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col items-center border border-gray-100 dark:border-slate-700">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
               </div>
               <span className="font-black text-gray-900 dark:text-white mb-1 text-base sm:text-lg">واتساب المستر</span>
               <span className="text-gray-400 font-bold text-[10px] sm:text-xs truncate max-w-full">{config.whatsapp}</span>
            </a>

            <a href={`tel:${config.teamPhone}`} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col items-center border border-gray-100 dark:border-slate-700">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </div>
               <span className="font-black text-gray-900 dark:text-white mb-1 text-base sm:text-lg">اتصال بالفريق</span>
               <span className="text-gray-400 font-bold text-[10px] sm:text-xs">{config.teamPhone}</span>
            </a>

            <a href={config.telegramGeneral} target="_blank" className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col items-center border border-gray-100 dark:border-slate-700">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Icons.Telegram />
               </div>
               <span className="font-black text-gray-900 dark:text-white mb-1 text-base sm:text-lg">تليجرام القناة العامة</span>
               <span className="text-gray-400 font-bold text-[10px] sm:text-xs">Mr. Egypt</span>
            </a>

            <a href={config.facebook} target="_blank" className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col items-center border border-gray-100 dark:border-slate-700">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </div>
               <span className="font-black text-gray-900 dark:text-white mb-1 text-base sm:text-lg">صفحة فيسبوك</span>
               <span className="text-gray-400 font-bold text-[10px] sm:text-xs">@MrEgypt</span>
            </a>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
             {(['1SEC', '2SEC', '3SEC'] as const).map((grade) => (
                <a key={grade} href={config.telegramGrades[grade]} target="_blank" className="bg-sky-50 dark:bg-sky-900/10 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center border border-sky-100 dark:border-sky-800/50 group/tg">
                   <div className="text-sky-600 dark:text-sky-400 mb-2 sm:mb-3 group-hover/tg:scale-110 transition-transform">
                     <Icons.Telegram />
                   </div>
                   <span className="font-black text-sky-900 dark:text-sky-300 text-xs sm:text-sm">تليجرام {GRADE_LABELS[grade]}</span>
                </a>
             ))}
          </div>

          <div className="mt-8 sm:mt-12 flex justify-center">
             <a href={config.youtube} target="_blank" className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-[2.5rem] font-black flex items-center justify-center gap-3 sm:gap-4 hover:bg-red-700 transition-all shadow-xl shadow-red-100 dark:shadow-none text-sm sm:text-base">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                قناة يوتيوب الرسمية
             </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            { label: 'طلابنا المتفوقين', value: stats.levelCounts.EXCELLENT > 50 ? `${stats.levelCounts.EXCELLENT}+` : stats.levelCounts.EXCELLENT, icon: '🎓' },
            { label: 'كورسات حصرية', value: stats.courseCount, icon: '🎥' },
            { label: 'سنوات الخبرة', value: '15+', icon: '⏳' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 text-center space-y-3 hover:shadow-xl transition-shadow duration-500">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{stat.icon}</div>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">{stat.value}</div>
              <div className="text-gray-500 dark:text-gray-400 font-black text-base sm:text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 dark:bg-slate-950 text-white py-12 sm:py-20 text-center border-t-4 sm:border-t-8 border-blue-600 dark:border-blue-800 transition-colors duration-500">
        <img src={config.logo} className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full mb-4 sm:mb-6 border-4 border-white/20 shadow-2xl object-cover" alt="Logo" />
        <h3 className="text-xl sm:text-2xl font-black mb-2">{config.teacherName}</h3>
        <p className="opacity-60 font-bold mb-6 sm:mb-8 text-sm">جميع الحقوق محفوظة {config.teacherName} © 2024</p>
        <div className="max-w-[200px] sm:max-w-xs mx-auto h-0.5 bg-white/10 mb-6 sm:mb-8"></div>
        <p className="text-[10px] sm:text-xs font-black opacity-40 uppercase tracking-widest">Powered by Ali Hegazi (01040495471)</p>
      </footer>
    </div>
  );
};

export default LandingPage;
