/**
 * logoUploadRoute.ts
 * POST /api/profile/logo
 * Accepts a multipart/form-data upload of a company logo image,
 * stores it in Manus storage, and saves the URL + key to the contractor profile.
 */

import { Router, Request, Response } from "express";

import multer from "multer";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";
import { upsertContractorProfile } from "./db";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerLogoUploadRoute(app: Router) {
  app.post(
    "/api/profile/logo",
    upload.single("logo"),
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        // ── Auth ──────────────────────────────────────────────────────────────
        let user;
        try { user = await sdk.authenticateRequest(req); } catch { user = null; }
        if (!user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: "No file uploaded" });
          return;
        }

        // ── Upload to storage ─────────────────────────────────────────────────
        const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "png";
        const relKey = `logos/${user.id}/company_logo.${ext}`;
        const { key, url } = await storagePut(relKey, req.file.buffer, req.file.mimetype);

        // ── Save to contractor profile ────────────────────────────────────────
        await upsertContractorProfile({ userId: user.id, logoUrl: url, logoKey: key });

        res.json({ success: true, logoUrl: url, logoKey: key });
      } catch (err: any) {
        console.error("[Logo Upload] Error:", err);
        res.status(500).json({ error: err.message || "Upload failed" });
      }
    }
  );
}
