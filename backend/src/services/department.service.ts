import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";

export const getDepartments = async (search?: string) => {
  const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }] } : {};
  return prisma.department.findMany({ where, include: { _count: { select: { students: true, professors: true, courses: true } } }, orderBy: { name: "asc" } });
};

export const getDepartmentById = async (id: string) => {
  const d = await prisma.department.findUnique({ where: { id }, include: { professors: { include: { user: { select: { name:true, email:true } } } }, courses: true, _count: { select: { students: true } } } });
  if (!d) throw new AppError("Department not found", 404);
  return d;
};

export const createDepartment = async (data: { name: string; code: string; description?: string }) => {
  const exists = await prisma.department.findFirst({ where: { OR: [{ name: data.name }, { code: data.code }] } });
  if (exists) throw new AppError("Department name or code already exists", 409);
  return prisma.department.create({ data });
};

export const updateDepartment = async (id: string, data: { name?: string; description?: string }) => {
  const d = await prisma.department.findUnique({ where: { id } });
  if (!d) throw new AppError("Department not found", 404);
  return prisma.department.update({ where: { id }, data });
};

export const deleteDepartment = async (id: string) => {
  const d = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true, professors: true, courses: true }
      }
    }
  });
  if (!d) throw new AppError("Department not found", 404);

  if ((d._count?.students ?? 0) > 0 || (d._count?.professors ?? 0) > 0 || (d._count?.courses ?? 0) > 0) {
    throw new AppError(
      `Cannot delete department "${d.name}" because it has active students, faculty, or courses linked to it. Please reassign or delete them first.`,
      400
    );
  }

  await prisma.department.delete({ where: { id } });
};
