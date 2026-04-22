import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateBody =
  <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid request payload",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
