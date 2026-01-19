
import React, { useState, useEffect, useRef } from 'react';
import { User, Grade, ForumMessage } from '../types';
import { GRADE_LABELS, Icons } from '../constants';

interface ForumProps {
  user: User;
  initialGrade: Grade;
  locks: Record<Grade, boolean>;
  onToggleLock: (grade: Grade) => void;
  onToggleAllLocks: (lock: boolean) => void;
  onBlockFromForum: (userId: string) => void;
}

const Forum: React.FC<ForumProps> = ({ user, initialGrade, locks, onToggleLock, onToggleAllLocks, onBlockFromForum }) => {
  const [activeGrade, setActiveGrade] = useState<Grade>(initialGrade);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{ url: string, type: any, name?: string } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: string, name?: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminOrTeam = user.role === 'ADMIN' || user.role === 'TEAM';

  const currentIsLocked = locks[activeGrade];

  useEffect(() => {
    const stored = localStorage.getItem(`forum_${activeGrade}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      const initial: ForumMessage[] = [
        {
          id: '1',
          userId: 'admin',
          userName: 'مستر مصر',
          userRole: 'ADMIN',
          grade: activeGrade,
          content: `أهلاً بكم في منتدى ${GRADE_LABELS[activeGrade]}!`,
          timestamp: Date.now() - 3600000
        }
      ];
      setMessages(initial);
      localStorage.setItem(`forum_${activeGrade}`, JSON.stringify(initial));
    }
  }, [activeGrade]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        let type: ForumMessage['mediaType'] = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        
        setAttachedMedia({ url, type, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = () => {
    if (currentIsLocked && !isAdminOrTeam) return alert('المنتدى مغلق حالياً من قبل الإدارة.');
    if (!newMessage.trim() && !attachedMedia) return;
    const msg: ForumMessage = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      grade: activeGrade,
      content: newMessage,
      mediaUrl: attachedMedia?.url,
      mediaType: attachedMedia?.type,
      fileName: attachedMedia?.name,
      timestamp: Date.now()
    };
    const updated = [...messages, msg];
    setMessages(updated);
    setNewMessage('');
    setAttachedMedia(null);
    localStorage.setItem(`forum_${activeGrade}`, JSON.stringify(updated));
  };

  const deleteMessage = (id: string) => {
    if (!isAdminOrTeam) return;
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem(`forum_${activeGrade}`, JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
      
      {previewMedia && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewMedia(null)}
        >
          <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all">✖️</button>
          <div className="max-w-5xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            {previewMedia.type === 'image' && <img src={previewMedia.url} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border-4 border-white/10" />}
            {previewMedia.type === 'video' && <video src={previewMedia.url} controls className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />}
            
            <div className="flex gap-4">
               <a 
                 href={previewMedia.url} 
                 download={previewMedia.name || 'subora_attachment'} 
                 className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"
               >
                 <span>تحميل المرفق</span>
                 <Icons.Upload />
               </a>
            </div>
          </div>
        </div>
      )}

      {isAdminOrTeam && (
        <div className="flex border-b dark:border-slate-800 overflow-x-auto bg-gray-50 dark:bg-slate-800/50 p-2 gap-2 sticky top-0 z-20 items-center">
          {(['1SEC', '2SEC', '3SEC'] as Grade[]).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGrade(g)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                activeGrade === g ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {GRADE_LABELS[g]}
            </button>
          ))}
          
          <div className="mr-auto flex gap-2">
            <button 
              onClick={() => {
                const isAllLocked = confirm('هل تريد قفل جميع المنتديات لكل الصفوف؟');
                if (isAllLocked) onToggleAllLocks(true);
              }}
              className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black border border-red-200"
            >
              🔒 قفل الكل
            </button>
            <button 
              onClick={() => {
                onToggleAllLocks(false);
              }}
              className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black border border-green-200"
            >
              🔓 فتح الكل
            </button>
            <button 
              onClick={() => onToggleLock(activeGrade)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${currentIsLocked ? 'bg-red-600 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50'}`}
            >
              {currentIsLocked ? '🔓 فتح هذا الصف' : '🔒 قفل هذا الصف'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-600 dark:bg-blue-800 text-white flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all md:hidden"
            title="رجوع"
          >
            <Icons.ArrowRight />
          </button>
          <h2 className="font-black text-lg">منتدى النقاش - {GRADE_LABELS[activeGrade]}</h2>
        </div>
        <div className="flex items-center gap-3">
          {currentIsLocked && <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-black">مغلق 🔒</span>}
          <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-bold">{messages.length} رسالة</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-slate-950/30 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.userId === user.id ? 'items-start' : 'items-end'}`}
          >
            <div className={`max-w-[85%] rounded-[1.5rem] p-4 shadow-sm border group relative ${
              msg.userId === user.id 
                ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-br-none border-blue-600 dark:border-blue-700 shadow-blue-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-none border-gray-100 dark:border-slate-700'
            }`}>
              <div className="flex items-center gap-2 mb-1 justify-between">
                <span className={`text-[10px] font-black uppercase ${msg.userId === user.id ? 'opacity-90' : 'text-blue-600 dark:text-blue-400'}`}>
                  {msg.userRole === 'ADMIN' ? 'الـمـسـتـر' : msg.userRole === 'TEAM' ? 'فريق العمل' : msg.userName}
                </span>
                {isAdminOrTeam && msg.userId !== 'admin' && msg.userId !== user.id && (
                  <div className="hidden group-hover:flex gap-1 absolute -top-4 left-0">
                    <button onClick={() => onBlockFromForum(msg.userId)} className="text-[8px] bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 shadow-lg">حظر 🚫</button>
                    <button onClick={() => deleteMessage(msg.id)} className="text-[8px] bg-gray-800 text-white px-2 py-1 rounded-lg hover:bg-black">حذف 🗑️</button>
                  </div>
                )}
              </div>
              
              {msg.mediaUrl && (
                <div className="mb-2 rounded-xl overflow-hidden border border-white/20 relative group/media">
                  {msg.mediaType === 'image' && (
                    <div className="relative cursor-zoom-in" onClick={() => setPreviewMedia({ url: msg.mediaUrl!, type: 'image', name: msg.fileName })}>
                      <img src={msg.mediaUrl} className="max-w-full h-auto rounded-lg" alt="attachment" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black">
                        اضغط للمعاينة 🔍
                      </div>
                    </div>
                  )}
                  {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls className="max-w-full rounded-lg" />}
                  {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="w-full h-8" />}
                  
                  {(msg.mediaType === 'file' || msg.mediaType === 'image' || msg.mediaType === 'video') && (
                    <div className="mt-2 flex">
                       <a 
                         href={msg.mediaUrl} 
                         download={msg.fileName || 'subora_file'} 
                         className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-[10px] font-black transition-all ${
                           msg.userId === user.id ? 'bg-white/10 text-white' : 'bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                         }`}
                       >
                        📥 تنزيل المرفق
                       </a>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold text-right">{msg.content}</p>
              <div className="text-[8px] opacity-60 mt-2 text-left font-mono">
                {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {attachedMedia && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="font-black text-blue-700 dark:text-blue-300 truncate max-w-[200px]">📎 مرفق: {attachedMedia.name}</span>
          <button onClick={() => setAttachedMedia(null)} className="text-red-500 font-black px-2 py-1">إلغاء ✖️</button>
        </div>
      )}

      {currentIsLocked && !isAdminOrTeam ? (
        <div className="p-6 bg-gray-100 dark:bg-slate-800/50 text-center text-gray-500 dark:text-gray-400 font-black text-sm border-t dark:border-slate-800">
          المنتدى مغلق حالياً من قبل الإدارة لجميع الطلاب 🔒
        </div>
      ) : (
        <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 p-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700"
              title="ارفق ملف أو صورة"
            >
              📎
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="*/*"
            />
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اكتب ردك هنا..."
              className="flex-1 p-4 border dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-slate-800 text-sm font-bold text-right dark:text-white"
            />
            <button 
              onClick={handleSendMessage}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center justify-center"
            >
              <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
