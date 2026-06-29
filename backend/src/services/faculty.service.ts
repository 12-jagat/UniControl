import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { QueryParams } from "../types";

export const getFaculty = async (params: QueryParams & { departmentId?: string }) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.search) where.user = { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { email: { contains: params.search, mode: "insensitive" } }] };
  const [faculty, total] = await Promise.all([
    prisma.professor.findMany({ where, skip, take: limit, include: { user: { select: { name:true, email:true, avatarUrl:true } }, department: { select: { name:true, code:true } }, courses: { select: { code:true, title:true } } }, orderBy: { createdAt: "desc" } }),
    prisma.professor.count({ where }),
  ]);
  return { faculty, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getProfessorById = async (id: string) => {
  const p = await prisma.professor.findUnique({ where: { id }, include: { user: true, department: true, courses: true } });
  if (!p) throw new AppError("Professor not found", 404);
  return p;
};

export const createProfessor = async (data: { userId: string; employeeId: string; title?: string; specialization?: string; joiningDate: Date; departmentId: string }) => {
  const exists = await prisma.professor.findUnique({ where: { userId: data.userId } });
  if (exists) throw new AppError("Professor profile already exists", 409);
  return prisma.professor.create({ data, include: { user: { select: { name:true, email:true } } } });
};

export const updateProfessor = async (id: string, data: { title?: string; specialization?: string; departmentId?: string }) => {
  const p = await prisma.professor.findUnique({ where: { id } });
  if (!p) throw new AppError("Professor not found", 404);
  return prisma.professor.update({ where: { id }, data });
};
