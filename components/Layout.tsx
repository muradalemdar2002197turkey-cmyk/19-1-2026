
import React, { useState, useRef, useEffect } from 'react';
import { User, PlatformConfig } from '../types';
import { Icons, INITIAL_CONFIG, GRADE_LABELS } from '../constants';
import { chatWithAI } from '../services/geminiService';

interface LayoutProps {
  user: User;
  config: PlatformConfig;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, config, onLogout, children, activeTab, setActiveTab, isDarkMode, toggleTheme }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'أهلاً بك يا بطل! أنا مساعدك الذكي في منصة مستر مصر. عندك أي سؤال في الإنجليزي؟' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'ADMIN';

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Icons.Home },
    { id: 'courses', label: 'الكورسات', icon: Icons.Book },
    { id: 'forum', label: 'المنتدى', icon: Icons.Forum },
  ];

  if (isAdmin) {
    menuItems.push(
      { id: 'purchaseRequests', label: 'طلبات الشراء', icon: () => <span className="text-xl">💰</span> },
      { id: 'students', label: 'الطلاب', icon: Icons.Users },
      { id: 'settings', label: 'الإعدادات', icon: Icons.Settings }
    );
  } else {
    menuItems.push({ id: 'profile', label: 'حسابي', icon: Icons.Users });
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsTyping(true);

    const history = chatMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const aiResponse = await chatWithAI(msg, history);
    setIsTyping(false);
    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
  };

  const contentStyle = config.appBackground 
    ? { backgroundImage: `url(${config.appBackground})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }
    : {};

  // منطق ظهور الإعلان
  const shouldShowAnnouncement = config.isAnnouncementActive && 
    (config.announcementTarget === 'ALL' || config.announcementTarget === user.grade || isAdmin);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl z-20 border-l border-gray-100 dark:border-slate-800 transition-colors duration-500 sticky top-0 h-screen">
        <div className="p-6 lg:p-8 border-b dark:border-slate-800 flex flex-col items-center">
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img src={config.logo || INITIAL_CONFIG.logo} alt="Logo" className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full shadow-2xl object-cover border-4 border-white dark:border-slate-800" />
          </div>
          <h2 className="text-lg lg:text-xl font-black text-blue-900 dark:text-blue-400 text-center line-clamp-1">{config.teacherName}</h2>
          {!isAdmin && <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 mt-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{user.studentCode} #</span>}
        </div>
        
        <nav className="flex-1 p-4 lg:p-6 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-2xl transition-all duration-300 font-bold ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none translate-x-1' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <item.icon />
              <span className="text-sm lg:text-base">{item.label}</span>
            </button>
          ))}
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 lg:px-5 py-3 lg:py-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all font-bold mt-4"
          >
            {isDarkMode ? (
              <><span className="text-xl">☀️</span><span className="text-sm lg:text-base">الوضع النهاري</span></>
            ) : (
              <><span className="text-xl">🌙</span><span className="text-sm lg:text-base">الوضع الليلي</span></>
            )}
          </button>
        </nav>

        <div className="p-4 lg:p-6 border-t dark:border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 lg:px-5 py-3 lg:py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all font-bold"
          >
            <Icons.Logout />
            <span className="text-sm lg:text-base">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative w-full" style={contentStyle}>
        {/* شريط الإعلانات الجديد */}
        {shouldShowAnnouncement && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 sm:py-4 relative z-40 shadow-lg animate-fadeIn">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-center">
              <span className="text-xl sm:text-2xl animate-bounce">📢</span>
              <p className="text-xs sm:text-sm md:text-base font-black leading-tight drop-shadow-sm">
                {config.announcementText}
              </p>
              {isAdmin && (
                <span className="hidden sm:inline-block bg-white/20 px-2 py-0.5 rounded-lg text-[8px] font-bold">
                   إعلان: {config.announcementTarget === 'ALL' ? 'للجميع' : GRADE_LABELS[config.announcementTarget]}
                </span>
              )}
            </div>
          </div>
        )}

        <header className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-500 border-b dark:border-slate-800 w-full">
          <div className="flex items-center gap-2 xs:gap-3">
            <img src={config.logo} alt="Logo" className="w-8 h-8 xs:w-9 xs:h-9 rounded-full object-cover border dark:border-slate-700" />
            <span className="font-black text-blue-900 dark:text-blue-400 text-xs xs:text-sm truncate max-w-[120px] xs:max-w-[150px]">{config.teacherName}</span>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2">
            <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded-xl text-lg w-9 h-9 xs:w-10 xs:h-10 flex items-center justify-center">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={onLogout} className="text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-xl w-9 h-9 xs:w-10 xs:h-10 flex items-center justify-center">
              <Icons.Logout />
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-10 pb-28 md:pb-10 overflow-x-hidden w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* AI Chat Widget */}
        {!isAdmin && (
          <div className={`fixed bottom-24 md:bottom-10 left-4 xs:left-6 z-[100] flex flex-col items-end gap-4 transition-all duration-500 ${isChatOpen ? 'w-[calc(100%-2rem)] xs:w-[320px] sm:w-[400px]' : 'w-14 xs:w-16'}`}>
            {isChatOpen && (
              <div className="w-full h-[400px] xs:h-[450px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border dark:border-slate-800 flex flex-col overflow-hidden animate-scaleUp">
                <header className="bg-blue-600 p-4 text-white flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
                      <span className="font-black text-sm text-right">مستر مصر الذكي</span>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white">✖</button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-slate-950">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] xs:text-xs font-bold leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border dark:border-slate-700 rounded-bl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                       <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border dark:border-slate-700 flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2">
                  <input 
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="اسألني أي سؤال في المنهج..."
                    className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  <button onClick={handleSendMessage} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all">
                    <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-14 h-14 xs:w-16 xs:h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl xs:text-3xl hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 relative group"
            >
              {isChatOpen ? '✖' : '🤖'}
              {!isChatOpen && (
                 <span className="absolute -top-12 right-0 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl hidden xs:block">
                    مساعدك الذكي هنا! ✨
                 </span>
              )}
            </button>
          </div>
        )}

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-100 dark:border-slate-800 flex justify-around p-1.5 xs:p-2 z-40 shadow-2xl rounded-[2.5rem] transition-colors duration-500">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] xs:min-w-[56px] py-2 rounded-2xl transition-all ${
                activeTab === item.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-black' : 'text-gray-400'
              }`}
            >
              <item.icon />
              <span className="text-[9px] xs:text-[10px] mt-1 font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
