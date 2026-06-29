import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";

export const markAttendance = async (data: { enrollmentId: string; date: string; status: string; remarks?: string }) => {
  return prisma.attendance.upsert({
    where: { enrollmentId_date: { enrollmentId: data.enrollmentId, date: new Date(data.date) } },
    update: { status: data.status as never, remarks: data.remarks },
    create: { enrollmentId: data.enrollmentId, date: new Date(data.date), status: data.status as never, remarks: data.remarks },
  });
};

export const getAttendanceByEnrollment = async (enrollmentId: string, startDate?: string, endDate?: string) => {
  const where: Record<string, unknown> = { enrollmentId };
  if (startDate || endDate) { where.date = { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) }; }
  return prisma.attendance.findMany({ where, orderBy: { date: "desc" } });
};

export const getAttendanceSummary = async (enrollmentId: string) => {
  const records = await prisma.attendance.findMany({ where: { enrollmentId } });
  const total = records.length;
  const present = records.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
  return { total, present, absent: total - present, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : "0" };
};

export const bulkMarkAttendance = async (records: { enrollmentId: string; date: string; status: string }[]) => {
  const results = await Promise.allSettled(records.map(r => markAttendance(r)));
  return results;
};
