import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as facultyService from "../services/faculty.service";

export const getFaculty = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await facultyService.getFaculty(req.query as never); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const getProfessorById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await facultyService.getProfessorById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createProfessor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await facultyService.createProfessor(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const updateProfessor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await facultyService.updateProfessor(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
