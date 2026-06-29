import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { AuthUser, Role } from "../types";

const SALT_ROUNDS = 12;

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: Role;
  departmentId?: string;
  semester?: number;
  employeeTitle?: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const userRole = data.role ?? Role.STUDENT;

  // Verify a department exists for profile linkage
  let deptId = data.departmentId;
  if (!deptId) {
    const dept = await prisma.department.findFirst();
    if (!dept) throw new AppError("A department must exist before registering users", 400);
    deptId = dept.id;
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: userRole,
    },
  });

  if (userRole === Role.STUDENT) {
    const lastStudent = await prisma.student.findFirst({ orderBy: { studentId: "desc" } });
    const nextNum = lastStudent ? Number(lastStudent.studentId.replace("STU", "")) + 1 : 100;
    await prisma.student.create({
      data: {
        studentId: `STU${nextNum}`,
        enrollmentYear: new Date().getFullYear(),
        userId: user.id,
        departmentId: deptId,
        semester: data.semester ?? 1,
      },
    });
  } else if (userRole === Role.PROFESSOR) {
    const lastProf = await prisma.professor.findFirst({ orderBy: { employeeId: "desc" } });
    const nextNum = lastProf ? Number(lastProf.employeeId.replace("EMP", "")) + 1 : 100;
    await prisma.professor.create({
      data: {
        employeeId: `EMP${nextNum}`,
        userId: user.id,
        joiningDate: new Date(),
        departmentId: deptId,
        title: data.employeeTitle ?? "Professor",
      },
    });
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError("Invalid credentials", 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError("Invalid credentials", 401);

  const payload: AuthUser = { id: user.id, email: user.email, role: user.role as Role, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as any });

  const student = user.role === "STUDENT" ? await prisma.student.findUnique({ where: { userId: user.id }, include: { department: true } }) : null;
  const professor = user.role === "PROFESSOR" ? await prisma.professor.findUnique({ where: { userId: user.id }, include: { department: true } }) : null;

  return {
    token,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl, student, professor },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) throw new AppError("Invalid refresh token", 401);

    const payload: AuthUser = { id: user.id, email: user.email, role: user.role as Role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any });
    return { token };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};
