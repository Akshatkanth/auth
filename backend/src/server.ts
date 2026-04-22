import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { ensureDemoAdmin } from "./services/demoAdmin";

const startServer = async (): Promise<void> => {
  try {
    await connectDb();
    await ensureDemoAdmin();
    app.listen(env.PORT, () => {
      console.log(`Backend running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
