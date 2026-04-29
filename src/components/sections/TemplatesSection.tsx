"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Palette,
  Plus,
  Trash2,
  Loader2,
  LayoutGrid,
  Type,
  Eye,
  Check,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Square,
  Monitor,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateData {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  colors: string;
  font: string;
  logoPosition: string;
  captionStyle: string;
  layout: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT_OPTIONS = ["Inter", "Roboto", "Poppins", "Montserrat", "Open Sans"];

const LOGO_POSITION_OPTIONS = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const CAPTION_STYLE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "bold", label: "Bold" },
  { value: "karaoke", label: "Karaoke" },
  { value: "outline", label: "Outline" },
];

const LAYOUT_OPTIONS = [
  { value: "9:16", label: "9:16", icon: Smartphone },
  { value: "1:1", label: "1:1", icon: Square },
  { value: "16:9", label: "16:9", icon: Monitor },
];

const DEFAULT_COLORS: TemplateColors = {
  primary: "#EC4899",
  secondary: "#8B5CF6",
  background: "#0A0A0F",
  text: "#FFFFFF",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseColors(colorsStr: string): TemplateColors {
  try {
    return JSON.parse(colorsStr);
  } catch {
    return {};
  }
}

function layoutIcon(layout: string) {
  const found = LAYOUT_OPTIONS.find((l) => l.value === layout);
  return found ? found.icon : Smartphone;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded-md border border-white/10 shrink-0"
        style={{ backgroundColor: color || "#333" }}
      />
      <span className="text-[10px] text-white/30">{label}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-white/20" />
      </div>
      <p className="text-white/40 text-sm font-medium mb-1">{title}</p>
      <p className="text-white/20 text-xs max-w-[280px]">{description}</p>
    </div>
  );
}

// ─── Create Template Dialog ──────────────────────────────────────────────────

function CreateTemplateDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<TemplateColors>({ ...DEFAULT_COLORS });
  const [font, setFont] = useState("Inter");
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const [captionStyle, setCaptionStyle] = useState("default");
  const [layout, setLayout] = useState("9:16");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          description: description.trim() || null,
          colors,
          font,
          logoPosition,
          captionStyle,
          layout,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create template");
      }

      // Reset form
      setName("");
      setDescription("");
      setColors({ ...DEFAULT_COLORS });
      setFont("Inter");
      setLogoPosition("bottom-right");
      setCaptionStyle("default");
      setLayout("9:16");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setColors({ ...DEFAULT_COLORS });
    setFont("Inter");
    setLogoPosition("bottom-right");
    setCaptionStyle("default");
    setLayout("9:16");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white/90 flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-400" />
            Create New Template
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Define your brand template with custom colors, fonts, and styles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Template Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Brand Template"
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus:border-pink-500/50 focus:ring-pink-500/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus:border-pink-500/50 focus:ring-pink-500/20 min-h-[60px]"
            />
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <Label className="text-white/60 text-xs">Brand Colors</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/30">Primary</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                    style={{ backgroundColor: colors.primary || "#333" }}
                  />
                  <Input
                    value={colors.primary || ""}
                    onChange={(e) =>
                      setColors((c) => ({ ...c, primary: e.target.value }))
                    }
                    placeholder="#EC4899"
                    className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-xs h-8 focus:border-pink-500/50 focus:ring-pink-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/30">Secondary</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                    style={{ backgroundColor: colors.secondary || "#333" }}
                  />
                  <Input
                    value={colors.secondary || ""}
                    onChange={(e) =>
                      setColors((c) => ({ ...c, secondary: e.target.value }))
                    }
                    placeholder="#8B5CF6"
                    className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-xs h-8 focus:border-pink-500/50 focus:ring-pink-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/30">Background</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                    style={{ backgroundColor: colors.background || "#333" }}
                  />
                  <Input
                    value={colors.background || ""}
                    onChange={(e) =>
                      setColors((c) => ({ ...c, background: e.target.value }))
                    }
                    placeholder="#0A0A0F"
                    className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-xs h-8 focus:border-pink-500/50 focus:ring-pink-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/30">Text</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                    style={{ backgroundColor: colors.text || "#333" }}
                  />
                  <Input
                    value={colors.text || ""}
                    onChange={(e) =>
                      setColors((c) => ({ ...c, text: e.target.value }))
                    }
                    placeholder="#FFFFFF"
                    className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-xs h-8 focus:border-pink-500/50 focus:ring-pink-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Font Family</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 focus:border-pink-500/50 focus:ring-pink-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/10">
                {FONT_OPTIONS.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    <span style={{ fontFamily: f }}>{f}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logo Position */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Logo Position</Label>
            <Select value={logoPosition} onValueChange={setLogoPosition}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 focus:border-pink-500/50 focus:ring-pink-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/10">
                {LOGO_POSITION_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caption Style */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Caption Style</Label>
            <Select value={captionStyle} onValueChange={setCaptionStyle}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 focus:border-pink-500/50 focus:ring-pink-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/10">
                {CAPTION_STYLE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layout */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Default Layout</Label>
            <Select value={layout} onValueChange={setLayout}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 focus:border-pink-500/50 focus:ring-pink-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/10">
                {LAYOUT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <opt.icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TemplatesSection() {
  const { user, setCurrentView } = useAppStore();

  // Local state
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/templates?userId=${user.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleApply = useCallback(async (templateId: string) => {
    setAppliedTemplateId(templateId);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Apply template settings to all clips that belong to the user
      // We need to get user's clips first
      const userId = user?.id;
      if (!userId) return;

      const videosRes = await fetch(`/api/videos?userId=${userId}`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        const allClips = videosData.data?.flatMap((v: { clips: { id: string }[] }) => v.clips) || [];
        
        // Apply template to all clips
        await Promise.all(
          allClips.map((clip: { id: string }) =>
            fetch(`/api/clips/${clip.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                captionStyle: template.captionStyle,
                layout: template.layout,
                templateId: template.id,
                userId: user?.id,
              }),
            })
          )
        );
      }
    } catch (err) {
      console.error("Failed to apply template:", err);
    }
    setTimeout(() => setAppliedTemplateId(null), 2000);
  }, [templates, user?.id]);

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      setDeleting(true);
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        }
      } catch (err) {
        console.error("Failed to delete template:", err);
      } finally {
        setDeleting(false);
        setDeleteTemplateId(null);
      }
    },
    []
  );

  // ─── Categorize templates ────────────────────────────────────────────────

  const defaultTemplates = templates.filter((t) => t.isDefault);
  const userTemplates = templates.filter((t) => !t.isDefault);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="min-h-screen bg-[#0a0a0f] relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("dashboard")}
              className="h-9 w-9 text-white/40 hover:text-white/80 hover:bg-white/5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-400" />
                Brand Templates
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                Manage and create templates for consistent branding across your clips
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300 rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </motion.div>

        {/* ─── Default Templates Section ───────────────────────────────────── */}
        {defaultTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/70">
                Default Templates
              </h3>
              <Badge
                variant="secondary"
                className="text-[10px] bg-white/5 text-white/40 border-0"
              >
                {defaultTemplates.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultTemplates.map((template, i) => {
                const colors = parseColors(template.colors);
                const LayoutIcon = layoutIcon(template.layout);
                const isApplied = appliedTemplateId === template.id;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all"
                  >
                    {/* Template preview bar */}
                    <div
                      className="h-20 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary || "#EC4899"}22, ${colors.secondary || "#8B5CF6"}22)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary || "#EC4899"}, ${colors.secondary || "#8B5CF6"})`,
                        }}
                      />
                      <div className="relative z-10 text-center">
                        <span
                          className="text-2xl font-bold opacity-60"
                          style={{
                            color: colors.text || "#FFFFFF",
                            fontFamily: template.font,
                          }}
                        >
                          Aa
                        </span>
                      </div>
                    </div>

                    {/* Name & Description */}
                    <h4 className="text-sm font-medium text-white/80 mb-1 truncate">
                      {template.name}
                    </h4>
                    {template.description && (
                      <p className="text-xs text-white/30 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Color swatches */}
                    <div className="flex items-center gap-3 mb-3">
                      {colors.primary && (
                        <ColorSwatch color={colors.primary} label="Primary" />
                      )}
                      {colors.secondary && (
                        <ColorSwatch
                          color={colors.secondary}
                          label="Secondary"
                        />
                      )}
                    </div>

                    {/* Meta badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <Type className="w-2.5 h-2.5" />
                        {template.font}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <LayoutIcon className="w-2.5 h-2.5" />
                        {template.layout}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        {template.captionStyle}
                      </Badge>
                    </div>

                    {/* Apply button */}
                    <Button
                      onClick={() => handleApply(template.id)}
                      className={`w-full h-8 text-xs rounded-lg border-0 transition-all ${
                        isApplied
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/20"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Applied!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Apply Template
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── User Templates Section ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/70">
              Your Templates
            </h3>
            {userTemplates.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-white/5 text-white/40 border-0"
              >
                {userTemplates.length}
              </Badge>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-5 animate-pulse"
                >
                  <div className="h-20 rounded-lg bg-white/5 mb-4" />
                  <div className="h-3 w-3/4 rounded bg-white/5 mb-2" />
                  <div className="h-2 w-1/2 rounded bg-white/5 mb-3" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-5 w-14 rounded bg-white/5" />
                    <div className="h-5 w-12 rounded bg-white/5" />
                  </div>
                  <div className="h-8 w-full rounded-lg bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && userTemplates.length === 0 && (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl">
              <EmptyState
                icon={Palette}
                title="No custom templates yet"
                description="Create your first brand template to maintain consistent styling across all your clips"
              />
            </div>
          )}

          {/* User template cards */}
          {!loading && userTemplates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTemplates.map((template, i) => {
                const colors = parseColors(template.colors);
                const LayoutIcon = layoutIcon(template.layout);
                const isApplied = appliedTemplateId === template.id;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all relative"
                  >
                    {/* Delete button */}
                    <AlertDialog
                      open={deleteTemplateId === template.id}
                      onOpenChange={(open) => !open && setDeleteTemplateId(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 h-7 w-7 text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTemplateId(template.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        className="bg-[#12121a] border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white/90">
                            Delete Template?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/40">
                            This will permanently delete &quot;{template.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500/80 hover:bg-red-600 text-white border-0"
                            disabled={deleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            {deleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Template preview bar */}
                    <div
                      className="h-20 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary || "#EC4899"}22, ${colors.secondary || "#8B5CF6"}22)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary || "#EC4899"}, ${colors.secondary || "#8B5CF6"})`,
                        }}
                      />
                      <div className="relative z-10 text-center">
                        <span
                          className="text-2xl font-bold opacity-60"
                          style={{
                            color: colors.text || "#FFFFFF",
                            fontFamily: template.font,
                          }}
                        >
                          Aa
                        </span>
                      </div>
                    </div>

                    {/* Name & Description */}
                    <h4 className="text-sm font-medium text-white/80 mb-1 truncate pr-6">
                      {template.name}
                    </h4>
                    {template.description && (
                      <p className="text-xs text-white/30 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Color swatches */}
                    <div className="flex items-center gap-3 mb-3">
                      {colors.primary && (
                        <ColorSwatch color={colors.primary} label="Primary" />
                      )}
                      {colors.secondary && (
                        <ColorSwatch
                          color={colors.secondary}
                          label="Secondary"
                        />
                      )}
                    </div>

                    {/* Meta badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <Type className="w-2.5 h-2.5" />
                        {template.font}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <LayoutIcon className="w-2.5 h-2.5" />
                        {template.layout}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-white/40 border-0 gap-1"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        {template.captionStyle}
                      </Badge>
                    </div>

                    {/* Apply button */}
                    <Button
                      onClick={() => handleApply(template.id)}
                      className={`w-full h-8 text-xs rounded-lg border-0 transition-all ${
                        isApplied
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/20"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Applied!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Apply Template
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={user?.id || ""}
        onCreated={fetchTemplates}
      />
    </section>
  );
}
