import { create } from "zustand";

export type AppView = "landing" | "dashboard" | "process" | "editor" | "templates" | "settings";

interface AppState {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Auth
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    plan: string;
    clipsUsed: number;
    clipsLimit: number;
    image: string | null;
  } | null;
  setUser: (user: AppState["user"]) => void;
  isAuthLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  // Active clip for editor
  activeClipId: string | null;
  setActiveClipId: (id: string | null) => void;

  // Active video for processing
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;

  // Auth modal
  showAuthModal: boolean;
  authModalTab: "signin" | "signup";
  setShowAuthModal: (show: boolean) => void;
  setAuthModalTab: (tab: "signin" | "signup") => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: "landing",
  setCurrentView: (view) => set({ currentView: view }),

  // Auth
  user: null,
  setUser: (user) => set({ user }),
  isAuthLoading: true,
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  // Active clip
  activeClipId: null,
  setActiveClipId: (id) => set({ activeClipId: id }),

  // Active video
  activeVideoId: null,
  setActiveVideoId: (id) => set({ activeVideoId: id }),

  // Auth modal
  showAuthModal: false,
  authModalTab: "signin",
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthModalTab: (tab) => set({ authModalTab: tab, showAuthModal: true }),
}));
