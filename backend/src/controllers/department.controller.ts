import { Request, Response, NextFunction } from "express";
import * as deptService from "../services/department.service";

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await deptService.getDepartments(req.query.search as string); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await deptService.getDepartmentById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await deptService.createDepartment(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await deptService.updateDepartment(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try { await deptService.deleteDepartment(req.params.id); res.json({ success: true, message: "Department deleted" }); } catch (e) { next(e); }
};
