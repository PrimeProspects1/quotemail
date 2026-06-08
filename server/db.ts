import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  addresses,
  campaigns,
  contractorProfiles,
  InsertAddress,
  InsertCampaign,
  InsertContractorProfile,
  InsertPitchRates,
  InsertUser,
  pitchRates,
  responseEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized; updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Contractor Profiles ──────────────────────────────────────────────────────
export async function getContractorProfile(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertContractorProfile(data: InsertContractorProfile) {
  const db = await getDb(); if (!db) return;
  const updateSet: Partial<InsertContractorProfile> = { ...data };
  delete updateSet.userId;
  await db.insert(contractorProfiles).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

// ─── Pitch Rates ──────────────────────────────────────────────────────────────
export async function getPitchRates(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(pitchRates).where(eq(pitchRates.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertPitchRates(data: InsertPitchRates) {
  const db = await getDb(); if (!db) return;
  const updateSet: Partial<InsertPitchRates> = { ...data };
  delete updateSet.userId;
  await db.insert(pitchRates).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export async function getCampaigns(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number, userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(campaigns).values(data);
}

export async function updateCampaign(id: number, userId: number, data: Partial<InsertCampaign>) {
  const db = await getDb(); if (!db) return;
  await db.update(campaigns).set(data).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

export async function recalcCampaignTotals(campaignId: number, userId: number) {
  const db = await getDb(); if (!db) return;
  const rows = await db.select().from(addresses).where(and(eq(addresses.campaignId, campaignId), eq(addresses.userId, userId)));
  const totalAddresses = rows.length;
  const totalCost = (totalAddresses * 3.5).toFixed(2);
  const estimatedPipelineValue = rows.reduce((sum, r) => sum + parseFloat(r.estimatePrice ?? "0"), 0).toFixed(2);
  await db.update(campaigns).set({ totalAddresses, totalCost, estimatedPipelineValue }).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
}

// ─── Addresses ────────────────────────────────────────────────────────────────
export async function getAddressesByCampaign(campaignId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(addresses).where(and(eq(addresses.campaignId, campaignId), eq(addresses.userId, userId))).orderBy(desc(addresses.createdAt));
}

export async function getAddressById(id: number, userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function createAddress(data: InsertAddress) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(addresses).values(data);
}

export async function updateAddress(id: number, userId: number, data: Partial<InsertAddress>) {
  const db = await getDb(); if (!db) return;
  await db.update(addresses).set(data).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

export async function deleteAddress(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

// ─── Response Events ──────────────────────────────────────────────────────────
export async function getResponseEvents(campaignId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(responseEvents).where(and(eq(responseEvents.campaignId, campaignId), eq(responseEvents.userId, userId))).orderBy(desc(responseEvents.createdAt));
}

export async function createResponseEvent(data: { addressId: number; campaignId: number; userId: number; type: "qr_scan" | "call" | "conversion"; notes?: string; jobValue?: string; }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(responseEvents).values(data);
  const flagMap = { qr_scan: { qrScanned: true }, call: { calledIn: true }, conversion: { converted: true, jobValue: data.jobValue } };
  const flagUpdate = flagMap[data.type];
  if (flagUpdate) await db.update(addresses).set(flagUpdate).where(and(eq(addresses.id, data.addressId), eq(addresses.userId, data.userId)));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalCampaigns: 0, totalAddresses: 0, totalSpend: 0, totalResponses: 0 };
  const [campaignRows, addressRows, responseRows] = await Promise.all([
    db.select().from(campaigns).where(eq(campaigns.userId, userId)),
    db.select().from(addresses).where(eq(addresses.userId, userId)),
    db.select().from(responseEvents).where(eq(responseEvents.userId, userId)),
  ]);
  const totalSpend = campaignRows.reduce((sum, c) => sum + parseFloat(c.totalCost ?? "0"), 0);
  return { totalCampaigns: campaignRows.length, totalAddresses: addressRows.length, totalSpend, totalResponses: responseRows.length };
}
