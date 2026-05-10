import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const scenarios = pgTable("scenarios", {
  id: text("id").primaryKey(),
  encodedState: text("encoded_state").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  viewCount: integer("view_count").default(0).notNull(),
});

export const emailCaptures = pgTable("email_captures", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  scenarioId: text("scenario_id"),
  source: text("source", { enum: ["save", "share", "pdf"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
