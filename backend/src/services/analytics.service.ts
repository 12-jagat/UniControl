import { prisma } from "../config/db";

export const getDashboardStats = async () => {
  const [studentCount, professorCount, courseCount, departmentCount, pendingFees, recentNotices] = await Promise.all([
    prisma.student.count(),
    prisma.professor.count(),
    prisma.course.count(),
    prisma.department.count(),
    prisma.fee.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.notice.count({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
  ]);
  return { studentCount, professorCount, courseCount, departmentCount, pendingFees: pendingFees._sum.amount ?? 0, activeNotices: recentNotices };
};

export const getEnrollmentTrend = async () => {
  const enrollments = await prisma.enrollment.groupBy({ by: ["semester"], _count: { id: true }, orderBy: { semester: "asc" } });
  return enrollments.map(e => ({ semester: e.semester, count: e._count.id }));
};

export const getAttendanceOverview = async () => {
  const stats = await prisma.attendance.groupBy({ by: ["status"], _count: { id: true } });
  return stats.map(s => ({ status: s.status, count: s._count.id }));
};

export const getFeeCollection = async () => {
  const stats = await prisma.fee.groupBy({ by: ["status"], _sum: { amount: true }, _count: { id: true } });
  return stats.map(s => ({ status: s.status, total: s._sum.amount ?? 0, count: s._count.id }));
};

export const getTopCoursesByEnrollment = async () => {
  const courses = await prisma.course.findMany({
    take: 10,
    include: { _count: { select: { enrollments: true } }, department: { select: { name: true } } },
    orderBy: { enrollments: { _count: "desc" } },
  });
  return courses.map(c => ({ id: c.id, code: c.code, title: c.title, department: c.department.name, enrollments: c._count.enrollments }));
};

export const getAuditLog = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ skip, take: limit, include: { user: { select: { name:true, email:true, role:true } } }, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.count(),
  ]);
  return { logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const createAuditLog = async (data: { action: string; entity: string; entityId?: string; userId: string; details?: unknown; ipAddress?: string }) => {
  return prisma.auditLog.create({ data: { ...data, details: data.details as never } });
};
