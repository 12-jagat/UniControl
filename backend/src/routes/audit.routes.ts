import { Router } from "express";
import * as auditController from "../controllers/audit.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { Role } from "../types";
const router = Router();
router.use(authenticate, requireRole(Role.SUPER_ADMIN, Role.ADMIN));
router.get("/", auditController.getAuditLogs);
export default router;
