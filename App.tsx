
import React, { useState, useEffect, useRef } from 'react';
import { User, Course, Grade, PlatformConfig, UserRole, Certificate, StudentLevel, Exam, ActivationCode } from './types';
import { INITIAL_CONFIG, GRADE_LABELS, LEVEL_LABELS, Icons } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CourseManagement from './components/CourseManagement';
import Forum from './components/Forum';
import LandingPage from './components/LandingPage';
import CourseView from './components/CourseView';
import ExamSystem from './components/ExamSystem';
import CertificateModal from './components/CertificateModal';
import { generateCertificateContent } from './services/geminiService';
import { db } from './db';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [view, setView] = useState<'LANDING' | 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'UPDATE_PROFILE' | 'APP'>('LANDING');
  const [config, setConfig] = useState<PlatformConfig>(INITIAL_CONFIG);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [signupAvatar, setSignupAvatar] = useState<string>('');
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [viewedCert, setViewedCert] = useState<{cert: Certificate, studentName: string} | null>(null);
  
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveredUser, setRecoveredUser] = useState<User | null>(null);

  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<{ score: number, total: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const signupAvatarRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);
  const appBgInputRef = useRef<HTMLInputElement>(null);
  const dashboardBgInputRef = useRef<HTMLInputElement>(null);
  const coursesBgInputRef = useRef<HTMLInputElement>(null);

  const prevCoursesCount = useRef<number>(0);
  const notifiedDeadlines = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCourses: any = await db.get('courses');
        if (savedCourses) {
          setCourses(savedCourses);
          prevCoursesCount.current = savedCourses.length;
        }
        const savedUsers: any = await db.get('users');
        if (savedUsers) setAllUsers(savedUsers);
        const savedConfig: any = await db.get('config');
        if (savedConfig) setConfig(savedConfig);
        const savedCodes: any = await db.get('activationCodes');
        if (savedCodes) setActivationCodes(savedCodes);
      } catch (err) {
        console.error("Database load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // نظام الحذف التلقائي للكورسات المنتهية
  useEffect(() => {
    if (isLoading || courses.length === 0) return;

    const checkExpirations = () => {
      const now = new Date().getTime();
      let hasChanged = false;
      const validCourses = courses.filter(course => {
        if (!course.expiryDate) return true;
        const isExpired = new Date(course.expiryDate).getTime() <= now;
        if (isExpired) {
          console.log(`Course "${course.title}" has expired and will be auto-deleted.`);
          hasChanged = true;
        }
        return !isExpired;
      });

      if (hasChanged) {
        setCourses(validCourses);
        if (selectedCourse && !validCourses.find(c => c.id === selectedCourse.id)) {
          setSelectedCourse(null);
        }
      }
    };

    checkExpirations();
    const interval = setInterval(checkExpirations, 60000); 
    return () => clearInterval(interval);
  }, [courses, isLoading, selectedCourse]);

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: config.logo || INITIAL_CONFIG.logo,
      });
    }
  };

  useEffect(() => {
    if (!isLoading && courses.length > prevCoursesCount.current) {
      const lastCourse = courses[courses.length - 1];
      if (currentUser?.role === 'STUDENT' && lastCourse.grade === currentUser.grade) {
        sendNotification('كورس جديد متاح! 📚', `تمت إضافة كورس: ${lastCourse.title}. ابدأ المذاكرة الآن!`);
      }
      prevCoursesCount.current = courses.length;
    }
  }, [courses, isLoading, currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'STUDENT') return;

    const checkDeadlines = () => {
      const now = Date.now();
      courses.forEach(course => {
        if (course.grade === currentUser.grade) {
          course.assignments.forEach(assignment => {
            const deadlineDate = new Date(assignment.deadline).getTime();
            const timeDiff = deadlineDate - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (timeDiff > 0 && hoursDiff < 24 && !notifiedDeadlines.current.has(assignment.id)) {
              sendNotification('تنبيه واجب! ✍️', `اقترب موعد تسليم واجب: "${assignment.title}" في كورس ${course.title}.`);
              notifiedDeadlines.current.add(assignment.id);
            }
          });
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 600000); 
    return () => clearInterval(interval);
  }, [courses, currentUser]);

  useEffect(() => {
    if (!isLoading) {
      db.save('courses', courses);
      db.save('users', allUsers);
      db.save('config', config);
      db.save('activationCodes', activationCodes);
    }
  }, [courses, allUsers, config, activationCodes, isLoading]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) html.classList.add('dark');
    else html.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim().toLowerCase();
    const password = formData.get('password') as string;

    if (email === config.adminEmail.toLowerCase() && password === config.adminPassword) {
      const admin: User = {
        id: 'admin', fullName: config.teacherName, email: config.adminEmail, phone: config.teamPhone, parentPhone: '', studentCode: 'ADMIN-01',
        governorate: 'القاهرة', address: '', detailedAddress: '', age: '30', grade: '3SEC', role: 'ADMIN', level: 'EXCELLENT',
        isBlocked: false, loginCount: 0, completedLectures: [], unlockedCourses: [], certificates: [], progress: 100, createdAt: Date.now()
      };
      setCurrentUser(admin);
      setView('APP');
      return;
    }

    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email && u.password === password);
    if (userIndex !== -1) {
      const user = allUsers[userIndex];
      if (user.isBlocked) return alert('هذا الحساب محظور من قبل الإدارة.');
      
      const updatedUser = { ...user, loginCount: (user.loginCount || 0) + 1 };
      const updatedAllUsers = [...allUsers];
      updatedAllUsers[userIndex] = updatedUser;
      
      setAllUsers(updatedAllUsers);
      setCurrentUser(updatedUser);
      setView('APP');
    } else {
      alert('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  };

  const handleRecoveryCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const user = allUsers.find(u => 
      u.email.toLowerCase() === recoveryEmail.trim().toLowerCase() && 
      u.phone === recoveryPhone.trim()
    );
    if (user) {
      setRecoveredUser(user);
      setView('UPDATE_PROFILE');
    } else {
      alert('عذراً، لم نجد حساباً يطابق هذه البيانات.');
    }
  };

  const handleUpdateAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!recoveredUser) return;

    const updatedUser: User = {
      ...recoveredUser,
      fullName: formData.get('fullName') as string,
      email: (formData.get('email') as string).toLowerCase(),
      password: formData.get('password') as string,
      phone: formData.get('phone') as string,
      parentPhone: formData.get('parentPhone') as string,
      studentCode: formData.get('studentCode') as string,
      grade: formData.get('grade') as Grade,
      governorate: formData.get('governorate') as string,
      detailedAddress: formData.get('detailedAddress') as string,
      profilePicture: signupAvatar || recoveredUser.profilePicture
    };

    setAllUsers(prev => prev.map(u => u.id === recoveredUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setView('APP');
    alert('تم تحديث بياناتك بنجاح!');
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim().toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === email)) return alert('البريد مسجل مسبقاً');

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.get('fullName') as string,
      email: email,
      password: formData.get('password') as string,
      phone: (formData.get('phone') as string).trim(),
      parentPhone: formData.get('parentPhone') as string,
      studentCode: formData.get('studentCode') as string || Math.floor(1000 + Math.random() * 9000).toString(),
      governorate: formData.get('governorate') as string,
      address: formData.get('governorate') as string,
      detailedAddress: formData.get('detailedAddress') as string,
      age: '16',
      grade: formData.get('grade') as Grade,
      role: 'STUDENT', level: 'AVERAGE', isBlocked: false, loginCount: 1, completedLectures: [], unlockedCourses: [], certificates: [], progress: 0, createdAt: Date.now(),
      profilePicture: signupAvatar
    };
    setAllUsers([...allUsers, newUser]);
    setCurrentUser(newUser);
    setView('APP');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'signup' | 'logo' | 'hero' | 'loginBg' | 'appBg' | 'dashboardBg' | 'coursesBg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'signup') setSignupAvatar(base64);
        else if (type === 'logo') setConfig({ ...config, logo: base64 });
        else if (type === 'hero') setConfig({ ...config, landingHeroImage: base64 });
        else if (type === 'loginBg') setConfig({ ...config, loginBackground: base64 });
        else if (type === 'appBg') setConfig({ ...config, appBackground: base64 });
        else if (type === 'dashboardBg') setConfig({ ...config, dashboardBackground: base64 });
        else if (type === 'coursesBg') setConfig({ ...config, coursesBackground: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkLectureComplete = (lectureId: string) => {
    if (!currentUser || currentUser.role === 'ADMIN') return;
    
    const isCompleted = currentUser.completedLectures.includes(lectureId);
    let updatedLectures = [...currentUser.completedLectures];
    
    if (isCompleted) {
      updatedLectures = updatedLectures.filter(id => id !== lectureId);
    } else {
      updatedLectures.push(lectureId);
    }
    
    const updatedUser = { ...currentUser, completedLectures: updatedLectures };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const handleIssueCertificate = async (student: User) => {
    setIsGeneratingCert(true);
    try {
      const content = await generateCertificateContent(student.fullName, GRADE_LABELS[student.grade], 'EXCELLENCE');
      const newCert: Certificate = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'شهادة تقدير وتفوق 🏆',
        content,
        date: new Date().toLocaleDateString('ar-EG'),
        type: 'EXCELLENCE'
      };
      
      const updatedUser = { ...student, certificates: [...(student.certificates || []), newCert] };
      setAllUsers(prev => prev.map(u => u.id === student.id ? updatedUser : u));
      alert('تم إصدار شهادة التقدير بنجاح بالتعاون مع الذكاء الاصطناعي ✨');
    } catch (error) {
      alert('حدث خطأ أثناء إصدار الشهادة');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  const handleActivateCourse = async (courseId: string, code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const codeEntry = activationCodes.find(c => c.code === code && c.courseId === courseId && !c.isUsed);
    if (codeEntry) {
      const updatedCodes = activationCodes.map(c => c.code === code ? { ...c, isUsed: true, usedBy: currentUser.id } : c);
      setActivationCodes(updatedCodes);
      const updatedUser = { ...currentUser, unlockedCourses: [...(currentUser.unlockedCourses || []), courseId] };
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      return true;
    }
    return false;
  };

  const generateCodeForCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const newCode: ActivationCode = {
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      courseId, courseTitle: course.title, isUsed: false, createdAt: Date.now()
    };
    setActivationCodes(prev => [...prev, newCode]);
    alert(`تم توليد الكود: ${newCode.code}`);
  };

  const deleteCode = (code: string) => {
    if (confirm('حذف الكود نهائياً؟')) setActivationCodes(prev => prev.filter(c => c.code !== code));
  };

  const calculateStudentProgressInCourse = (student: User, course: Course) => {
    if (!course.lectures || course.lectures.length === 0) return 0;
    const completedCount = course.lectures.filter(l => student.completedLectures?.includes(l.id)).length;
    return Math.round((completedCount / course.lectures.length) * 100);
  };

  const calculateTotalAverageProgress = (student: User) => {
    const studentCourses = courses.filter(c => student.unlockedCourses?.includes(c.id));
    if (studentCourses.length === 0) return 0;
    const totalProgress = studentCourses.reduce((acc, course) => acc + calculateStudentProgressInCourse(student, course), 0);
    return Math.round(totalProgress / studentCourses.length);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black bg-white dark:bg-slate-950">جاري التحميل...</div>;
  
  const stats = {
    studentCount: allUsers.filter(u => u.role === 'STUDENT').length, 
    courseCount: courses.length, 
    lectureCount: courses.reduce((acc, c) => acc + c.lectures.length, 0),
    levelCounts: { 
      EXCELLENT: allUsers.filter(u => u.role === 'STUDENT' && u.level === 'EXCELLENT').length, 
      AVERAGE: allUsers.filter(u => u.role === 'STUDENT' && u.level === 'AVERAGE').length, 
      WEAK: allUsers.filter(u => u.role === 'STUDENT' && u.level === 'WEAK').length 
    },
    gradeCounts: {
      '1SEC': allUsers.filter(u => u.role === 'STUDENT' && u.grade === '1SEC').length,
      '2SEC': allUsers.filter(u => u.role === 'STUDENT' && u.grade === '2SEC').length,
      '3SEC': allUsers.filter(u => u.role === 'STUDENT' && u.grade === '3SEC').length
    }
  };

  if (view === 'LANDING') return <LandingPage config={config} onEnter={() => setView('LOGIN')} stats={stats} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;

  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdminOrTeam = isAdmin || currentUser?.role === 'TEAM';
  
  const selectedStudent = allUsers.find(u => u.id === selectedStudentId);

  // أنماط الخلفيات الخاصة بالصفحات
  const dashboardStyle = config.dashboardBackground 
    ? { backgroundImage: `url(${config.dashboardBackground})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100%' }
    : {};
    
  const coursesStyle = config.coursesBackground
    ? { backgroundImage: `url(${config.coursesBackground})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100%' }
    : {};

  if (!currentUser || view !== 'APP') {
    if (['LOGIN', 'SIGNUP', 'FORGOT', 'UPDATE_PROFILE'].includes(view)) {
      const isSignup = view === 'SIGNUP';
      const isForgot = view === 'FORGOT';
      const isUpdate = view === 'UPDATE_PROFILE';
      const targetUser = isUpdate ? recoveredUser : null;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-700 bg-cover bg-center relative" style={{ backgroundImage: view === 'LOGIN' ? `url(${config.loginBackground})` : 'none', backgroundColor: view === 'LOGIN' ? 'rgba(0,0,0,0.5)' : '#f9fafb' }}>
          <button 
            onClick={() => setView('LANDING')} 
            className="absolute top-6 right-6 z-50 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all shadow-xl flex items-center gap-2 group border border-white/10"
          >
            <Icons.ArrowRight />
            <span className="hidden group-hover:block font-black text-xs ml-2">العودة للرئيسية</span>
          </button>

          <div className={`max-w-xl w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 sm:p-12 border dark:border-slate-800 animate-fadeIn text-right overflow-y-auto max-h-[95vh] custom-scrollbar`}>
            <div className="flex justify-center mb-6"><img src={config.logo} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" /></div>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-400 mb-8 text-center">{isForgot ? 'استعادة الحساب 🔑' : isUpdate ? 'تحديث بيانات الحساب ⚙️' : isSignup ? 'إنشاء حساب طالب جديد ✨' : 'تسجيل الدخول للمنصة'}</h2>
            {isForgot ? (
              <form onSubmit={handleRecoveryCheck} className="space-y-4">
                 <input value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} placeholder="البريد الإلكتروني المسجل" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                 <input value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)} placeholder="رقم الموبايل المسجل" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">تحقق من البيانات</button>
                 <button type="button" onClick={() => setView('LOGIN')} className="w-full mt-4 text-gray-400 font-bold text-xs">رجوع</button>
              </form>
            ) : view === 'LOGIN' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <input name="email" type="email" placeholder="البريد الإلكتروني" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                <input name="password" type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all">دخول</button>
                <div className="mt-8 space-y-4 text-center">
                  <button type="button" onClick={() => setView('FORGOT')} className="text-red-500 font-bold text-xs hover:underline">نسيت كلمة المرور؟ استعادة وتعديل البيانات</button>
                  <div className="h-[1px] bg-gray-100 dark:bg-slate-800 w-full"></div>
                  <button type="button" onClick={() => setView('SIGNUP')} className="text-blue-600 dark:text-blue-400 font-black text-sm">ليس لديك حساب؟ اشترك الآن</button>
                </div>
              </form>
            ) : (
              <form onSubmit={isUpdate ? handleUpdateAccount : handleSignup} className="space-y-6">
                <div className="flex justify-center mb-6">
                   <div onClick={() => signupAvatarRef.current?.click()} className="w-28 h-28 rounded-full bg-blue-50 dark:bg-slate-800 border-4 border-dashed border-blue-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden relative group">
                      {signupAvatar || targetUser?.profilePicture ? <img src={signupAvatar || targetUser?.profilePicture} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-3xl">👤</span><p className="text-[8px] font-black text-gray-400 mt-1">رفع صورة</p></div>}
                      <input type="file" ref={signupAvatarRef} onChange={e => handleImageUpload(e, 'signup')} className="hidden" accept="image/*" />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="fullName" defaultValue={targetUser?.fullName} placeholder="الاسم بالكامل" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                  <select name="grade" defaultValue={targetUser?.grade} required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white">
                    {Object.entries(GRADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <input name="email" type="email" defaultValue={targetUser?.email} placeholder="البريد الإلكتروني" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="phone" defaultValue={targetUser?.phone} placeholder="رقم الموبايل" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                  <input name="parentPhone" defaultValue={targetUser?.parentPhone} placeholder="رقم ولي الأمر" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="governorate" defaultValue={targetUser?.governorate} placeholder="المحافظة" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                  <input name="studentCode" defaultValue={targetUser?.studentCode} placeholder="كود الطالب في الدرس" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                </div>
                <textarea name="detailedAddress" defaultValue={targetUser?.detailedAddress} placeholder="العنوان بالتفصيل (شارع، مبنى، دور)" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white h-24" />
                <input name="password" type="password" defaultValue={targetUser?.password} placeholder="كلمة المرور الجديدة" required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold text-right dark:text-white" />
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-blue-700 transition-all">{isUpdate ? 'حفظ التعديلات' : 'تسجيل حساب جديد'}</button>
                <button type="button" onClick={() => setView('LOGIN')} className="w-full mt-4 text-gray-400 font-bold text-xs">إلغاء والعودة لصفحة الدخول</button>
              </form>
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {activeExam && <ExamSystem exam={activeExam} onFinish={(score, total) => { setExamResult({ score, total }); setActiveExam(null); }} />}
      {examResult && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-center animate-scaleUp border dark:border-slate-800">
              <div className="text-7xl mb-6">🏆</div>
              <h3 className="text-3xl font-black text-blue-900 dark:text-blue-400 mb-2">انتهى الامتحان!</h3>
              <div className="text-7xl font-black text-blue-600 mb-10">{examResult.score} <span className="text-3xl text-gray-300">/</span> {examResult.total}</div>
              <button onClick={() => setExamResult(null)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg">العودة للمنصة</button>
           </div>
        </div>
      )}

      {viewedCert && (
        <CertificateModal certificate={viewedCert.cert} studentName={viewedCert.studentName} config={config} onClose={() => setViewedCert(null)} />
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 sm:p-12 shadow-2xl text-right relative overflow-y-auto max-h-[90vh] custom-scrollbar border-4 border-blue-600/20">
              <button onClick={() => setSelectedStudentId(null)} className="absolute top-8 left-8 text-gray-400 hover:text-red-500 transition-all font-black text-xl">✖</button>
              <div className="flex items-center gap-6 mb-10">
                 <img src={selectedStudent.profilePicture || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full border-4 border-blue-600 object-cover shadow-lg" />
                 <div>
                    <h3 className="text-2xl font-black text-blue-900 dark:text-blue-400">{selectedStudent.fullName}</h3>
                    <p className="text-gray-400 font-bold">{GRADE_LABELS[selectedStudent.grade]}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8">
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[10px] text-gray-400 font-black">تاريخ التسجيل بالمنصة:</p>
                    <p className="font-black text-blue-700 dark:text-blue-300 text-lg">{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' }) : 'غير متوفر'}</p>
                 </div>
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[10px] text-gray-400 font-black">إجمالي مرات الدخول:</p>
                    <p className="font-black text-blue-700 dark:text-blue-300 text-lg">{selectedStudent.loginCount || 0} دخول</p>
                 </div>
              </div>

              <div className="mb-10 space-y-4">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-blue-900 dark:text-blue-400 border-r-4 border-blue-600 pr-3">متابعة تقدم الطالب (كورس بكورس)</h4>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black">نشط الآن ✅</span>
                 </div>
                 <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-dashed dark:border-slate-700">
                    {courses.filter(c => selectedStudent.unlockedCourses?.includes(c.id)).length === 0 ? (
                      <p className="text-center text-xs text-gray-400 font-bold py-10">لم يقم الطالب بتفعيل أي كورسات حتى الآن</p>
                    ) : (
                      courses.filter(c => selectedStudent.unlockedCourses?.includes(c.id)).map(course => {
                        const prog = calculateStudentProgressInCourse(selectedStudent, course);
                        return (
                          <div key={course.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                             <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-xs text-gray-800 dark:text-gray-200">{course.title}</span>
                                <span className={`font-black text-xs px-2 py-1 rounded-md ${prog === 100 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{prog}%</span>
                             </div>
                             <div className="h-2.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className={`h-full transition-all duration-1000 ease-out ${prog === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                                  style={{ width: `${prog}%` }}
                                ></div>
                             </div>
                             <div className="flex justify-between mt-2">
                                <p className="text-[9px] text-gray-400 font-bold">المحاضرات: {selectedStudent.completedLectures?.filter(id => course.lectures.some(l => l.id === id)).length} من {course.lectures.length}</p>
                                {prog === 100 && <span className="text-[9px] text-green-500 font-black">أتم المنهج 🏆</span>}
                             </div>
                          </div>
                        );
                      })
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border dark:border-slate-700">
                 <div className="space-y-1"><p className="text-10px text-gray-400 font-black">البريد:</p><p className="font-bold truncate">{selectedStudent.email}</p></div>
                 <div className="space-y-1"><p className="text-10px text-gray-400 font-black">الموبايل:</p><p className="font-bold">{selectedStudent.phone}</p></div>
                 <div className="space-y-1"><p className="text-10px text-gray-400 font-black">ولي الأمر:</p><p className="font-bold">{selectedStudent.parentPhone}</p></div>
                 <div className="space-y-1"><p className="text-10px text-gray-400 font-black">كود الطالب:</p><p className="font-bold">{selectedStudent.studentCode}</p></div>
                 <div className="sm:col-span-2 space-y-1 pt-2 border-t dark:border-slate-700"><p className="text-10px text-gray-400 font-black">العنوان بالتفصيل:</p><p className="font-bold leading-relaxed">{selectedStudent.detailedAddress}, {selectedStudent.governorate}</p></div>
              </div>

              <div className="mt-8 pt-8 border-t dark:border-slate-800 space-y-4">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <p className="text-xs font-black text-gray-400 mb-2">تعديل مستوى الطالب:</p>
                        <select 
                          value={selectedStudent.level} 
                          onChange={(e) => {
                            const newLevel = e.target.value as StudentLevel;
                            setAllUsers(prev => prev.map(u => u.id === selectedStudent.id ? {...u, level: newLevel} : u));
                          }} 
                          className="w-full p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-100 rounded-2xl font-black text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500 transition-all"
                        >
                          {Object.entries(LEVEL_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <button 
                      onClick={() => handleIssueCertificate(selectedStudent)}
                      disabled={isGeneratingCert}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-2xl font-black shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 border-b-4 border-yellow-700 active:translate-y-1 active:border-b-0"
                    >
                       {isGeneratingCert ? 'جاري التوليد... ⏳' : 'إرسال شهادة تقدير AI ✨'}
                    </button>
                 </div>
                 <button 
                   onClick={() => {
                     const isBlocked = !selectedStudent.isBlocked;
                     setAllUsers(prev => prev.map(u => u.id === selectedStudent.id ? {...u, isBlocked} : u));
                     alert(isBlocked ? 'تم حظر الطالب' : 'تم فك حظر الطالب');
                   }}
                   className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all border-b-4 ${selectedStudent.isBlocked ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'}`}
                 >
                   {selectedStudent.isBlocked ? 'إلغاء حظر الطالب والسماح بالدخول ✅' : 'حظر الطالب من المنصة نهائياً 🚫'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <Layout user={currentUser} config={config} onLogout={() => { setCurrentUser(null); setView('LANDING'); }} activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
        {selectedCourse ? (
          <CourseView 
            course={selectedCourse} 
            user={currentUser} 
            onBack={() => setSelectedCourse(null)} 
            onStartExam={setActiveExam} 
            onActivateCourse={handleActivateCourse}
            onToggleLectureComplete={handleMarkLectureComplete}
            config={config} 
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div style={dashboardStyle} className="rounded-[2rem] overflow-hidden">
                <Dashboard 
                  user={currentUser} 
                  allUsers={allUsers} 
                  stats={stats} 
                  recentCourses={courses.filter(c => c.grade === currentUser.grade || isAdminOrTeam).slice(-3).reverse()} 
                  onCourseClick={setSelectedCourse} 
                  config={config} 
                />
              </div>
            )}
            {activeTab === 'courses' && (
              isAdmin ? <CourseManagement courses={courses} onAddCourse={c => setCourses([...courses, c])} onUpdateCourse={c => setCourses(courses.map(i => i.id === c.id ? c : i))} onDeleteCourse={id => setCourses(courses.filter(c => c.id !== id))} />
              : (
                <div style={coursesStyle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 rounded-[2rem]">
                  {courses.filter(c => c.grade === currentUser.grade || isAdminOrTeam).map(course => (
                    <div key={course.id} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-[3rem] p-5 shadow-sm border dark:border-slate-800 group hover:shadow-2xl transition-all flex flex-col h-full relative overflow-hidden">
                      {course.isPaid && !(currentUser.unlockedCourses || []).includes(course.id) && !isAdmin && (
                        <div className="absolute top-6 left-6 z-10 bg-yellow-400 text-blue-900 text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg">مدفوع 🔒</div>
                      )}
                      <div className="h-52 rounded-[2.5rem] overflow-hidden mb-6"><img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" /></div>
                      <h3 className="font-black text-xl mb-3 text-gray-900 dark:text-white">{course.title}</h3>
                      <p className="text-gray-400 text-xs font-bold line-clamp-2 mb-8">{course.description}</p>
                      
                      {!isAdmin && currentUser.unlockedCourses?.includes(course.id) && (
                         <div className="mb-4 space-y-1">
                            <div className="flex justify-between text-[8px] font-black text-blue-600"><span className="opacity-60">التقدم:</span><span>{calculateStudentProgressInCourse(currentUser, course)}%</span></div>
                            <div className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${calculateStudentProgressInCourse(currentUser, course)}%`}}></div></div>
                         </div>
                      )}

                      <button onClick={() => setSelectedCourse(course)} className="w-full mt-auto bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl">دخول الكورس 🎥</button>
                    </div>
                  ))}
                </div>
              )
            )}
            {activeTab === 'purchaseRequests' && isAdmin && (
              <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 text-right space-y-12">
                 <h2 className="text-3xl font-black text-blue-900 dark:text-blue-400">إصدار أكواد التفعيل 💰</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {courses.filter(c => c.isPaid).map(c => (
                     <div key={c.id} className="bg-gray-50 dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700 flex flex-col justify-between shadow-sm">
                       <p className="font-black text-sm mb-4 leading-relaxed">{c.title}</p>
                       <button onClick={() => generateCodeForCourse(c.id)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs hover:bg-blue-700 shadow-md">توليد كود تفعيل ⚡</button>
                     </div>
                   ))}
                 </div>
                 <div className="overflow-x-auto rounded-3xl border dark:border-slate-800 shadow-sm">
                    <table className="w-full">
                       <thead className="bg-gray-50 dark:bg-slate-800"><tr><th className="p-5 text-right font-black text-gray-500">الكود</th><th className="p-5 text-right font-black text-gray-500">الكورس</th><th className="p-5 text-right font-black text-gray-500">الحالة</th><th className="p-5 text-center font-black text-gray-500">حذف</th></tr></thead>
                       <tbody>{activationCodes.slice().reverse().map(code => (
                             <tr key={code.code} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all">
                                <td className="p-5 font-mono font-black text-blue-600 text-lg">{code.code}</td>
                                <td className="p-5 text-xs font-bold text-gray-700 dark:text-gray-300">{code.courseTitle}</td>
                                <td className="p-5">{code.isUsed ? <span className="text-red-500 text-[10px] font-black bg-red-50 px-3 py-1 rounded-full border border-red-100">تم استخدامه ❌</span> : <span className="text-green-500 text-[10px] font-black bg-green-50 px-3 py-1 rounded-full border border-green-100">متاح للإرسال ✅</span>}</td>
                                <td className="p-5 text-center"><button onClick={() => deleteCode(code.code)} className="text-red-400 hover:text-red-600 transition-colors">✖</button></td>
                             </tr>
                          ))}</tbody>
                    </table>
                 </div>
              </div>
            )}
            {activeTab === 'forum' && <Forum user={currentUser} initialGrade={currentUser.grade} locks={config.isForumLocked} onToggleLock={g => setConfig({...config, isForumLocked: {...config.isForumLocked, [g]: !config.isForumLocked[g]}})} onToggleAllLocks={l => setConfig({...config, isForumLocked: {'1SEC':l,'2SEC':l,'3SEC':l}})} onBlockFromForum={id => setAllUsers(allUsers.map(u => u.id === id ? {...u, isBlocked: true} : u))} />}
            {activeTab === 'students' && isAdmin && (
               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-6 sm:p-12 text-right shadow-2xl animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                     <div>
                        <h2 className="text-3xl font-black mb-2 text-blue-900 dark:text-blue-400">قاعدة بيانات الطلاب</h2>
                        <p className="text-gray-400 font-bold text-sm">متابعة دقيقة لمستوى وتقدم جميع الطلاب المشتركين</p>
                     </div>
                     <div className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black shadow-xl shadow-blue-100 dark:shadow-none">إجمالي: {stats.studentCount} طالب</div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-[2.5rem] border dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800">
                          <th className="p-5 font-black text-gray-500 text-sm">بيانات الطالب</th>
                          <th className="p-5 font-black text-gray-500 text-sm">الصف الدراسي</th>
                          <th className="p-5 font-black text-gray-500 text-sm text-center">متوسط التقدم</th>
                          <th className="p-5 font-black text-gray-500 text-sm">المستوى</th>
                          <th className="p-5 font-black text-gray-500 text-sm">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-800">
                        {allUsers.filter(u => u.role === 'STUDENT').map(u => {
                          const avgProg = calculateTotalAverageProgress(u);
                          return (
                            <tr key={u.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all ${u.isBlocked ? 'bg-red-50/30 dark:bg-red-900/10 opacity-70' : ''}`}>
                              <td className="p-5">
                                 <div className="flex items-center gap-3">
                                    <img src={u.profilePicture || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                    <div>
                                       <div className="font-black text-sm text-gray-800 dark:text-white">{u.fullName}</div>
                                       <div className="text-[9px] text-gray-400 font-bold">كود: {u.studentCode} | دخول: {u.loginCount}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-5 text-xs font-black text-blue-600">{GRADE_LABELS[u.grade]}</td>
                              <td className="p-5">
                                 <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                    <div className="text-[10px] font-black text-gray-700 dark:text-gray-300">{avgProg}%</div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                       <div className={`h-full ${avgProg > 80 ? 'bg-green-500' : avgProg > 40 ? 'bg-blue-500' : 'bg-red-400'}`} style={{width:`${avgProg}%`}}></div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-5">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black ${u.level === 'EXCELLENT' ? 'bg-green-100 text-green-700' : u.level === 'AVERAGE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                    {LEVEL_LABELS[u.level]}
                                 </span>
                              </td>
                              <td className="p-5">
                                 <button 
                                   onClick={() => setSelectedStudentId(u.id)} 
                                   className="bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-xl font-black text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                 >
                                    فحص التقدم 🔍
                                 </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}
            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn text-right">
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[4rem] shadow-2xl text-center border dark:border-slate-800">
                   <div className="w-36 h-36 rounded-full border-8 border-blue-50 dark:border-slate-800 shadow-xl overflow-hidden mx-auto mb-8 relative group">
                      {currentUser.profilePicture ? <img src={currentUser.profilePicture} className="w-full h-full object-cover" /> : <div className="text-8xl mt-4">👤</div>}
                   </div>
                   <h2 className="text-4xl font-black mb-2 dark:text-white">{currentUser.fullName}</h2>
                   <p className="text-blue-600 font-black mb-4">{GRADE_LABELS[currentUser.grade]}</p>
                   <div className="inline-block bg-blue-50 dark:bg-blue-900/30 px-6 py-2 rounded-full text-xs font-black text-blue-700 dark:text-blue-300 shadow-sm">كود الطالب: {currentUser.studentCode}</div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right mt-12">
                      <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm"><p className="text-[10px] text-gray-400 font-black mb-1 text-right">البريد الإلكتروني:</p><p className="font-black text-sm">{currentUser.email}</p></div>
                      <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm"><p className="text-[10px] text-gray-400 font-black mb-1 text-right">رقم الموبايل:</p><p className="font-black text-sm">{currentUser.phone}</p></div>
                   </div>
                   
                   <div className="mt-16 space-y-6">
                      <h3 className="text-2xl font-black text-blue-900 dark:text-blue-400 border-r-8 border-blue-600 pr-4">أوسمة وشهادات التقدير 🏆</h3>
                      {(!currentUser.certificates || currentUser.certificates.length === 0) ? (
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-12 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400 font-black italic">اجتهد أكثر لتظهر شهاداتك هنا.. نحن نراقب تقدمك! 💪</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {currentUser.certificates.map(cert => (
                             <div key={cert.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border dark:border-slate-700 flex flex-col items-center gap-4 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setViewedCert({cert, studentName: currentUser.fullName})}>
                                <div className="text-5xl group-hover:rotate-12 transition-transform">🎖️</div>
                                <div className="text-center">
                                   <p className="font-black text-blue-900 dark:text-blue-400">{cert.title}</p>
                                   <p className="text-[10px] text-gray-400 font-bold">{cert.date}</p>
                                </div>
                                <button 
                                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all"
                                >
                                  عرض وتحميل الشهادة 📥
                                </button>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <button onClick={() => { setRecoveredUser(currentUser); setView('UPDATE_PROFILE'); }} className="mt-12 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-10 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all border dark:border-slate-700 shadow-md">تعديل بيانات الحساب ✍️</button>
                </div>
              </div>
            )}
            {activeTab === 'settings' && isAdmin && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-right animate-fadeIn border dark:border-slate-800">
                 <h2 className="text-3xl font-black mb-10 text-blue-900 dark:text-blue-400">إدارة المنصة والبيانات الشخصية 🎨</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3">بيانات المشرف (الدخول)</h3>
                       <div className="space-y-4">
                          <label className="text-xs font-black text-gray-400 block">بريد الدخول الجديد:</label>
                          <input value={config.adminEmail} onChange={e => setConfig({...config, adminEmail: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          <label className="text-xs font-black text-gray-400 block">كلمة المرور الجديدة:</label>
                          <input type="text" value={config.adminPassword} onChange={e => setConfig({...config, adminPassword: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          <div className="h-[1px] bg-gray-100 dark:bg-slate-700 my-4"></div>
                          <label className="text-xs font-black text-gray-400 block">اسم المعلم:</label>
                          <input value={config.teacherName} onChange={e => setConfig({...config, teacherName: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          <label className="text-xs font-black text-gray-400 block">نبذة المعلم:</label>
                          <textarea value={config.teacherBio} onChange={e => setConfig({...config, teacherBio: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-800 font-bold h-32 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>

                       <div className="pt-6 border-t dark:border-slate-800 space-y-6">
                          <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3">إدارة الإعلانات والتنبيهات 📢</h3>
                          <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                             <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black text-gray-400">تفعيل الإعلان الموجه:</label>
                                <button 
                                  onClick={() => setConfig({...config, isAnnouncementActive: !config.isAnnouncementActive})}
                                  className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${config.isAnnouncementActive ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}
                                >
                                  {config.isAnnouncementActive ? 'مـفـعـل ✅' : 'مـعـطـل ❌'}
                                </button>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">نص الإعلان (تهنئة، تنبيه، عروض):</label>
                                <textarea value={config.announcementText} onChange={e => setConfig({...config, announcementText: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold dark:text-white h-24 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="اكتب هنا الإعلان الموجه للطلاب..." />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">الجمهور المستهدف بالإعلان:</label>
                                <select value={config.announcementTarget} onChange={e => setConfig({...config, announcementTarget: e.target.value as Grade | 'ALL'})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                                   <option value="ALL">كل الطلاب بالمنصة</option>
                                   <option value="1SEC">طلاب الصف الأول الثانوي فقط</option>
                                   <option value="2SEC">طلاب الصف الثاني الثانوي فقط</option>
                                   <option value="3SEC">طلاب الصف الثالث الثانوي فقط</option>
                                </select>
                             </div>
                          </div>
                       </div>

                       <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3 mt-6">إدارة الخطط الدراسية (الترم) 📋</h3>
                       <div className="space-y-4 bg-orange-50 dark:bg-orange-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30">
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">خطة الصف الأول الثانوي:</label>
                             <textarea value={config.termPlans['1SEC']} onChange={e => setConfig({...config, termPlans: {...config.termPlans, '1SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold dark:text-white h-24 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="اكتب خطة الترم هنا..." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">خطة الصف الثاني الثانوي:</label>
                             <textarea value={config.termPlans['2SEC']} onChange={e => setConfig({...config, termPlans: {...config.termPlans, '2SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold dark:text-white h-24 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="اكتب خطة الترم هنا..." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">خطة الصف الثالث الثانوي:</label>
                             <textarea value={config.termPlans['3SEC']} onChange={e => setConfig({...config, termPlans: {...config.termPlans, '3SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold dark:text-white h-24 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="اكتب خطة الترم هنا..." />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3">أرقام التواصل والدفع 📞</h3>
                       <div className="space-y-4 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">رقم استقبال الدفع (فودافون كاش):</label>
                                <input value={config.paymentNumber} onChange={e => setConfig({...config, paymentNumber: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">رقم واتساب المستر:</label>
                                <input value={config.whatsapp} onChange={e => setConfig({...config, whatsapp: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">رقم واتساب الدعم الفني:</label>
                                <input value={config.teamWhatsapp} onChange={e => setConfig({...config, teamWhatsapp: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 block">رقم اتصال الفريق:</label>
                                <input value={config.teamPhone} onChange={e => setConfig({...config, teamPhone: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                       </div>

                       <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3 mt-6">روابط منصات التواصل 🌐</h3>
                       <div className="space-y-4 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/30">
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط فيسبوك:</label>
                             <input value={config.facebook} onChange={e => setConfig({...config, facebook: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط يوتيوب:</label>
                             <input value={config.youtube} onChange={e => setConfig({...config, youtube: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط تليجرام العام:</label>
                             <input value={config.telegramGeneral} onChange={e => setConfig({...config, telegramGeneral: e.target.value})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="h-[1px] bg-purple-200 dark:bg-purple-800 my-2"></div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط تليجرام الصف الأول الثانوي:</label>
                             <input value={config.telegramGrades['1SEC']} onChange={e => setConfig({...config, telegramGrades: {...config.telegramGrades, '1SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط تليجرام الصف الثاني الثانوي:</label>
                             <input value={config.telegramGrades['2SEC']} onChange={e => setConfig({...config, telegramGrades: {...config.telegramGrades, '2SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 block">رابط تليجرام الصف الثالث الثانوي:</label>
                             <input value={config.telegramGrades['3SEC']} onChange={e => setConfig({...config, telegramGrades: {...config.telegramGrades, '3SEC': e.target.value}})} className="w-full p-4 border dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                       </div>

                       <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-3 mt-6">تغيير صور المنصة</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div onClick={() => logoInputRef.current?.click()} className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             <img src={config.logo} className="w-16 h-16 object-cover rounded-full mb-2 shadow-md" />
                             <span className="text-[10px] font-black text-gray-400">تغيير اللوجو</span>
                             <input type="file" ref={logoInputRef} onChange={e => handleImageUpload(e, 'logo')} className="hidden" accept="image/*" />
                          </div>
                          <div onClick={() => heroInputRef.current?.click()} className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             <img src={config.landingHeroImage} className="w-full h-12 object-cover rounded-xl mb-2" />
                             <span className="text-[10px] font-black text-gray-400">خلفية الهيرو</span>
                             <input type="file" ref={heroInputRef} onChange={e => handleImageUpload(e, 'hero')} className="hidden" accept="image/*" />
                          </div>
                          <div onClick={() => loginBgInputRef.current?.click()} className="col-span-2 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             <img src={config.loginBackground} className="w-full h-8 object-cover rounded-xl mb-1" />
                             <span className="text-[10px] font-black text-gray-400">خلفية تسجيل الدخول</span>
                             <input type="file" ref={loginBgInputRef} onChange={e => handleImageUpload(e, 'loginBg')} className="hidden" accept="image/*" />
                          </div>
                          <div onClick={() => appBgInputRef.current?.click()} className="col-span-2 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             {config.appBackground ? <img src={config.appBackground} className="w-full h-8 object-cover rounded-xl mb-1" /> : <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full mb-1"></div>}
                             <span className="text-[10px] font-black text-gray-400">خلفية المنصة الرئيسية</span>
                             <input type="file" ref={appBgInputRef} onChange={e => handleImageUpload(e, 'appBg')} className="hidden" accept="image/*" />
                          </div>
                          <div onClick={() => dashboardBgInputRef.current?.click()} className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             {config.dashboardBackground ? <img src={config.dashboardBackground} className="w-full h-8 object-cover rounded-xl mb-1" /> : <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full mb-1"></div>}
                             <span className="text-[10px] font-black text-gray-400">خلفية الداشبورد</span>
                             <input type="file" ref={dashboardBgInputRef} onChange={e => handleImageUpload(e, 'dashboardBg')} className="hidden" accept="image/*" />
                          </div>
                          <div onClick={() => coursesBgInputRef.current?.click()} className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all overflow-hidden p-2">
                             {config.coursesBackground ? <img src={config.coursesBackground} className="w-full h-8 object-cover rounded-xl mb-1" /> : <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full mb-1"></div>}
                             <span className="text-[10px] font-black text-gray-400">خلفية الكورسات</span>
                             <input type="file" ref={coursesBgInputRef} onChange={e => handleImageUpload(e, 'coursesBg')} className="hidden" accept="image/*" />
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="mt-12 bg-blue-600 text-white p-8 rounded-[2.5rem] text-center font-black shadow-2xl border-b-8 border-blue-800">تم تفعيل نظام التشفير والحفظ السحابي التلقائي 🛡️</div>
              </div>
            )}
          </>
        )}
      </Layout>
    </>
  );
};

export default App;
