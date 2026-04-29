"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  Play,
  LayoutDashboard,
  LogOut,
  Settings,
  Palette,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore, type AppView } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const publicLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const dashboardLinks: {
  label: string;
  view: AppView;
  icon: React.ElementType;
}[] = [
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Templates", view: "templates", icon: Palette },
  { label: "Settings", view: "settings", icon: Settings },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    user,
    currentView,
    setCurrentView,
    setShowAuthModal,
    setAuthModalTab,
    setUser,
  } = useAppStore();

  const isDashboard = currentView !== "landing";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue even if API call fails
    }
    localStorage.removeItem("opus_user_id");
    setUser(null);
    setCurrentView("landing");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isDashboard
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={() => setCurrentView(user ? "dashboard" : "landing")}
            className="flex items-center gap-2"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Opus<span className="gradient-text">Clip</span>
            </span>
          </button>

          {/* Desktop Nav */}
          {user && isDashboard ? (
            <nav className="hidden md:flex items-center gap-1">
              {dashboardLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setCurrentView(link.view)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    currentView === link.view
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              ))}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-1">
              {publicLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(link.href)}
                  className="relative px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5 group flex items-center gap-1"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          )}

          {/* Desktop CTA / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-white/5"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`text-white text-xs ${user.role === "admin" ? "bg-gradient-to-br from-yellow-500 to-orange-600" : "bg-gradient-to-br from-pink-500 to-purple-600"}`}>
                        {user.role === "admin" ? (
                          <Shield className="w-4 h-4" />
                        ) : (
                          user.name
                            ? user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : user.email[0].toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/80 max-w-[120px] truncate">
                      {user.name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#12121a] border-white/10"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm text-white font-medium">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-white/40">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {user.role === "admin" && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          <Shield className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      )}
                      <p className="text-xs text-pink-400 capitalize">
                        {user.plan} Plan
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {dashboardLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.label}
                      onClick={() => setCurrentView(link.view)}
                      className="text-white/70 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                    >
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setAuthModalTab("signin")}
                  className="text-white/70 hover:text-white hover:bg-white/5"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setAuthModalTab("signup")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 px-6"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-[#0a0a0f] border-white/10 w-80"
            >
              <SheetTitle className="text-white text-lg font-bold mb-6">
                OpusClip
              </SheetTitle>
              <div className="flex flex-col gap-2 mt-4">
                {user && isDashboard
                  ? dashboardLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => {
                          setCurrentView(link.view);
                          setMobileOpen(false);
                        }}
                        className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-colors ${
                          currentView === link.view
                            ? "text-white bg-white/10"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </button>
                    ))
                  : publicLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => handleLinkClick(link.href)}
                        className="text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {link.label}
                      </button>
                    ))}

                <div className="border-t border-white/10 mt-4 pt-4 space-y-3">
                  {user ? (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-sm text-white font-medium">
                          {user.name}
                        </p>
                        <p className="text-xs text-white/40">{user.email}</p>
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full text-red-400 hover:text-red-300 hover:bg-white/5 justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAuthModalTab("signin");
                          setMobileOpen(false);
                        }}
                        className="w-full text-white/70 hover:text-white hover:bg-white/5 justify-start"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          setAuthModalTab("signup");
                          setMobileOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                      >
                        Get Started Free
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
