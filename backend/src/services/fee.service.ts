import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { QueryParams } from "../types";

export const getFees = async (params: QueryParams & { studentId?: string; status?: string }) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (params.studentId) where.studentId = params.studentId;
  if (params.status) where.status = params.status;
  const [fees, total] = await Promise.all([
    prisma.fee.findMany({ where, skip, take: limit, include: { student: { include: { user: { select: { name:true } } } } }, orderBy: { dueDate: "asc" } }),
    prisma.fee.count({ where }),
  ]);
  return { fees, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const createFee = async (data: { studentId: string; amount: number; description?: string; dueDate: Date; semester: string; adminId: string }) => {
  const { adminId, ...feeData } = data;
  const fee = await prisma.fee.create({ data: feeData });

  const student = await prisma.student.findUnique({
    where: { id: fee.studentId },
    include: { user: true },
  });

  if (student) {
    await prisma.notice.create({
      data: {
        title: `⚠️ Fee Invoice Generated: ${fee.semester}`,
        content: `A new fee invoice of INR ${fee.amount} has been issued for student "${student.user.name}" (${student.studentId}) for "${fee.description || "Tuition Fees"}". Due Date: ${fee.dueDate.toLocaleDateString("en-IN")}. Please clear this invoice under the Fee portal.`,
        authorId: adminId,
        targetRole: "STUDENT" as never,
        targetUserId: student.userId,
        expiresAt: fee.dueDate,
      },
    });
  }

  return fee;
};

export const markFeePaid = async (id: string) => {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError("Fee record not found", 404);
  return prisma.fee.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
};

export const getFeeSummaryByStudent = async (studentId: string) => {
  const fees = await prisma.fee.findMany({ where: { studentId } });
  const total = fees.reduce((s, f) => s + f.amount, 0);
  const paid = fees.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
  return { total, paid, pending: total - paid, fees };
};
