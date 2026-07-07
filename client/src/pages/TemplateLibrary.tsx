/**
 * Template Library
 * Create, edit, preview, and manage branded Prime Mail templates.
 * Each template controls the full 5-page packet: cover, letter, estimate,
 * comparison, and referral pages.
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Star, StarOff, Eye, ArrowLeft,
  Palette, FileText, Phone, Building2, Gift, Shield,
  ChevronRight, Check, X, Upload,
} from "lucide-react";
import { QMailPreview } from "@/components/QMailPreview";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  isDefault: boolean;
  companyName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  logoKey?: string | null;
  primaryColor?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  website?: string | null;
  coverHeadline?: string | null;
  coverSubheadline?: string | null;
  letterOpening?: string | null;
  letterBody?: string | null;
  letterClosing?: string | null;
  signatureName?: string | null;
  signatureTitle?: string | null;
  signatureImageUrl?: string | null;
  offerHeadline?: string | null;
  offerDetails?: string | null;
  ctaText?: string | null;
  warrantyYears?: number | null;
  warrantyDetails?: string | null;
  referralBonus?: string | null;
  referralDetails?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type TemplateFormData = {
  name: string;
  companyName?: string;
  tagline?: string;
  logoUrl?: string;
  logoKey?: string;
  primaryColor?: string;
  phone?: string;
  licenseNumber?: string;
  website?: string;
  coverHeadline?: string;
  coverSubheadline?: string;
  letterOpening?: string;
  letterBody?: string;
  letterClosing?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImageUrl?: string;
  offerHeadline?: string;
  offerDetails?: string;
  ctaText?: string;
  warrantyYears?: number;
  warrantyDetails?: string;
  referralBonus?: string;
  referralDetails?: string;
};

const DEFAULT_FORM: TemplateFormData = {
  name: "",
  companyName: "",
  tagline: "",
  logoUrl: "",
  logoKey: "",
  primaryColor: "#0EA875",
  phone: "",
  licenseNumber: "",
  website: "",
  coverHeadline: "Your Custom Roofing Estimate",
  coverSubheadline: "Prepared exclusively for your home",
  letterOpening: "Dear Homeowner,",
  letterBody:
    "We recently conducted a satellite analysis of roofs in your neighborhood and noticed that your home may be due for a roof inspection or replacement. Based on our measurements, we have prepared a personalized estimate specifically for your property.",
  letterClosing: "We look forward to hearing from you.",
  signatureName: "",
  signatureTitle: "Your Neighborhood Roofing Specialist",
  signatureImageUrl: "",
  offerHeadline: "Schedule Your Free Inspection",
  offerDetails: "No obligation. No pressure. Just honest answers about your roof.",
  ctaText: "Call or Text Today",
  warrantyYears: 10,
  warrantyDetails: "Lifetime workmanship warranty on all installations.",
  referralBonus: "$250",
  referralDetails: "Refer a neighbor and receive a $250 credit on your next service.",
};

// ─── Section tabs for the editor ─────────────────────────────────────────────
const SECTIONS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "cover", label: "Cover Page", icon: FileText },
  { id: "letter", label: "Letter", icon: FileText },
  { id: "offer", label: "Offer & CTA", icon: Gift },
  { id: "warranty", label: "Warranty", icon: Shield },
  { id: "referral", label: "Referral", icon: Gift },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onEdit,
  onPreview,
  onDelete,
  onSetDefault,
}: {
  template: Template;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const color = template.primaryColor || "#0EA875";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Color band */}
      <div className="h-2" style={{ backgroundColor: color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{template.name}</h3>
              {template.isDefault && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {template.companyName || "No company name set"}
            </p>
          </div>
          {template.logoUrl && (
            <img
              src={template.logoUrl}
              alt={template.companyName || "Logo"}
              className="w-10 h-10 rounded-lg object-contain border border-slate-100 ml-3 flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          {template.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {template.phone}
            </span>
          )}
          {template.warrantyYears && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {template.warrantyYears}yr warranty
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1"
            onClick={onPreview}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1"
            onClick={onEdit}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs px-2"
            onClick={onSetDefault}
            title={template.isDefault ? "Already default" : "Set as default"}
          >
            {template.isDefault ? (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            ) : (
              <StarOff className="w-4 h-4 text-slate-400" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Template Editor ──────────────────────────────────────────────────────────
function TemplateEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: TemplateFormData & { id?: number; isDefault?: boolean };
  onSave: (data: TemplateFormData & { isDefault?: boolean }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TemplateFormData & { isDefault?: boolean }>(initial);
  const [activeSection, setActiveSection] = useState<SectionId>("branding");
  const [showPreview, setShowPreview] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form, value: string | number | boolean | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/profile/logo", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { logoUrl, logoKey } = await res.json() as { logoUrl: string; logoKey: string };
      setForm((prev) => ({ ...prev, logoUrl, logoKey }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed — please try again");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    onSave(form);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <h2 className="font-semibold text-slate-900">
            {initial.id ? "Edit Template" : "New Template"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-1"
          >
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="gap-1 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.55_0.17_162)] text-white"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section nav */}
        <nav className="w-48 border-r border-slate-200 bg-slate-50 flex-shrink-0 py-4">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                activeSection === id
                  ? "bg-white text-emerald-700 font-medium border-r-2 border-emerald-500"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Form fields */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Template name (always visible) */}
          <div>
            <Label htmlFor="tpl-name" className="text-sm font-medium text-slate-700">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Summer Storm Campaign"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tpl-default"
              checked={!!form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <Label htmlFor="tpl-default" className="text-sm text-slate-600 cursor-pointer">
              Set as default template for new campaigns
            </Label>
          </div>

          <div className="border-t border-slate-100 pt-5">
            {/* ─── Branding ─── */}
            {activeSection === "branding" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" /> Branding
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Company Name</Label>
                    <Input
                      value={form.companyName || ""}
                      onChange={(e) => set("companyName", e.target.value)}
                      placeholder="Peak Performance Roofing"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Phone Number</Label>
                    <Input
                      value={form.phone || ""}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="(555) 867-5309"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Website</Label>
                    <Input
                      value={form.website || ""}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="www.yourcompany.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">License Number</Label>
                    <Input
                      value={form.licenseNumber || ""}
                      onChange={(e) => set("licenseNumber", e.target.value)}
                      placeholder="ROC-123456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Tagline</Label>
                    <Input
                      value={form.tagline || ""}
                      onChange={(e) => set("tagline", e.target.value)}
                      placeholder="Quality Roofing Since 2005"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={form.primaryColor || "#0EA875"}
                        onChange={(e) => set("primaryColor", e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={form.primaryColor || "#0EA875"}
                        onChange={(e) => set("primaryColor", e.target.value)}
                        placeholder="#0EA875"
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Company Logo</Label>
                  <div className="flex items-center gap-3 mt-1">
                    {form.logoUrl ? (
                      <div className="relative group">
                        <img
                          src={form.logoUrl}
                          alt="Logo preview"
                          className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-slate-50"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, logoUrl: "", logoKey: "" }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center"
                      >
                        <Building2 className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full"
                        disabled={logoUploading}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoUploading ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {logoUploading ? "Uploading..." : form.logoUrl ? "Replace Logo" : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-slate-400 mt-1.5">PNG, JPG, SVG — max 5 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Cover Page ─── */}
            {activeSection === "cover" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Cover Page
                </h3>
                <div>
                  <Label className="text-xs text-slate-500">Main Headline</Label>
                  <Input
                    value={form.coverHeadline || ""}
                    onChange={(e) => set("coverHeadline", e.target.value)}
                    placeholder="Your Custom Roofing Estimate"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Subheadline</Label>
                  <Input
                    value={form.coverSubheadline || ""}
                    onChange={(e) => set("coverSubheadline", e.target.value)}
                    placeholder="Prepared exclusively for your home"
                    className="mt-1"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-1">What appears on the cover:</p>
                  <ul className="space-y-1 text-xs text-slate-500">
                    <li>• Your company logo and name (from branding)</li>
                    <li>• Google Street View photo of the homeowner's house</li>
                    <li>• The estimate price badge (auto-calculated from measurements)</li>
                    <li>• A QR code linking to the digital estimate</li>
                    <li>• The homeowner's address</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ─── Letter ─── */}
            {activeSection === "letter" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Personal Letter (Page 2)
                </h3>
                <div>
                  <Label className="text-xs text-slate-500">Opening Salutation</Label>
                  <Input
                    value={form.letterOpening || ""}
                    onChange={(e) => set("letterOpening", e.target.value)}
                    placeholder="Dear Homeowner,"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Letter Body</Label>
                  <Textarea
                    value={form.letterBody || ""}
                    onChange={(e) => set("letterBody", e.target.value)}
                    placeholder="Write your personalized message here..."
                    rows={6}
                    className="mt-1 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    The homeowner's address and your company info are automatically added.
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Closing</Label>
                  <Input
                    value={form.letterClosing || ""}
                    onChange={(e) => set("letterClosing", e.target.value)}
                    placeholder="We look forward to hearing from you."
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Signature Name</Label>
                    <Input
                      value={form.signatureName || ""}
                      onChange={(e) => set("signatureName", e.target.value)}
                      placeholder="John Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Signature Title</Label>
                    <Input
                      value={form.signatureTitle || ""}
                      onChange={(e) => set("signatureTitle", e.target.value)}
                      placeholder="Owner & Lead Estimator"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Offer & CTA ─── */}
            {activeSection === "offer" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" /> Offer & Call to Action
                </h3>
                <div>
                  <Label className="text-xs text-slate-500">Offer Headline</Label>
                  <Input
                    value={form.offerHeadline || ""}
                    onChange={(e) => set("offerHeadline", e.target.value)}
                    placeholder="Schedule Your Free Inspection"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Offer Details</Label>
                  <Textarea
                    value={form.offerDetails || ""}
                    onChange={(e) => set("offerDetails", e.target.value)}
                    placeholder="No obligation. No pressure. Just honest answers about your roof."
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">CTA Button Text</Label>
                  <Input
                    value={form.ctaText || ""}
                    onChange={(e) => set("ctaText", e.target.value)}
                    placeholder="Call or Text Today"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* ─── Warranty ─── */}
            {activeSection === "warranty" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Warranty
                </h3>
                <div>
                  <Label className="text-xs text-slate-500">Warranty Years</Label>
                  <Input
                    type="number"
                    value={form.warrantyYears ?? 10}
                    onChange={(e) => set("warrantyYears", parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                    className="mt-1 w-32"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Warranty Details</Label>
                  <Textarea
                    value={form.warrantyDetails || ""}
                    onChange={(e) => set("warrantyDetails", e.target.value)}
                    placeholder="Lifetime workmanship warranty on all installations."
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            )}

            {/* ─── Referral ─── */}
            {activeSection === "referral" && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" /> Referral Program (Page 5)
                </h3>
                <div>
                  <Label className="text-xs text-slate-500">Referral Bonus Amount</Label>
                  <Input
                    value={form.referralBonus || ""}
                    onChange={(e) => set("referralBonus", e.target.value)}
                    placeholder="$250"
                    className="mt-1 w-40"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Referral Details</Label>
                  <Textarea
                    value={form.referralDetails || ""}
                    onChange={(e) => set("referralDetails", e.target.value)}
                    placeholder="Refer a neighbor and receive a $250 credit on your next service."
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live preview modal */}
      {showPreview && (
        <QMailPreview
          onClose={() => setShowPreview(false)}
          onConfirm={() => setShowPreview(false)}
          totalAddresses={1}
          totalQMailCost={3.5}
          totalEstimateValue={8400}
          companyName={form.companyName || undefined}
          phone={form.phone || undefined}
          website={form.website || undefined}
          licenseNumber={form.licenseNumber || undefined}
          logoUrl={form.logoUrl || undefined}
          tagline={form.tagline || undefined}
          template={{
            primaryColor: form.primaryColor || undefined,
            coverHeadline: form.coverHeadline || undefined,
            coverSubheadline: form.coverSubheadline || undefined,
            letterOpening: form.letterOpening || undefined,
            letterBody: form.letterBody || undefined,
            letterClosing: form.letterClosing || undefined,
            signatureName: form.signatureName || undefined,
            signatureTitle: form.signatureTitle || undefined,
            offerHeadline: form.offerHeadline || undefined,
            offerDetails: form.offerDetails || undefined,
            ctaText: form.ctaText || undefined,
            warrantyYears: form.warrantyYears || undefined,
            warrantyDetails: form.warrantyDetails || undefined,
            referralBonus: form.referralBonus || undefined,
            referralDetails: form.referralDetails || undefined,
          }}
          sampleAddress={{
            fullAddress: "1234 Maple Street, Atlanta, GA 30301",
            measuredSqFt: 1850,
            pitch: "6/12",
            estimatePrice: 8400,
          }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplateLibrary() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [editing, setEditing] = useState<(TemplateFormData & { id?: number; isDefault?: boolean }) | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: templates = [], refetch } = trpc.templates.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMut = trpc.templates.create.useMutation({
    onSuccess: () => { toast.success("Template created"); setEditing(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.templates.update.useMutation({
    onSuccess: () => { toast.success("Template saved"); setEditing(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.templates.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); setConfirmDelete(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const setDefaultMut = trpc.templates.setDefault.useMutation({
    onSuccess: () => { toast.success("Default template updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const nullToUndef = <T extends Record<string, unknown>>(obj: T): T => {
    const result = { ...obj } as Record<string, unknown>;
    for (const key in result) {
      if (result[key] === null) result[key] = undefined;
    }
    return result as T;
  };

  const handleSave = (data: TemplateFormData & { isDefault?: boolean }) => {
    const clean = nullToUndef(data);
    if (editing?.id) {
      updateMut.mutate({ id: editing.id, ...clean });
    } else {
      createMut.mutate({ ...clean, name: clean.name });
    }
  };

  // ─── Editor view ──────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TemplateEditor
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={createMut.isPending || updateMut.isPending}
        />
      </div>
    );
  }

  // ─── Library view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="font-bold text-slate-900 text-lg">Template Library</h1>
              <p className="text-xs text-slate-500">
                {templates.length} template{templates.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setEditing({ ...DEFAULT_FORM })}
            className="gap-2 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.55_0.17_162)] text-white"
          >
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Empty state */}
        {templates.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No templates yet</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first branded template to customize every page of your Prime Mail packet — cover, letter, estimate, and more.
            </p>
            <Button
              onClick={() => setEditing({ ...DEFAULT_FORM })}
              className="gap-2 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.55_0.17_162)] text-white"
            >
              <Plus className="w-4 h-4" /> Create First Template
            </Button>
          </div>
        )}

        {/* Template grid */}
        {templates.length > 0 && (
          <>
            {/* Default template callout */}
            {!templates.some((t) => t.isDefault) && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-amber-700">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                No default template set. Click the star icon on a template to make it the default for new campaigns.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(templates as Template[]).map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() =>
                    setEditing({
                      id: t.id,
                      isDefault: t.isDefault,
                      name: t.name,
                      companyName: t.companyName || "",
                      tagline: t.tagline || "",
                      logoUrl: t.logoUrl || "",
                      logoKey: t.logoKey || "",
                      primaryColor: t.primaryColor || "#0EA875",
                      phone: t.phone || "",
                      licenseNumber: t.licenseNumber || "",
                      website: t.website || "",
                      coverHeadline: t.coverHeadline || "",
                      coverSubheadline: t.coverSubheadline || "",
                      letterOpening: t.letterOpening || "",
                      letterBody: t.letterBody || "",
                      letterClosing: t.letterClosing || "",
                      signatureName: t.signatureName || "",
                      signatureTitle: t.signatureTitle || "",
                      signatureImageUrl: t.signatureImageUrl || "",
                      offerHeadline: t.offerHeadline || "",
                      offerDetails: t.offerDetails || "",
                      ctaText: t.ctaText || "",
                      warrantyYears: t.warrantyYears ?? 10,
                      warrantyDetails: t.warrantyDetails || "",
                      referralBonus: t.referralBonus || "",
                      referralDetails: t.referralDetails || "",
                    })
                  }
                  onPreview={() => setPreviewTemplate(t)}
                  onDelete={() => setConfirmDelete(t.id)}
                  onSetDefault={() => setDefaultMut.mutate({ id: t.id })}
                />
              ))}

              {/* Add new card */}
              <button
                onClick={() => setEditing({ ...DEFAULT_FORM })}
                className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors flex flex-col items-center justify-center gap-3 py-10 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-emerald-600 font-medium">
                  New Template
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-900 text-center mb-2">Delete Template?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This action cannot be undone. Any campaigns using this template will keep their existing settings.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deleteMut.mutate({ id: confirmDelete })}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <QMailPreview
          onClose={() => setPreviewTemplate(null)}
          onConfirm={() => setPreviewTemplate(null)}
          totalAddresses={1}
          totalQMailCost={3.5}
          totalEstimateValue={8400}
          companyName={previewTemplate.companyName || undefined}
          phone={previewTemplate.phone || undefined}
          website={previewTemplate.website || undefined}
          licenseNumber={previewTemplate.licenseNumber || undefined}
          logoUrl={previewTemplate.logoUrl || undefined}
          tagline={previewTemplate.tagline || undefined}
          template={{
            primaryColor: previewTemplate.primaryColor || undefined,
            coverHeadline: previewTemplate.coverHeadline || undefined,
            coverSubheadline: previewTemplate.coverSubheadline || undefined,
            letterOpening: previewTemplate.letterOpening || undefined,
            letterBody: previewTemplate.letterBody || undefined,
            letterClosing: previewTemplate.letterClosing || undefined,
            signatureName: previewTemplate.signatureName || undefined,
            signatureTitle: previewTemplate.signatureTitle || undefined,
            offerHeadline: previewTemplate.offerHeadline || undefined,
            offerDetails: previewTemplate.offerDetails || undefined,
            ctaText: previewTemplate.ctaText || undefined,
            warrantyYears: previewTemplate.warrantyYears || undefined,
            warrantyDetails: previewTemplate.warrantyDetails || undefined,
            referralBonus: previewTemplate.referralBonus || undefined,
            referralDetails: previewTemplate.referralDetails || undefined,
          }}
          sampleAddress={{
            fullAddress: "1234 Maple Street, Atlanta, GA 30301",
            measuredSqFt: 1850,
            pitch: "6/12",
            estimatePrice: 8400,
          }}
        />
      )}
    </div>
  );
}
