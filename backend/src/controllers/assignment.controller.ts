import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as assignmentService from "../services/assignment.service";

export const getAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.getAssignments(req.query.courseId as string); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.createAssignment({ ...req.body, dueDate: new Date(req.body.dueDate) }); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const submitAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.submitAssignment(req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const gradeSubmission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.gradeSubmission(req.params.submissionId, req.body.score, req.body.feedback); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getSubmissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.getSubmissions(req.params.assignmentId); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getMySubmission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await assignmentService.getStudentSubmission(req.params.assignmentId, req.user!.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
