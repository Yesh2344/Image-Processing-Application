import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  images: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    format: v.string(),
    userId: v.optional(v.id("users")),  // Make userId optional to support both auth and non-auth cases
  }),
});
