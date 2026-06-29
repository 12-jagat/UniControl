import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as userService from "../services/user.service";

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await userService.getUsers(req.query as never); res.json({ success: true, ...data }); } catch (e) { next(e); }
};
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await userService.getUserById(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await userService.updateUser(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await userService.getUserById(req.user!.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const data = await userService.toggleUserStatus(req.params.id); res.json({ success: true, data }); } catch (e) { next(e); }
};
