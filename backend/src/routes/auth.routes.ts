import { Router } from "express";
import { z } from "zod";
import {
  adminOnly,
  login,
  logout,
  me,
  refresh,
  register
} from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validateBody";

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^a-zA-Z0-9]/, "Password must include a special character")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.get("/admin", requireAuth, requireRole("admin"), adminOnly);
