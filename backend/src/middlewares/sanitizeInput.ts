import type { NextFunction, Request, Response } from "express";

const sanitizeString = (value: string): string => {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const mutateObject = (target: unknown, sanitizedValue: unknown): void => {
  if (!isRecord(target) || !isRecord(sanitizedValue)) {
    return;
  }

  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, sanitizedValue);
};

const sanitizeValue = (value: unknown, parentKey = ""): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, parentKey));
  }

  if (isRecord(value)) {
    const objectValue = value;
    const sanitizedEntries = Object.entries(objectValue)
      .filter(([key]) => !key.startsWith("$") && !key.includes("."))
      .map(([key, objectEntryValue]) => [key, sanitizeValue(objectEntryValue, key)]);

    return Object.fromEntries(sanitizedEntries);
  }

  if (typeof value === "string") {
    if (parentKey.toLowerCase().includes("password")) {
      return value;
    }

    return sanitizeString(value);
  }

  return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  req.body = sanitizeValue(req.body) as Record<string, unknown>;
  mutateObject(req.query, sanitizeValue(req.query));
  mutateObject(req.params, sanitizeValue(req.params));
  next();
};
