"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AuthModal } from "@/components/shared/AuthModal";
import { HeroSection } from "@/components/sections/HeroSection";
import { useAppStore } from "@/lib/store";

// Lazy load below-the-fold sections to reduce initial bundle size
const TrustedBySection = dynamic(
  () => import("@/components/sections/TrustedBySection").then((m) => ({ default: m.TrustedBySection })),
  { ssr: false }
);
const FeaturesSection = dynamic(
  () => import("@/components/sections/FeaturesSection").then((m) => ({ default: m.FeaturesSection })),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import("@/components/sections/HowItWorksSection").then((m) => ({ default: m.HowItWorksSection })),
  { ssr: false }
);
const PricingSection = dynamic(
  () => import("@/components/sections/PricingSection").then((m) => ({ default: m.PricingSection })),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import("@/components/sections/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: false }
);
const FAQSection = dynamic(
  () => import("@/components/sections/FAQSection").then((m) => ({ default: m.FAQSection })),
  { ssr: false }
);
const CTASection = dynamic(
  () => import("@/components/sections/CTASection").then((m) => ({ default: m.CTASection })),
  { ssr: false }
);
const DashboardSection = dynamic(
  () => import("@/components/sections/DashboardSection").then((m) => ({ default: m.DashboardSection })),
  { ssr: false }
);
const ClipEditorSection = dynamic(
  () => import("@/components/sections/ClipEditorSection").then((m) => ({ default: m.ClipEditorSection })),
  { ssr: false }
);
const TemplatesSection = dynamic(
  () => import("@/components/sections/TemplatesSection").then((m) => ({ default: m.TemplatesSection })),
  { ssr: false }
);
const SettingsSection = dynamic(
  () => import("@/components/sections/SettingsSection").then((m) => ({ default: m.SettingsSection })),
  { ssr: false }
);

export default function Home() {
  const { user, currentView, setUser, setAuthLoading } = useAppStore();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try session cookie first (via /api/auth/me with no params)
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("opus_user_id", data.user.id);
            return;
          }
        }

        // Fallback: try localStorage userId
        const savedUserId = localStorage.getItem("opus_user_id");
        if (savedUserId) {
          const fallbackRes = await fetch(`/api/auth/me?userId=${savedUserId}`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setUser(data.user);
          } else {
            localStorage.removeItem("opus_user_id");
          }
        }
      } catch {
        localStorage.removeItem("opus_user_id");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setAuthLoading]);

  // Save user ID to localStorage when it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("opus_user_id", user.id);
    }
  }, [user?.id]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return user ? <DashboardSection /> : <LandingContent />;
      case "editor":
        return user ? <ClipEditorSection /> : <LandingContent />;
      case "templates":
        return user ? <TemplatesSection /> : <LandingContent />;
      case "settings":
        return user ? <SettingsSection /> : <LandingContent />;
      case "landing":
      default:
        return <LandingContent />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Navbar />
      <AuthModal />
      <main className="flex-1">{renderView()}</main>
      {currentView === "landing" && <Footer />}
    </div>
  );
}

function LandingContent() {
  return (
    <>
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
