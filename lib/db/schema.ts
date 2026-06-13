import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Anonymous hospital reviews. Keyed by the stable hospital id (e.g. "osm-12345").
export const hospitalReviews = pgTable("hospital_reviews", {
  id: serial("id").primaryKey(),
  hospitalId: text("hospital_id").notNull(),
  hospitalName: text("hospital_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HospitalReview = typeof hospitalReviews.$inferSelect;
