import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { QueryParams } from "../types";

export const getStudents = async (params: QueryParams & { departmentId?: string }) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.search) where.user = { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { email: { contains: params.search, mode: "insensitive" } }] };
  const [students, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take: limit, include: { user: { select: { name:true, email:true, avatarUrl:true } }, department: { select: { name:true, code:true } } }, orderBy: { createdAt: "desc" } }),
    prisma.student.count({ where }),
  ]);
  return { students, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getStudentById = async (id: string) => {
  const s = await prisma.student.findUnique({ where: { id }, include: { user: { select: { name:true, email:true, phone:true, avatarUrl:true } }, department: true, enrollments: { include: { course: { select: { id:true, code:true, title:true } } } }, fees: true } });
  if (!s) throw new AppError("Student not found", 404);
  return s;
};

export const createStudent = async (data: { userId: string; studentId: string; enrollmentYear: number; semester: number; departmentId: string }) => {
  const exists = await prisma.student.findUnique({ where: { userId: data.userId } });
  if (exists) throw new AppError("Student profile already exists", 409);
  return prisma.student.create({ data, include: { user: { select: { name:true, email:true } } } });
};

export const updateStudent = async (id: string, data: { semester?: number; departmentId?: string }) => {
  const s = await prisma.student.findUnique({ where: { id } });
  if (!s) throw new AppError("Student not found", 404);
  return prisma.student.update({ where: { id }, data });
};

export const deleteStudent = async (id: string) => {
  const s = await prisma.student.findUnique({ where: { id } });
  if (!s) throw new AppError("Student not found", 404);
  await prisma.student.delete({ where: { id } });
};
