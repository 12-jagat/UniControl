import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { QueryParams } from "../types";

export const getNotices = async (params: QueryParams & { role?: string; userId?: string }) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const now = new Date();

  const andConditions: any[] = [
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
  ];

  if (params.role && params.role !== "SUPER_ADMIN" && params.role !== "ADMIN") {
    andConditions.push({
      OR: [
        { targetRole: null, targetUserId: null },
        { targetRole: params.role as any, targetUserId: null },
        { targetUserId: params.userId }
      ]
    });
  }

  const where: any = { AND: andConditions };

  if (params.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({ where, skip, take: limit, include: { author: { select: { name:true, role:true } } }, orderBy: { createdAt: "desc" } }),
    prisma.notice.count({ where }),
  ]);
  return { notices, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const createNotice = async (data: { title: string; content: string; authorId: string; targetRole?: string; expiresAt?: Date }) => {
  return prisma.notice.create({ data: { ...data, targetRole: data.targetRole as never } });
};

export const updateNotice = async (id: string, data: { title?: string; content?: string; expiresAt?: Date }) => {
  const n = await prisma.notice.findUnique({ where: { id } });
  if (!n) throw new AppError("Notice not found", 404);
  return prisma.notice.update({ where: { id }, data });
};

export const deleteNotice = async (id: string) => {
  const n = await prisma.notice.findUnique({ where: { id } });
  if (!n) throw new AppError("Notice not found", 404);
  await prisma.notice.delete({ where: { id } });
};
