
import React, { useState, useRef } from 'react';
import { Course, Grade, Lecture, Exam, Assignment, ExamQuestion } from '../types';
import { GRADE_LABELS, Icons } from '../constants';
import { generateCourseDescription } from '../services/geminiService';

interface CourseManagementProps {
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  courses: Course[];
}

const CourseManagement: React.FC<CourseManagementProps> = ({ onAddCourse, onUpdateCourse, onDeleteCourse, courses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [grade, setGrade] = useState<Grade>('1SEC');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState('');
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [currentExamTitle, setCurrentExamTitle] = useState('');
  const [currentExamDuration, setCurrentExamDuration] = useState(45);
  const [currentExamQuestions, setCurrentExamQuestions] = useState<ExamQuestion[]>([]);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const examQuestionRef = useRef<HTMLInputElement>(null);

  const startEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setDescription(course.description);
    setThumbnail(course.thumbnail);
    setGrade(course.grade);
    setIsPaid(course.isPaid);
    setPrice(course.price || 0);
    setExpiryDate(course.expiryDate || '');
    setLectures(course.lectures);
    setAssignments(course.assignments);
    setExams(course.exams);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnail(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newLectures: Lecture[] = [];

    for (const file of Array.from(files) as File[]) {
      let type: Lecture['type'] = 'FILE';
      const mime = file.type;
      
      if (mime.startsWith('video/')) type = 'VIDEO';
      else if (mime.startsWith('audio/')) type = 'AUDIO';
      else if (mime.startsWith('image/')) type = 'IMAGE';

      newLectures.push({
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.split('.').slice(0, -1).join('.') || file.name,
        type,
        url: file as any,
        fileName: file.name
      });
    }

    setLectures(prev => [...prev, ...newLectures]);
    setIsUploading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const openExamModal = () => {
    setCurrentExamTitle('');
    setCurrentExamDuration(45);
    setCurrentExamQuestions([]);
    setIsExamModalOpen(true);
  };

  const handleAddExamQuestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newQ: ExamQuestion = {
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: reader.result as string,
          correctAnswer: 'A'
        };
        setCurrentExamQuestions([...currentExamQuestions, newQ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateQuestionAnswer = (id: string, ans: 'A' | 'B' | 'C' | 'D') => {
    setCurrentExamQuestions(prev => prev.map(q => q.id === id ? { ...q, correctAnswer: ans } : q));
  };

  const saveExam = () => {
    if (!currentExamTitle || currentExamQuestions.length === 0) return alert('أكمل بيانات امتحان أولاً');
    const newExam: Exam = {
      id: Math.random().toString(36).substr(2, 9),
      title: currentExamTitle,
      durationMinutes: currentExamDuration,
      questions: currentExamQuestions
    };
    setExams([...exams, newExam]);
    setIsExamModalOpen(false);
  };

  const addTimedAssignment = () => {
    const assTitle = prompt('أدخل عنوان الواجب:');
    if (!assTitle) return;
    
    const newAss: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      title: assTitle,
      description: 'واجب تعليمي من مستر مصر',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60
    };
    setAssignments([...assignments, newAss]);
  };

  const handleGenerateAI = async () => {
    if (!title) return alert('أدخل عنوان الكورس أولاً');
    setLoadingAI(true);
    const desc = await generateCourseDescription(title);
    setDescription(desc);
    setLoadingAI(false);
  };

  const handleSave = () => {
    if (!title || !description || !thumbnail) return alert('يرجى إكمال البيانات الأساسية');
    const courseData: Course = {
      id: editingCourseId || Math.random().toString(36).substr(2, 9),
      title,
      description,
      thumbnail,
      grade,
      isPaid,
      price: isPaid ? price : 0,
      expiryDate: expiryDate || undefined,
      lectures,
      exams,
      assignments
    };
    
    if (editingCourseId) {
      onUpdateCourse(courseData);
      alert('تم التحديث بنجاح!');
    } else {
      onAddCourse(courseData);
      alert('تم إضافة الكورس بنجاح!');
    }
    
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingCourseId(null);
    setTitle('');
    setDescription('');
    setThumbnail('');
    setGrade('1SEC');
    setIsPaid(false);
    setPrice(0);
    setExpiryDate('');
    setLectures([]);
    setAssignments([]);
    setExams([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn overflow-x-hidden">
      {/* Exam Creation Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-[2rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-scaleUp">
            <header className="p-5 sm:p-8 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400">بناء امتحان جديد 📝</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-all font-black p-2">✖️</button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2 block text-right">عنوان الامتحان</label>
                  <input value={currentExamTitle} onChange={e => setCurrentExamTitle(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-black outline-none text-right dark:text-white" placeholder="مثلاً: امتحان الوحدة الأولى" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2 block text-right">المدة (دقائق)</label>
                  <input type="number" value={currentExamDuration} onChange={e => setCurrentExamDuration(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-black outline-none text-right dark:text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                   <h4 className="font-black text-blue-600 text-sm sm:text-base">أسئلة الامتحان المصورة ({currentExamQuestions.length})</h4>
                   <button onClick={() => examQuestionRef.current?.click()} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg">➕ إضافة سؤال مصور</button>
                   <input type="file" ref={examQuestionRef} onChange={handleAddExamQuestion} className="hidden" accept="image/*" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {currentExamQuestions.map((q, idx) => (
                    <div key={q.id} className="bg-gray-50 dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
                      <div className="h-40 sm:h-48 overflow-hidden bg-white">
                        <img src={q.imageUrl} className="w-full h-full object-contain" alt="Question" />
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[9px] font-black text-gray-400">سؤال {idx + 1}</span>
                           <button onClick={() => setCurrentExamQuestions(currentExamQuestions.filter(x => x.id !== q.id))} className="text-red-500 text-[10px] font-black">حذف</button>
                        </div>
                        <div className="flex gap-1">
                          {(['A', 'B', 'C', 'D'] as const).map(ans => (
                            <button
                              key={ans}
                              onClick={() => updateQuestionAnswer(q.id, ans)}
                              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${q.correctAnswer === ans ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="p-5 sm:p-8 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3">
               <button onClick={saveExam} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl">حفظ الامتحان ونشره ✅</button>
               <button onClick={() => setIsExamModalOpen(false)} className="py-4 px-6 bg-white dark:bg-slate-800 text-gray-500 rounded-2xl font-black text-sm">إلغاء</button>
            </footer>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 gap-4">
        <h2 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400">إدارة المحتوى الضخم</h2>
        <button 
          onClick={() => { if (isAdding) resetForm(); setIsAdding(!isAdding); }}
          className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black transition-all shadow-xl ${isAdding ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-600 text-white'}`}
        >
          {isAdding ? 'إلغاء والرجوع' : 'إضافة كورس ضخم جديد 📦'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-blue-50 dark:border-slate-800 space-y-8 sm:space-y-10 relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b dark:border-slate-800 pb-6 gap-4">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-400">{editingCourseId ? 'تعديل بيانات الكورس' : 'إنشاء كورس جديد'}</h3>
            <button onClick={() => setIsAdding(false)} className="text-xs font-black bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-full border dark:border-slate-700">رجوع للقائمة</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
            <div className="space-y-6">
              <h3 className="font-black text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 pr-3">المعلومات الأساسية</h3>
              <div className="space-y-4">
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black text-right dark:text-white" placeholder="عنوان الكورس" />
                <select value={grade} onChange={e => setGrade(e.target.value as Grade)} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black text-right dark:text-white">
                  {Object.entries(GRADE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-2 block text-right">تاريخ انتهاء الكورس وحذفه تلقائياً (اختياري):</label>
                  <input 
                    type="datetime-local" 
                    value={expiryDate} 
                    onChange={e => setExpiryDate(e.target.value)} 
                    className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black text-right dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer w-full sm:w-auto">
                    <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-6 h-6 text-blue-600 rounded-lg" />
                    <span className="font-black text-gray-700 dark:text-gray-300">مدفوع</span>
                  </label>
                  {isPaid && <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full sm:w-32 p-3 border dark:border-slate-600 rounded-xl font-black text-center dark:bg-slate-700 dark:text-white" placeholder="السعر" />}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 pr-3">غلاف الكورس</h3>
              <div 
                onClick={() => thumbInputRef.current?.click()}
                className="relative border-4 border-dashed border-blue-50 dark:border-slate-700 rounded-[2rem] sm:rounded-[2.5rem] h-48 sm:h-60 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all overflow-hidden shadow-inner"
              >
                {thumbnail ? <img src={thumbnail} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center"><span className="text-4xl sm:text-6xl mb-2 block">📸</span><p className="text-[10px] sm:text-xs font-black text-gray-400">ارفع صورة الغلاف</p></div>}
                <input type="file" ref={thumbInputRef} onChange={handleThumbnailUpload} className="hidden" accept="image/*" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 pr-3">الوصف</h3>
              <button onClick={handleGenerateAI} disabled={loadingAI} className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl">{loadingAI ? 'جاري التوليد...' : 'توليد ذكي ✨'}</button>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 border dark:border-slate-700 rounded-3xl h-32 sm:h-40 bg-gray-50 dark:bg-slate-800 font-bold text-right dark:text-white" placeholder="وصف الكورس..." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
             <div className="lg:col-span-1 space-y-4">
               <h3 className="font-black text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 pr-3">المحاضرات</h3>
               <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-slate-700 h-80 sm:h-96 flex flex-col relative">
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                    {lectures.length === 0 ? <p className="text-[10px] text-gray-400 text-center py-20 font-black">لا توجد محاضرات</p> : 
                      lectures.map((l, i) => (
                        <div key={l.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border dark:border-slate-600 flex items-center justify-between shadow-sm">
                          <span className="text-[10px] font-black truncate flex-1 ml-2 dark:text-white">{i+1}. {l.title}</span>
                          <button onClick={() => setLectures(lectures.filter(x => x.id !== l.id))} className="text-red-500 font-black">✖️</button>
                        </div>
                      ))
                    }
                  </div>
                  <label className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-dashed border-blue-200 dark:border-slate-600 p-4 rounded-2xl cursor-pointer">
                    <Icons.Upload /><span className="font-black text-blue-600 dark:text-blue-400 text-[10px]">ارفع فيديوهات</span>
                    <input type="file" ref={bulkInputRef} multiple onChange={handleBulkUpload} className="hidden" accept="*/*" />
                  </label>
               </div>
             </div>

             <div className="lg:col-span-2 space-y-4">
               <h3 className="font-black text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 pr-3">الواجبات والامتحانات</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 flex flex-col h-80 sm:h-96">
                    <div className="flex-1 mb-4 space-y-2 overflow-y-auto custom-scrollbar">
                      {assignments.map(a => <div key={a.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border text-[9px] font-black flex justify-between items-center shadow-sm dark:text-white"><span>{a.title}</span><button onClick={() => setAssignments(assignments.filter(x => x.id !== a.id))} className="text-red-500">✖️</button></div>)}
                    </div>
                    <button onClick={addTimedAssignment} className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 py-3 rounded-2xl font-black text-[10px]">➕ إضافة واجب</button>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 flex flex-col h-80 sm:h-96">
                    <div className="flex-1 mb-4 space-y-2 overflow-y-auto custom-scrollbar">
                      {exams.map(e => <div key={e.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border text-[9px] font-black flex justify-between items-center shadow-sm dark:text-white"><span>{e.title}</span><button onClick={() => setExams(exams.filter(x => x.id !== e.id))} className="text-red-500">✖️</button></div>)}
                    </div>
                    <button onClick={openExamModal} className="w-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 py-3 rounded-2xl font-black text-[10px]">➕ إضافة امتحان</button>
                  </div>
               </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white p-5 rounded-[2rem] font-black text-lg sm:text-xl shadow-2xl active:scale-95 transition-all">
              {editingCourseId ? 'حفظ التعديلات' : 'نشر الكورس الضخم 🚀'}
            </button>
            <button onClick={() => setIsAdding(false)} className="py-5 px-10 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-[2rem] font-black text-base sm:text-lg">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col gap-4 hover:shadow-xl transition-all">
            <div className="h-36 sm:h-44 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative">
              <img src={course.thumbnail} className="w-full h-full object-cover" alt={course.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-3 right-4 text-white font-black text-sm sm:text-base truncate max-w-[80%]">{course.title}</div>
              {course.expiryDate && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">
                  مؤقت ⏱️
                </div>
              )}
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl text-[8px] sm:text-[9px] font-black">{course.lectures.length} ملف</span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(course)} className="text-blue-600 dark:text-blue-400 p-2 font-black text-[10px] bg-blue-50 dark:bg-blue-900/30 rounded-xl">تعديل</button>
                <button onClick={() => onDeleteCourse(course.id)} className="text-red-500 p-2 font-black text-[10px] bg-red-50 dark:bg-red-900/30 rounded-xl">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseManagement;
