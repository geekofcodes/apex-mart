import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import logger from "../utils/logger.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: [
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" },
  ],
});

prisma.$on("error", (e) => {
  logger.error("Prisma error:", e);
});

prisma.$on("warn", (e) => {
  logger.warn("Prisma warning:", e);
});

export default prisma;
