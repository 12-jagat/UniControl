import { Request, Response, NextFunction } from "express";
import * as courseService from "../services/course.service";

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await courseService.getCourses(req.query as never); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await courseService.getCourseById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await courseService.createCourse(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await courseService.updateCourse(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try { await courseService.deleteCourse(req.params.id); res.json({ success: true, message: "Course deleted" }); } catch (e) { next(e); }
};
export const enrollStudent = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await courseService.enrollStudent(req.body.studentId, req.params.id, req.body.semester); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
