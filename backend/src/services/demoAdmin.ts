import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User } from "../models/User";

export const ensureDemoAdmin = async (): Promise<void> => {
  if (!env.ENABLE_DEMO_ADMIN) {
    return;
  }

  const email = env.DEMO_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(env.DEMO_ADMIN_PASSWORD, 12);
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    await User.create({
      email,
      passwordHash,
      role: "admin"
    });
    console.log(`Demo admin ready: ${email}`);
    return;
  }

  let hasChanges = false;

  if (existingUser.role !== "admin") {
    existingUser.role = "admin";
    hasChanges = true;
  }

  const passwordMatches = await bcrypt.compare(env.DEMO_ADMIN_PASSWORD, existingUser.passwordHash);
  if (!passwordMatches) {
    existingUser.passwordHash = passwordHash;
    hasChanges = true;
  }

  if (hasChanges) {
    existingUser.refreshTokenHash = undefined;
    await existingUser.save();
    console.log(`Demo admin refreshed: ${email}`);
  }
};
