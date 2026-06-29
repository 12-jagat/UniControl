import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as feeService from "../services/fee.service";

export const getFees = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await feeService.getFees(req.query as never); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const createFee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await feeService.createFee({ ...req.body, dueDate: new Date(req.body.dueDate), adminId: req.user!.id }); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const markPaid = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await feeService.markFeePaid(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getStudentFees = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await feeService.getFeeSummaryByStudent(req.params.studentId); res.json({ success: true, data }); } catch (e) { next(e); }
};
