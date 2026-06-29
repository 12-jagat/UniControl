import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as noticeService from "../services/notice.service";

export const getNotices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await noticeService.getNotices({ ...req.query as any, role: req.user?.role, userId: req.user?.id }); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const createNotice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await noticeService.createNotice({ ...req.body, authorId: req.user!.id, expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined }); res.status(201).json({ success: true, data }); } catch (e) { next(e); }
};
export const updateNotice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await noticeService.updateNotice(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const deleteNotice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { await noticeService.deleteNotice(req.params.id); res.json({ success: true, message: "Notice deleted" }); } catch (e) { next(e); }
};
