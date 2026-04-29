"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AuthModal } from "@/components/shared/AuthModal";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustedBySection } from "@/components/sections/TrustedBySection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { DashboardSection } from "@/components/sections/DashboardSection";
import { ClipEditorSection } from "@/components/sections/ClipEditorSection";
import { TemplatesSection } from "@/components/sections/TemplatesSection";
import { SettingsSection } from "@/components/sections/SettingsSection";
import { useAppStore } from "@/lib/store";

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
