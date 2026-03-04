import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "restrict" })
    .default(1),
  budgetAllocation: real("budget_allocation").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const vendors = sqliteTable("vendors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: real("price").notNull().default(0),
  notes: text("notes").default(""),
  pros: text("pros").default(""),
  cons: text("cons").default(""),
  isSelected: integer("is_selected", { mode: "boolean" })
    .notNull()
    .default(false),
  isBooked: integer("is_booked", { mode: "boolean" })
    .notNull()
    .default(false),
  contactInfo: text("contact_info").default(""),
  depositPaid: real("deposit_paid").notNull().default(0),
  totalPaid: real("total_paid").notNull().default(0),
  depositDueDate: text("deposit_due_date"),
  finalPaymentDueDate: text("final_payment_due_date"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const households = sqliteTable("households", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const guests = sqliteTable("guests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
  householdId: integer("household_id").references(() => households.id, {
    onDelete: "set null",
  }),
  party: text("party").notNull().default("joint"),
  attendance: text("attendance").notNull().default("all"),
  rsvpStatus: text("rsvp_status").notNull().default("pending"),
  isPlusOne: integer("is_plus_one", { mode: "boolean" })
    .notNull()
    .default(false),
  linkedGuestId: integer("linked_guest_id"),
  dietaryRequirements: text("dietary_requirements").default(""),
  allergies: text("allergies").default(""),
  accessibilityNeeds: text("accessibility_needs").default(""),
  tableAssignment: text("table_assignment").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// Type exports
export type Setting = typeof settings.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type NewVendor = typeof vendors.$inferInsert;
export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
