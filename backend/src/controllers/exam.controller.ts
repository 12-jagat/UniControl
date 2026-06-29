import { Request, Response, NextFunction } from "express";
import * as examService from "../services/exam.service";

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await examService.getExams(req.query.courseId as string); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await examService.createExam({ ...req.body, date: new Date(req.body.date) }); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const publishResult = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await examService.publishResult(req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getResultsByStudent = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await examService.getResultsByStudent(req.params.studentId); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getResultsByExam = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await examService.getResultsByExam(req.params.examId); res.json({ success: true, data }); } catch (e) { next(e); }
};
