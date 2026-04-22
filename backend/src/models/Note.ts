import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface INote {
  title: string;
  content: string;
  owner: Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

noteSchema.index({ owner: 1, createdAt: -1 });

export type NoteDocument = HydratedDocument<INote>;

export const Note = model<INote>("Note", noteSchema);
