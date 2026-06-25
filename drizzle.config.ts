import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/backend/Database/schema",
  out: "./resources/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./localData/base.sqlite"
  }
});
