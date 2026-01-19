
import React, { useState, useEffect } from 'react';
import { Course, Lecture, Exam, Assignment, User, PlatformConfig } from '../types';
import { Icons } from '../constants';

interface CourseViewProps {
  course: Course;
  user: User;
  onBack: () => void;
  onStartExam: (exam: Exam) => void;
  onActivateCourse: (courseId: string, code: string) => Promise<boolean>;
  onToggleLectureComplete?: (lectureId: string) => void;
  config: PlatformConfig; // إضافة config لاستخدام الأرقام الديناميكية
}

const CourseView: React.FC<CourseViewProps> = ({ course, user, onBack, onStartExam, onActivateCourse, onToggleLectureComplete, config }) => {
  const [activeTab, setActiveTab] = useState<'lectures' | 'exams' | 'assignments'>('lectures');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  
  // Payment States
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  const isUnlocked = !course.isPaid || (user.unlockedCourses && user.unlockedCourses.includes(course.id)) || user.role === 'ADMIN';

  useEffect(() => {
    if (selectedLecture && isUnlocked) {
      if ((selectedLecture.url as any) instanceof Blob || (selectedLecture.url as any) instanceof File) {
        const url = URL.createObjectURL(selectedLecture.url as unknown as Blob);
        setMediaUrl(url);
        
        return () => {
          URL.revokeObjectURL(url);
          setMediaUrl(null);
        };
      } else {
        setMediaUrl(selectedLecture.url as string);
      }
    }
  }, [selectedLecture, isUnlocked]);

  const handleActivate = async () => {
    if (!activationCodeInput.trim()) return alert('يرجى إدخال كود التفعيل أولاً');
    setIsActivating(true);
    const success = await onActivateCourse(course.id, activationCodeInput.trim());
    setIsActivating(false);
    if (success) {
      alert('مبروك! تم تفعيل الكورس بنجاح، يمكنك الآن البدء في المشاهدة.');
      setActivationCodeInput('');
    } else {
      alert('عذراً، كود التفعيل غير صحيح أو تم استخدامه من قبل.');
    }
  };

  const isLectureCompleted = selectedLecture ? user.completedLectures?.includes(selectedLecture.id) : false;

  const getOverallProgress = () => {
    if (!course.lectures || course.lectures.length === 0) return 0;
    const completedCount = course.lectures.filter(l => user.completedLectures?.includes(l.id)).length;
    return Math.round((completedCount / course.lectures.length) * 100);
  };

  if (!isUnlocked) {
    return (
      <div className="animate-fadeIn space-y-8 text-right flex flex-col items-center justify-center py-12 px-4">
         <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border-4 border-yellow-400/20 dark:border-yellow-400/10 max-w-2xl w-full text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-bl-full -mr-10 -mt-10"></div>
            <div className="text-7xl mb-6">🔒</div>
            <h2 className="text-3xl font-black text-blue-900 dark:text-blue-400 mb-4">{course.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold mb-8">عذراً، هذا المحتوى مدفوع ويحتاج للتفعيل للبدء في المشاهدة.</p>
            
            <div className="space-y-6">
              {!showPaymentInfo ? (
                <button 
                  onClick={() => setShowPaymentInfo(true)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all"
                >
                  طلب شراء الكورس 💳
                </button>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/50 space-y-4 animate-scaleUp">
                  <h4 className="font-black text-blue-900 dark:text-blue-300">طريقة الشراء والاستلام:</h4>
                  <div className="space-y-3 text-right text-sm">
                    <p className="flex items-center gap-3 justify-end text-gray-700 dark:text-gray-300">
                      <span className="font-black text-blue-600">{config.paymentNumber}</span>
                      <span>حول مبلغ الكورس على فودافون كاش:</span>
                    </p>
                    <p className="flex items-center gap-3 justify-end text-gray-700 dark:text-gray-300">
                      <span className="font-black text-blue-600">{config.teamWhatsapp}</span>
                      <span>ارسل صورة التحويل للتيم على واتساب:</span>
                    </p>
                    <p className="text-xs text-blue-500 font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-100 dark:border-slate-700 mt-4">
                      سيقوم الفريق بإرسال "كود التفعيل" الخاص بك لاستخدامه في الخانة أدناه.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <label className="text-xs font-black text-gray-400 block text-right pr-2">أدخل كود التفعيل الذي استلمته:</label>
                <div className="flex gap-2">
                   <button 
                     onClick={handleActivate}
                     disabled={isActivating}
                     className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {isActivating ? 'جاري التحقق...' : 'تفعيل'}
                   </button>
                   <input 
                     type="text" 
                     value={activationCodeInput}
                     onChange={(e) => setActivationCodeInput(e.target.value)}
                     className="flex-1 p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black text-center text-blue-600 dark:text-blue-400 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                     placeholder="X1Y2-Z3W4"
                   />
                </div>
              </div>

              <button 
                onClick={onBack}
                className="w-full text-gray-400 font-bold text-xs hover:text-red-500 transition-colors pt-4"
              >
                إلغاء والرجوع للكورسات
              </button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onBack} 
            className="p-2 sm:p-3 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 rounded-xl sm:rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center shadow-sm"
            title="الرجوع للقائمة"
          >
            <Icons.ArrowRight />
          </button>
          <div className="text-right flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-blue-900 dark:text-blue-400 truncate">{course.title}</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold line-clamp-1">{course.description}</p>
          </div>
        </div>

        {user.role !== 'ADMIN' && (
           <div className="pt-2 border-t dark:border-slate-800">
              <div className="flex justify-between items-center text-[10px] font-black mb-1.5">
                 <span className="text-blue-600 dark:text-blue-400">تقدمك في هذا الكورس: {getOverallProgress()}%</span>
                 <span className="text-gray-400">{course.lectures.filter(l => user.completedLectures?.includes(l.id)).length} / {course.lectures.length} محاضرة</span>
              </div>
              <div className="h-1.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                   style={{ width: `${getOverallProgress()}%` }}
                 ></div>
              </div>
           </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-x-auto custom-scrollbar no-scrollbar">
        {(['lectures', 'exams', 'assignments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[90px] sm:min-w-[120px] py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50'
            }`}
          >
            {tab === 'lectures' ? 'المحاضرات' : tab === 'exams' ? 'الامتحانات' : 'الواجبات'}
          </button>
        ))}
      </div>

      {/* Main Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1 space-y-3 sm:space-y-4 order-2 lg:order-1">
          {activeTab === 'lectures' && (
            <div className="space-y-2 sm:space-y-3">
              {course.lectures.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] text-center text-gray-400 font-bold border border-dashed border-gray-200">لا توجد محاضرات</div>
              ) : (
                course.lectures.map((lecture) => {
                  const isDone = user.completedLectures?.includes(lecture.id);
                  return (
                    <button
                      key={lecture.id}
                      onClick={() => { setSelectedLecture(lecture); setIsFullPreview(false); }}
                      className={`w-full text-right p-3 sm:p-4 rounded-[1.25rem] sm:rounded-2xl border transition-all flex items-center gap-3 sm:gap-4 relative ${
                        selectedLecture?.id === lecture.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 ring-4 ring-blue-500/10' 
                          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">
                        {lecture.type === 'VIDEO' ? '🎥' : lecture.type === 'AUDIO' ? '🎧' : lecture.type === 'IMAGE' ? '🖼️' : '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-xs sm:text-sm truncate ${selectedLecture?.id === lecture.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{lecture.title}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold">{lecture.type === 'IMAGE' ? 'سبورة تعليمية' : lecture.type === 'AUDIO' ? 'شرح صوتي' : lecture.type === 'FILE' ? 'ملخص/ملف' : 'محاضرة'}</p>
                      </div>
                      {isDone && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full shadow-md animate-bounce">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-3">
              {course.exams.map((exam) => (
                <div key={exam.id} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="text-right min-w-0 flex-1 ml-3">
                    <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate">{exam.title}</p>
                    <p className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-black">{exam.durationMinutes} دقيقة</p>
                  </div>
                  <button 
                    onClick={() => { if (confirm(`هل أنت جاهز للامتحان؟`)) onStartExam(exam); }}
                    className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black shadow-lg"
                  >
                    بدء
                  </button>
                </div>
              ))}
              {course.exams.length === 0 && <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] text-center text-gray-400 font-black border border-dashed">لا توجد امتحانات</div>}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {course.assignments.map((ass) => (
                <div key={ass.id} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="text-right flex-1 min-w-0 ml-3">
                    <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate">{ass.title}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold">الموعد: {new Date(ass.deadline).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black">عرض</button>
                </div>
              ))}
              {course.assignments.length === 0 && <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] text-center text-gray-400 font-black border border-dashed">لا توجد واجبات</div>}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2">
          {selectedLecture && mediaUrl ? (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-800 sticky top-24 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                 <h3 className="text-lg sm:text-xl font-black text-blue-900 dark:text-blue-400 flex items-center gap-3 order-1 sm:order-2">
                  <span className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    {selectedLecture.type === 'VIDEO' ? '🎥' : selectedLecture.type === 'AUDIO' ? '🎧' : selectedLecture.type === 'IMAGE' ? '🖼️' : '📄'}
                  </span>
                  {selectedLecture.title}
                </h3>
                 <div className="flex gap-2 order-2 sm:order-1 w-full sm:w-auto">
                   {(selectedLecture.type === 'IMAGE' || selectedLecture.type === 'FILE' || selectedLecture.type === 'AUDIO') && (
                     <>
                       {selectedLecture.type === 'IMAGE' && <button onClick={() => setIsFullPreview(true)} className="flex-1 sm:flex-none text-[9px] sm:text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-4 py-2.5 rounded-xl border border-blue-100 transition-all">تكبير 🔍</button>}
                       <a href={mediaUrl} download={selectedLecture.fileName || 'content'} className="flex-1 sm:flex-none text-[9px] sm:text-[10px] font-black bg-green-50 dark:bg-green-900/30 text-green-600 px-4 py-2.5 rounded-xl border border-green-100 text-center">تنزيل المحتوى 📥</a>
                     </>
                   )}
                 </div>
              </div>
              
              <div className="rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-black aspect-video flex items-center justify-center border-2 sm:border-4 border-gray-50 dark:border-slate-800 relative group">
                {selectedLecture.type === 'VIDEO' && (
                  <video key={mediaUrl} src={mediaUrl} controls className="w-full h-full" poster={course.thumbnail} controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
                )}
                {selectedLecture.type === 'IMAGE' && (
                  <img src={mediaUrl} className="w-full h-full object-contain cursor-zoom-in" onClick={() => setIsFullPreview(true)} alt={selectedLecture.title} />
                )}
                {selectedLecture.type === 'AUDIO' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 p-8">
                     <div className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
                        <span className="text-6xl">🎧</span>
                     </div>
                     <audio key={mediaUrl} src={mediaUrl} controls className="w-full max-w-md h-12" />
                     <p className="mt-4 text-white/60 text-xs font-bold">جاري تشغيل الشرح الصوتي..</p>
                  </div>
                )}
                {selectedLecture.type === 'FILE' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800 p-8">
                     <div className="text-8xl mb-6">📄</div>
                     <h4 className="text-xl font-black text-gray-800 dark:text-white mb-4">{selectedLecture.fileName}</h4>
                     <a 
                       href={mediaUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3"
                     >
                       <span>معاينة أو تحميل الملف</span>
                       <Icons.Upload />
                     </a>
                  </div>
                )}
              </div>

              {/* زر إتمام المحاضرة */}
              {user.role !== 'ADMIN' && (
                <div className="mt-6 pt-6 border-t dark:border-slate-800">
                   <button 
                     onClick={() => onToggleLectureComplete?.(selectedLecture.id)}
                     className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                       isLectureCompleted 
                         ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50' 
                         : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                     }`}
                   >
                     {isLectureCompleted ? (
                       <><span>تم الإنجاز بنجاح ✨</span><Icons.Home /></>
                     ) : (
                       <><span>تم الانتهاء من هذه المحاضرة ✅</span></>
                     )}
                   </button>
                   <p className="text-center text-[10px] text-gray-400 font-bold mt-3 italic">الضغط على الزر يساعد المستر في متابعة تقدمك الدراسي</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 h-[250px] sm:h-[400px] rounded-[2.5rem] sm:rounded-[3.5rem] border border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center text-gray-400 font-black">
              <span className="text-4xl sm:text-6xl mb-4">📺</span>
              <p className="text-sm sm:text-base">اختر محاضرة للبدء</p>
            </div>
          )}
        </div>
      </div>
      
      {isFullPreview && mediaUrl && selectedLecture?.type === 'IMAGE' && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-fadeIn" onClick={() => setIsFullPreview(false)}>
          <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all z-10" onClick={() => setIsFullPreview(false)}>✖️</button>
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={mediaUrl} className="max-w-full max-h-[85vh] object-contain rounded-lg" alt="Full Preview" />
            <div className="absolute bottom-4 sm:bottom-8 flex gap-4 w-full justify-center px-4">
               <a href={mediaUrl} download={selectedLecture.fileName || 'subora.png'} className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full font-black flex items-center gap-2 shadow-xl text-sm"><span>تحميل السبورة</span><Icons.Upload /></a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseView;
