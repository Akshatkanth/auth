import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { sanitizeInput } from "./middlewares/sanitizeInput";
import { authRouter } from "./routes/auth.routes";
import { notesRouter } from "./routes/notes.routes";

export const app = express();

app.use(pinoHttp());
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitizeInput);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/notes", notesRouter);

// Backward-compatible aliases.
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);

app.use(notFoundHandler);
app.use(errorHandler);
