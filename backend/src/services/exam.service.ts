import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";

export const getExams = async (courseId?: string) => {
  const where = courseId ? { courseId } : {};
  return prisma.exam.findMany({ where, include: { course: { select: { code:true, title:true } }, _count: { select: { results: true } } }, orderBy: { date: "asc" } });
};

export const createExam = async (data: { title: string; courseId: string; date: Date; duration: number; maxScore: number; venue?: string }) => {
  return prisma.exam.create({ data });
};

export const publishResult = async (data: { examId: string; studentId: string; score: number; grade?: string; remarks?: string }) => {
  const exam = await prisma.exam.findUnique({ where: { id: data.examId } });
  if (!exam) throw new AppError("Exam not found", 404);
  const grade = data.grade ?? computeGrade(data.score, exam.maxScore);
  return prisma.result.upsert({
    where: { examId_studentId: { examId: data.examId, studentId: data.studentId } },
    update: { score: data.score, grade, remarks: data.remarks },
    create: { examId: data.examId, studentId: data.studentId, score: data.score, grade, remarks: data.remarks },
  });
};

export const getResultsByStudent = async (studentId: string) => {
  return prisma.result.findMany({ where: { studentId }, include: { exam: { include: { course: { select: { code:true, title:true } } } } }, orderBy: { createdAt: "desc" } });
};

export const getResultsByExam = async (examId: string) => {
  return prisma.result.findMany({ where: { examId }, include: { student: { include: { user: { select: { name:true } } } } } });
};

function computeGrade(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}
