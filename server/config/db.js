import mongoose from "mongoose";

/**
 * Connect to real MongoDB only. No in-memory or mock databases.
 * Users must persist in MongoDB (Compass / Atlas).
 */
export async function connectDb() {
  const uri =
    process.env.MONGO_URI?.trim() ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "mongodb://127.0.0.1:27017/careerpilot");
  if (!uri) {
    throw new Error("MONGO_URI is required in server/.env (e.g. mongodb://127.0.0.1:27017/careerpilot)");
  }

  mongoose.set("strictQuery", true);
  const maxAttempts = 1;
  const delayMs = Number(process.env.MONGO_CONNECT_DELAY_MS) || 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`[db] mongoose.connect() attempt ${attempt}/${maxAttempts}`);
      console.log(`[db] URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@")}`);
      await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
});
      console.log(
        `[db] MongoDB connected — database: "${mongoose.connection.name}", host: ${mongoose.connection.host}`
      );
      mongoose.connection.on("error", (err) => {
        console.error("[db] MongoDB connection error:", err.message);
      });
      return;
    } catch (err) {
      console.error(`[db] Attempt ${attempt} failed:`, err.message);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw new Error(
    `MongoDB connection failed after ${maxAttempts} attempts.\n` +
      `Start MongoDB: docker compose up -d  OR  install MongoDB Community and run the service.\n` +
      `Compass connection: ${uri}`
  );
}

export function getDbStatus() {
  const conn = mongoose.connection;
  return {
    connected: conn.readyState === 1,
    name: conn.name,
    host: conn.host,
    persistent: conn.readyState === 1 && conn.host !== undefined,
  };
}
