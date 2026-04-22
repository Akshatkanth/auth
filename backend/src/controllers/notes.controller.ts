import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Note } from "../models/Note";
import { ApiError } from "../utils/ApiError";

const ensureObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, "Invalid note id");
  }

  return new Types.ObjectId(value);
};

const getParamValue = (value: string | string[] | undefined, fieldName: string): string => {
  if (typeof value === "string") {
    return value;
  }

  throw new ApiError(400, `Invalid ${fieldName}`);
};

const canAccessNote = (requestingUserId: string, noteOwnerId: string, role: string): boolean => {
  return role === "admin" || requestingUserId === noteOwnerId;
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { title, content, isArchived } = req.body as {
    title: string;
    content: string;
    isArchived?: boolean;
  };

  const note = await Note.create({
    title,
    content,
    owner: user.userId,
    isArchived: isArchived ?? false
  });

  res.status(201).json({
    message: "Note created",
    note
  });
};

export const listNotes = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const ownerFilter = req.query.ownerId as string | undefined;
  const isArchivedFilter = req.query.isArchived as string | undefined;

  const query: Record<string, unknown> = {};

  if (user.role !== "admin") {
    query.owner = user.userId;
  } else if (ownerFilter) {
    query.owner = ownerFilter;
  }

  if (isArchivedFilter === "true" || isArchivedFilter === "false") {
    query.isArchived = isArchivedFilter === "true";
  }

  const notes = await Note.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    count: notes.length,
    notes
  });
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const noteId = ensureObjectId(getParamValue(req.params.noteId, "noteId"));
  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (!canAccessNote(user.userId, note.owner.toString(), user.role)) {
    throw new ApiError(403, "Forbidden");
  }

  res.status(200).json({ note });
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const noteId = ensureObjectId(getParamValue(req.params.noteId, "noteId"));
  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (!canAccessNote(user.userId, note.owner.toString(), user.role)) {
    throw new ApiError(403, "Forbidden");
  }

  const { title, content, isArchived } = req.body as {
    title?: string;
    content?: string;
    isArchived?: boolean;
  };

  if (typeof title !== "undefined") {
    note.title = title;
  }

  if (typeof content !== "undefined") {
    note.content = content;
  }

  if (typeof isArchived !== "undefined") {
    note.isArchived = isArchived;
  }

  await note.save();

  res.status(200).json({
    message: "Note updated",
    note
  });
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const noteId = ensureObjectId(getParamValue(req.params.noteId, "noteId"));
  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  if (!canAccessNote(user.userId, note.owner.toString(), user.role)) {
    throw new ApiError(403, "Forbidden");
  }

  await note.deleteOne();

  res.status(200).json({
    message: "Note deleted"
  });
};
