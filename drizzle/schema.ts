import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Contractor Profiles ──────────────────────────────────────────────────────
export const contractorProfiles = mysqlTable("contractor_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: varchar("companyName", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  licenseNumber: varchar("licenseNumber", { length: 64 }),
  logoUrl: text("logoUrl"),
  logoKey: text("logoKey"),
  website: varchar("website", { length: 255 }),
  tagline: text("tagline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractorProfile = typeof contractorProfiles.$inferSelect;
export type InsertContractorProfile = typeof contractorProfiles.$inferInsert;

// ─── Pitch Rates ──────────────────────────────────────────────────────────────
export const pitchRates = mysqlTable("pitch_rates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  flatRate: decimal("flatRate", { precision: 8, scale: 2 }).default("350.00"),
  pitch4Rate: decimal("pitch4Rate", { precision: 8, scale: 2 }).default("400.00"),
  pitch6Rate: decimal("pitch6Rate", { precision: 8, scale: 2 }).default("450.00"),
  pitch8Rate: decimal("pitch8Rate", { precision: 8, scale: 2 }).default("500.00"),
  pitch10Rate: decimal("pitch10Rate", { precision: 8, scale: 2 }).default("575.00"),
  flatMultiplier: decimal("flatMultiplier", { precision: 4, scale: 2 }).default("1.00"),
  pitch4Multiplier: decimal("pitch4Multiplier", { precision: 4, scale: 2 }).default("1.05"),
  pitch6Multiplier: decimal("pitch6Multiplier", { precision: 4, scale: 2 }).default("1.12"),
  pitch8Multiplier: decimal("pitch8Multiplier", { precision: 4, scale: 2 }).default("1.20"),
  pitch10Multiplier: decimal("pitch10Multiplier", { precision: 4, scale: 2 }).default("1.30"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PitchRates = typeof pitchRates.$inferSelect;
export type InsertPitchRates = typeof pitchRates.$inferInsert;

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "measuring", "ready", "ordered", "printing", "delivered"])
    .default("draft")
    .notNull(),
  totalAddresses: int("totalAddresses").default(0),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).default("0.00"),
  estimatedPipelineValue: decimal("estimatedPipelineValue", { precision: 12, scale: 2 }).default("0.00"),
  orderedAt: timestamp("orderedAt"),
  deliveredAt: timestamp("deliveredAt"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  fullAddress: text("fullAddress").notNull(),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zip: varchar("zip", { length: 16 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  source: mysqlEnum("source", ["pin_drop", "address_search", "csv_import"]).default("address_search"),
  measuredSqFt: decimal("measuredSqFt", { precision: 10, scale: 2 }),
  roofSquares: decimal("roofSquares", { precision: 8, scale: 2 }),
  pitch: mysqlEnum("pitch", ["flat", "4/12", "6/12", "8/12", "10/12+"]),
  satelliteImageUrl: text("satelliteImageUrl"),
  estimatePrice: decimal("estimatePrice", { precision: 10, scale: 2 }),
  qrScanned: boolean("qrScanned").default(false),
  calledIn: boolean("calledIn").default(false),
  converted: boolean("converted").default(false),
  jobValue: decimal("jobValue", { precision: 10, scale: 2 }),
  polygonPoints: json("polygonPoints"),
  status: mysqlEnum("status", ["pending", "measured", "estimated", "ordered", "mailed"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Response Events ──────────────────────────────────────────────────────────
export const responseEvents = mysqlTable("response_events", {
  id: int("id").autoincrement().primaryKey(),
  addressId: int("addressId").notNull(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["qr_scan", "call", "conversion"]).notNull(),
  notes: text("notes"),
  jobValue: decimal("jobValue", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResponseEvent = typeof responseEvents.$inferSelect;
export type InsertResponseEvent = typeof responseEvents.$inferInsert;