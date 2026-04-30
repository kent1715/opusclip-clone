// ─── Shared Constants ─────────────────────────────────────────────────────────
// Single source of truth for caption presets, fonts, animations, colors, etc.
// Used by both ProcessingSection and ClipEditorSection (and backend validation)

// ─── Caption Style Presets ────────────────────────────────────────────────

export const CAPTION_PRESETS = [
  { id: "karaoke", name: "Karaoke", textColor: "#4ade80", highlight: true, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "deep-diver", name: "Deep Diver", textColor: "#94a3b8", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.5)" },
  { id: "pod-p", name: "Pod P", textColor: "#f472b6", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "popline", name: "Popline", textColor: "#ffffff", highlight: false, uppercase: true, bg: "transparent", outline: true },
  { id: "seamless-bounce", name: "Seamless Bounce", textColor: "#4ade80", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.4)" },
  { id: "gradient-wave", name: "Gradient Wave", textColor: "#67e8f9", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "beasty", name: "Beasty", textColor: "#d1d5db", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.6)" },
  { id: "youshaei", name: "Youshaei", textColor: "#5eead4", highlight: true, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "mozi", name: "Mozi", textColor: "#86efac", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "glitch-infinite", name: "Glitch Infinite", textColor: "#fb923c", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.6)" },
  { id: "baby-earthquake", name: "Baby Earthquake", textColor: "#fde68a", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.5)" },
  { id: "neon-pulse", name: "Neon Pulse", textColor: "#e879f9", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.5)" },
  { id: "default", name: "Default", textColor: "#ffffff", highlight: false, uppercase: false, bg: "rgba(0,0,0,0.6)" },
  { id: "bold", name: "Bold", textColor: "#ffffff", highlight: false, uppercase: true, bg: "rgba(0,0,0,0.7)" },
  { id: "outline", name: "Outline", textColor: "#ffffff", highlight: false, uppercase: true, bg: "transparent", outline: true },
] as const;

// Valid caption style IDs (for backend validation)
export const VALID_CAPTION_STYLES = CAPTION_PRESETS.map(p => p.id);

// ─── Font Options ────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  { id: "inter", name: "Inter", family: "'Inter', sans-serif" },
  { id: "montserrat", name: "Montserrat", family: "'Montserrat', sans-serif" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif" },
  { id: "oswald", name: "Oswald", family: "'Oswald', sans-serif" },
  { id: "bebas", name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { id: "permanent", name: "Permanent Marker", family: "'Permanent Marker', cursive" },
  { id: "source-code", name: "Source Code Pro", family: "'Source Code Pro', monospace" },
] as const;

export const VALID_FONT_IDS = FONT_OPTIONS.map(f => f.id);

// ─── Animation Options ──────────────────────────────────────────────────

export const ANIMATION_OPTIONS = [
  { id: "none", name: "None" },
  { id: "bounce", name: "Bounce" },
  { id: "wave", name: "Wave" },
  { id: "fade", name: "Fade In" },
  { id: "slide-up", name: "Slide Up" },
  { id: "glitch", name: "Glitch" },
  { id: "karaoke", name: "Karaoke" },
  { id: "rotate", name: "Rotate" },
] as const;

export const VALID_ANIMATION_IDS = ANIMATION_OPTIONS.map(a => a.id);

// ─── Color Options ──────────────────────────────────────────────────────

export const COLOR_OPTIONS = [
  { id: "white", name: "White", value: "#ffffff" },
  { id: "yellow", name: "Yellow", value: "#fde047" },
  { id: "green", name: "Green", value: "#4ade80" },
  { id: "cyan", name: "Cyan", value: "#67e8f9" },
  { id: "blue", name: "Blue", value: "#60a5fa" },
  { id: "purple", name: "Purple", value: "#c084fc" },
  { id: "pink", name: "Pink", value: "#f472b6" },
  { id: "red", name: "Red", value: "#f87171" },
  { id: "orange", name: "Orange", value: "#fb923c" },
  { id: "black", name: "Black", value: "#000000" },
] as const;

// ─── Layout Options ──────────────────────────────────────────────────────

export const VALID_LAYOUTS = ["9:16", "1:1", "16:9"] as const;

// ─── Caption Position Options ────────────────────────────────────────────

export const VALID_CAPTION_POSITIONS = ["bottom", "center", "top"] as const;

// ─── Plan Configuration ──────────────────────────────────────────────────

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    clipsLimit: 5,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    clipsLimit: 200,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/month",
    clipsLimit: 999,
  },
] as const;

export const VALID_PLANS = PLANS.map(p => p.id);
