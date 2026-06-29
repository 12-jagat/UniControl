import { Request, Response, NextFunction } from "express";
import * as attendanceService from "../services/attendance.service";

export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await attendanceService.markAttendance(req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await attendanceService.getAttendanceByEnrollment(req.params.enrollmentId, req.query.startDate as string, req.query.endDate as string); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await attendanceService.getAttendanceSummary(req.params.enrollmentId); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const bulkMark = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await attendanceService.bulkMarkAttendance(req.body.records); res.json({ success: true, data }); } catch (e) { next(e); }
};
