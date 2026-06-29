import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

// Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import studentRoutes from "./routes/student.routes";
import facultyRoutes from "./routes/faculty.routes";
import departmentRoutes from "./routes/department.routes";
import courseRoutes from "./routes/course.routes";
import attendanceRoutes from "./routes/attendance.routes";
import assignmentRoutes from "./routes/assignment.routes";
import examRoutes from "./routes/exam.routes";
import feeRoutes from "./routes/fee.routes";
import noticeRoutes from "./routes/notice.routes";
import analyticsRoutes from "./routes/analytics.routes";
import auditRoutes from "./routes/audit.routes";
import uploadRoutes from "./routes/upload.routes";
import path from "path";

import { errorHandler } from "./middleware/error.middleware";

const app: Application = express();

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:3000",
      ].filter(Boolean) as string[];

      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow any Vercel deployment URL for this project
      if (
        allowedOrigins.some(o => origin.startsWith(o)) ||
        /https:\/\/uni-control[^.]*\.vercel\.app/.test(origin) ||
        /https:\/\/unicontrol[^.]*\.vercel\.app/.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Routes ─────────────────────────────────────────────────────────────────
const API = "/api/v1";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/faculty`, facultyRoutes);
app.use(`${API}/departments`, departmentRoutes);
app.use(`${API}/courses`, courseRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/assignments`, assignmentRoutes);
app.use(`${API}/exams`, examRoutes);
app.use(`${API}/fees`, feeRoutes);
app.use(`${API}/notices`, noticeRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/audit`, auditRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ─── Welcome / Root Route ────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "UniControl API is running", version: "1.0.0", docs: "/api/health" });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
