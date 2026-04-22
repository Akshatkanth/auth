import { Router } from "express";
import { z } from "zod";
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote
} from "../controllers/notes.controller";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validateBody } from "../middlewares/validateBody";
import { validateParams } from "../middlewares/validateParams";

const createNoteSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(5000),
  isArchived: z.boolean().optional()
});

const updateNoteSchema = z
  .object({
    title: z.string().min(1).max(150).optional(),
    content: z.string().min(1).max(5000).optional(),
    isArchived: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update"
  });

const noteIdParamSchema = z.object({
  noteId: z.string().min(1)
});

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.post("/", validateBody(createNoteSchema), asyncHandler(createNote));
notesRouter.get("/", asyncHandler(listNotes));
notesRouter.get("/:noteId", validateParams(noteIdParamSchema), asyncHandler(getNoteById));
notesRouter.patch(
  "/:noteId",
  validateParams(noteIdParamSchema),
  validateBody(updateNoteSchema),
  asyncHandler(updateNote)
);
notesRouter.delete(
  "/:noteId",
  validateParams(noteIdParamSchema),
  asyncHandler(deleteNote)
);
