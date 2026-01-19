
export type UserRole = 'STUDENT' | 'ADMIN' | 'TEAM';
export type Grade = '1SEC' | '2SEC' | '3SEC';
export type StudentLevel = 'EXCELLENT' | 'AVERAGE' | 'WEAK';

export interface Certificate {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'EXCELLENCE' | 'PROGRESS' | 'COMPLETION';
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  parentPhone: string;
  studentCode: string;
  governorate: string;
  address: string;
  detailedAddress: string;
  age: string;
  grade: Grade;
  role: UserRole;
  level: StudentLevel;
  isBlocked: boolean;
  loginCount: number;
  completedLectures: string[];
  unlockedCourses: string[];
  certificates: Certificate[];
  progress: number;
  createdAt?: number;
  profilePicture?: string;
}

export interface ActivationCode {
  code: string;
  courseId: string;
  courseTitle: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: number;
}

export interface Lecture {
  id: string;
  title: string;
  type: 'VIDEO' | 'FILE' | 'IMAGE' | 'AUDIO';
  url: string;
  fileName?: string;
  duration?: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  deadline: string;
  durationMinutes: number;
}

export interface ExamQuestion {
  id: string;
  imageUrl: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  grade: Grade;
  isPaid: boolean;
  price?: number;
  lectures: Lecture[];
  exams: Exam[];
  assignments: Assignment[];
  expiryDate?: string;
}

export interface ForumMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  grade: Grade;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  timestamp: number;
}

export interface PlatformConfig {
  logo: string;
  landingHeroImage: string;
  loginBackground: string;
  appBackground?: string;
  dashboardBackground?: string; // خلفية الداشبورد
  coursesBackground?: string;   // خلفية الكورسات
  teacherName: string;
  teacherBio: string;
  adminEmail: string;
  adminPassword: string;
  whatsapp: string;
  teamWhatsapp: string;
  teamPhone: string; 
  facebook: string;
  youtube: string;
  telegramGeneral: string;
  telegramGrades: Record<Grade, string>;
  isForumLocked: Record<Grade, boolean>;
  announcementText: string;
  announcementTarget: Grade | 'ALL';
  isAnnouncementActive: boolean;
  termPlans: Record<Grade, string>;
  paymentNumber: string;
}
