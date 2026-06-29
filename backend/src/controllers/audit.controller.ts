import { Request, Response, NextFunction } from "express";
import * as analyticsService from "../services/analytics.service";

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await analyticsService.getAuditLog(page, limit);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};
