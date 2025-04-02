import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });