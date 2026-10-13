import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Dev-only query logging (SQL + duration) for performance work.
// NEVER leave on in production: the SQL args carry user data and
// per-query logging is noisy. Gate: PRISMA_LOG_QUERIES=1.
const queryLog: Prisma.LogDefinition[] = [{ level: "query", emit: "event" }];

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: process.env.PRISMA_LOG_QUERIES ? queryLog : [],
});

// Event-based logging (not emit:"stdout") because stdout query events
// in Prisma 7 carry no duration — $on("query") does (e.duration), which
// is the whole point when hunting slow queries.
if (process.env.PRISMA_LOG_QUERIES) {
  prisma.$on("query", (event) => {
    console.log(`prisma:query ${event.duration.toFixed(1)}ms ${event.query}`);
  });
}

export default prisma;