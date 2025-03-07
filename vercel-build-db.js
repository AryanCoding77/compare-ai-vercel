import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log("Running database migrations...");
    await execAsync("npm run db:push");
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();
