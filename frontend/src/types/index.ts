export type Role = "SUPER_ADMIN" | "ADMIN" | "PROFESSOR" | "STUDENT";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  student?: Student | null;
  professor?: Professor | null;
}

export interface Student {
  id: string;
  studentId: string;
  enrollmentYear: number;
  semester: number;
  userId: string;
  departmentId: string;
  user: { name: string; email: string; avatarUrl?: string };
  department: { name: string; code: string };
  createdAt: string;
}

export interface Professor {
  id: string;
  employeeId: string;
  title?: string;
  specialization?: string;
  joiningDate: string;
  userId: string;
  departmentId: string;
  user: { name: string; email: string; avatarUrl?: string };
  department: { name: string; code: string };
  courses?: { code: string; title: string }[];
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count?: { students: number; professors: number; courses: number };
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  creditHours: number;
  maxStudents: number;
  departmentId: string;
  professorId?: string;
  department: { name: string };
  professor?: { user: { name: string } };
  _count?: { enrollments: number };
  createdAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  description?: string;
  dueDate: string;
  paidAt?: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "WAIVED";
  semester: string;
  student?: { user: { name: string } };
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRole?: Role;
  expiresAt?: string;
  author: { name: string; role: Role };
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  details?: unknown;
  ipAddress?: string;
  createdAt: string;
  user: { name: string; email: string; role: Role };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface DashboardStats {
  studentCount: number;
  professorCount: number;
  courseCount: number;
  departmentCount: number;
  pendingFees: number;
  activeNotices: number;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  maxScore: number;
  dueDate: string;
  course?: { code: string; title: string };
  _count?: { submissions: number };
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string;
  content?: string;
  score?: number;
  feedback?: string;
  status: "SUBMITTED" | "LATE" | "GRADED";
  submittedAt: string;
  student?: { user: { name: string; email: string } };
}
