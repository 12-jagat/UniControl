import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as studentService from "../services/student.service";

export const getStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await studentService.getStudents(req.query as never); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const getStudentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await studentService.getStudentById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await studentService.createStudent(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const updateStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await studentService.updateStudent(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const deleteStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { await studentService.deleteStudent(req.params.id); res.json({ success: true, message: "Student deleted" }); } catch (e) { next(e); }
};
