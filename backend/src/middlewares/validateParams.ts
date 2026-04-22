import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateParams =
  <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid route parameters",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    for (const key of Object.keys(req.params)) {
      delete req.params[key];
    }

    Object.assign(req.params, parsed.data as Request["params"]);
    next();
  };
