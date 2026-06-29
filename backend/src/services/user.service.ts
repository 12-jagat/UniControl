import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import cloudinary from "../config/cloudinary";
import { QueryParams } from "../types";

export const getUsers = async (params: QueryParams) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const where = params.search
    ? { OR: [{ name: { contains: params.search, mode: "insensitive" as const } }, { email: { contains: params.search, mode: "insensitive" as const } }] }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: { id:true, name:true, email:true, role:true, avatarUrl:true, isActive:true, createdAt:true }, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { id:true, name:true, email:true, role:true, avatarUrl:true, phone:true, address:true, isActive:true, createdAt:true, student:true, professor:true } });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateUser = async (id: string, data: { name?: string; phone?: string; address?: string }) => {
  const user = await prisma.user.update({ where: { id }, data, select: { id:true, name:true, email:true, role:true, avatarUrl:true, phone:true, address:true } });
  return user;
};

export const uploadAvatar = async (id: string, filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, { folder: "unicontrol/avatars", transformation: [{ width: 400, height: 400, crop: "fill" }] });
  const user = await prisma.user.update({ where: { id }, data: { avatarUrl: result.secure_url }, select: { id:true, avatarUrl:true } });
  return user;
};

export const toggleUserStatus = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);
  return prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: { id:true, isActive:true } });
};
