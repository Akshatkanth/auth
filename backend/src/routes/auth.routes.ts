import { Router } from "express";
import { z } from "zod";
import {
  adminOnly,
  deleteUser,
  login,
  listUsers,
  logout,
  me,
  refresh,
  register,
  updateUserRole
} from "../controllers/auth.controller";
import { ROLES } from "../models/User";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validateBody";
import { validateParams } from "../middlewares/validateParams";

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

const userIdParamSchema = z.object({
  userId: z.string().min(1)
});

const updateUserRoleSchema = z.object({
  role: z.enum(ROLES)
});

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.get("/admin", requireAuth, requireRole("admin"), adminOnly);
authRouter.get("/users", requireAuth, requireRole("admin"), listUsers);
authRouter.patch(
  "/users/:userId/role",
  requireAuth,
  requireRole("admin"),
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  updateUserRole
);
authRouter.delete(
  "/users/:userId",
  requireAuth,
  requireRole("admin"),
  validateParams(userIdParamSchema),
  deleteUser
);
