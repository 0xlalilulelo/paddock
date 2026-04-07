import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization — avoids throwing at import time during Next.js build
// (page data collection imports route modules but DATABASE_URL may not be set)
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!_db) {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is required");
      }
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle(sql, { schema });
    }
    return Reflect.get(_db, prop, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
