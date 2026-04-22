import { Schema, model, type HydratedDocument } from "mongoose";

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface IUser {
  email: string;
  passwordHash: string;
  role: Role;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ROLES,
      default: "user"
    },
    refreshTokenHash: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
);

export type UserDocument = HydratedDocument<IUser>;

export const User = model<IUser>("User", userSchema);
