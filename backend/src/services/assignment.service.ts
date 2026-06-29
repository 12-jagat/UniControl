import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";

export const getAssignments = async (courseId?: string) => {
  const where = courseId ? { courseId } : {};
  return prisma.assignment.findMany({ where, include: { course: { select: { code:true, title:true } }, _count: { select: { submissions: true } } }, orderBy: { dueDate: "asc" } });
};

export const createAssignment = async (data: { title: string; description?: string; courseId: string; maxScore: number; dueDate: Date }) => {
  return prisma.assignment.create({ data });
};

export const submitAssignment = async (data: { assignmentId: string; studentId: string; fileUrl?: string; content?: string }) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: data.assignmentId } });
  if (!assignment) throw new AppError("Assignment not found", 404);
  const isLate = new Date() > assignment.dueDate;
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: data.assignmentId, studentId: data.studentId } },
    update: { fileUrl: data.fileUrl, content: data.content, status: isLate ? "LATE" : "SUBMITTED", submittedAt: new Date() },
    create: { assignmentId: data.assignmentId, studentId: data.studentId, fileUrl: data.fileUrl, content: data.content, status: isLate ? "LATE" : "SUBMITTED" },
  });
};

export const gradeSubmission = async (submissionId: string, score: number, feedback?: string) => {
  const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!sub) throw new AppError("Submission not found", 404);
  return prisma.submission.update({ where: { id: submissionId }, data: { score, feedback, status: "GRADED" } });
};

export const getSubmissions = async (assignmentId: string) => {
  return prisma.submission.findMany({ where: { assignmentId }, include: { student: { include: { user: { select: { name:true, email:true } } } } } });
};

export const getStudentSubmission = async (assignmentId: string, userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw new AppError("Student profile not found", 404);
  return prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } }
  });
};
