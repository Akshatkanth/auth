import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(typeof err.details !== "undefined" ? { details: err.details } : {})
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: "Internal server error",
    ...(env.NODE_ENV === "development" ? { error: err.message } : {})
  });
};
