import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { User, type Role } from "../models/User";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/token";
import { env } from "../config/env";

const REFRESH_COOKIE_NAME = "refreshToken";

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "strict"
  });
};

const issueTokens = (userId: string, role: Role) => {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, role: "user" });

  const { accessToken, refreshToken } = issueTokens(user.id, user.role);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    message: "Registration successful",
    accessToken,
    user: { id: user.id, email: user.email, role: user.role }
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const { accessToken, refreshToken } = issueTokens(user.id, user.role);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    message: "Login successful",
    accessToken,
    user: { id: user.id, email: user.email, role: user.role }
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token missing" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user?.refreshTokenHash) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isRefreshTokenValid) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken: rotatedRefreshToken } = issueTokens(user.id, user.role);
    user.refreshTokenHash = await bcrypt.hash(rotatedRefreshToken, 12);
    await user.save();

    setRefreshCookie(res, rotatedRefreshToken);

    res.status(200).json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(payload.userId, { $unset: { refreshTokenHash: 1 } });
    } catch {
      // Ignore token verification errors on logout to preserve idempotency.
    }
  }

  clearRefreshCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findById(userId).select("email role");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
};

export const adminOnly = (_req: Request, res: Response): void => {
  res.status(200).json({ message: "Admin route access granted" });
};
