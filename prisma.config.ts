import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/infrastructure/postgres/prisma/schema.prisma",
  migrations: {
    path: "src/infrastructure/postgres/prisma/migrations",
  },
});
