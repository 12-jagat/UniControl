import { Request, Response, NextFunction } from "express";
import * as analyticsService from "../services/analytics.service";

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try { const data = await analyticsService.getDashboardStats(); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getEnrollmentTrend = async (_req: Request, res: Response, next: NextFunction) => {
  try { const data = await analyticsService.getEnrollmentTrend(); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getAttendanceOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try { const data = await analyticsService.getAttendanceOverview(); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getFeeCollection = async (_req: Request, res: Response, next: NextFunction) => {
  try { const data = await analyticsService.getFeeCollection(); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getTopCourses = async (_req: Request, res: Response, next: NextFunction) => {
  try { const data = await analyticsService.getTopCoursesByEnrollment(); res.json({ success: true, data }); } catch (e) { next(e); }
};
