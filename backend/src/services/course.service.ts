import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { QueryParams } from "../types";

export const getCourses = async (params: QueryParams & { departmentId?: string }) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.search) where.OR = [{ title: { contains: params.search, mode: "insensitive" } }, { code: { contains: params.search, mode: "insensitive" } }];
  const [courses, total] = await Promise.all([
    prisma.course.findMany({ where, skip, take: limit, include: { department: { select: { name:true } }, professor: { include: { user: { select: { name:true } } } }, _count: { select: { enrollments: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.course.count({ where }),
  ]);
  return { courses, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getCourseById = async (id: string) => {
  const c = await prisma.course.findUnique({ where: { id }, include: { department: true, professor: { include: { user: true } }, enrollments: { include: { student: { include: { user: { select: { name:true, email:true } } } } } }, assignments: true, exams: true } });
  if (!c) throw new AppError("Course not found", 404);
  return c;
};

export const createCourse = async (data: { code: string; title: string; description?: string; creditHours: number; maxStudents: number; departmentId: string; professorId?: string }) => {
  const exists = await prisma.course.findUnique({ where: { code: data.code } });
  if (exists) throw new AppError("Course code already exists", 409);
  return prisma.course.create({ data, include: { department: true } });
};

export const updateCourse = async (id: string, data: Partial<{ title: string; description: string; creditHours: number; maxStudents: number; professorId: string }>) => {
  const c = await prisma.course.findUnique({ where: { id } });
  if (!c) throw new AppError("Course not found", 404);
  return prisma.course.update({ where: { id }, data });
};

export const deleteCourse = async (id: string) => {
  const c = await prisma.course.findUnique({ where: { id } });
  if (!c) throw new AppError("Course not found", 404);
  await prisma.course.delete({ where: { id } });
};

export const enrollStudent = async (studentId: string, courseId: string, semester: string) => {
  const existing = await prisma.enrollment.findUnique({ where: { studentId_courseId_semester: { studentId, courseId, semester } } });
  if (existing) throw new AppError("Student already enrolled in this course", 409);
  return prisma.enrollment.create({ data: { studentId, courseId, semester } });
};
