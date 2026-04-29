"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  User,
  Mail,
  Zap,
  Eye,
  Crown,
  Settings,
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  Film,
  HardDrive,
  Check,
  Star,
  Rocket,
  Trash2,
  Shield,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

// ─── Plan Configuration ──────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic AI clip generation",
    icon: Eye,
    color: "text-white/60",
    gradient: "from-white/10 to-white/5",
    features: [
      "5 clips per month",
      "720p export quality",
      "Basic captions",
      "1 layout option",
      "Community support",
    ],
    clipsLimit: 5,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators who need more power",
    icon: Zap,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-pink-500/20",
    features: [
      "50 clips per month",
      "1080p export quality",
      "All caption styles",
      "All layout options",
      "Brand templates",
      "Priority support",
    ],
    clipsLimit: 50,
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/month",
    description: "For teams and professional creators",
    icon: Crown,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-orange-500/20",
    features: [
      "200 clips per month",
      "4K export quality",
      "All caption styles",
      "All layout options",
      "Unlimited templates",
      "API access",
      "Dedicated support",
      "Team collaboration",
    ],
    clipsLimit: 200,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function SettingsSection() {
  const { user, setUser, setCurrentView } = useAppStore();

  // Profile state
  const [editName, setEditName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Danger zone state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSaveName = useCallback(async () => {
    if (!user?.id || !editName.trim()) return;
    setSavingName(true);
    setProfileError(null);
    setNameSaved(false);

    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name: editName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.user);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSavingName(false);
    }
  }, [user?.id, editName, setUser]);

  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const handleUpgrade = useCallback(async (planId: string) => {
    if (!user?.id) return;
    setUpgradingPlan(planId);
    setUpgradeSuccess(null);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upgrade plan");
      }
      setUser(data.user);
      setUpgradeSuccess(planId);
      setTimeout(() => setUpgradeSuccess(null), 3000);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to upgrade plan"
      );
    } finally {
      setUpgradingPlan(null);
    }
  }, [user?.id, setUser]);

  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    if (!user?.id) return;
    setDeletingAccount(true);
    try {
      const res = await fetch(`/api/auth/delete?userId=${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      // Clear local storage and reset state
      localStorage.removeItem("opus_user_id");
      setUser(null);
      setCurrentView("landing");
      setShowDeleteDialog(false);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setShowDeleteDialog(false);
    } finally {
      setDeletingAccount(false);
    }
  }, [user?.id, setUser, setCurrentView]);

  // ─── Computed values ─────────────────────────────────────────────────────

  const currentPlan = PLANS.find((p) => p.id === user?.plan) || PLANS[0];
  const clipsUsed = user?.clipsUsed ?? 0;
  const clipsLimit = user?.clipsLimit ?? 5;
  const clipsPercentage = Math.min(100, (clipsUsed / clipsLimit) * 100);
  const storageUsed = Math.min(100, clipsUsed * 3.2); // Simulated: ~3.2MB per clip
  const storageGB = (storageUsed / 100 * 2).toFixed(1); // Simulated 2GB max

  const planIcon =
    user?.plan === "business" ? (
      <Crown className="w-4 h-4 text-yellow-400" />
    ) : user?.plan === "pro" ? (
      <Zap className="w-4 h-4 text-purple-400" />
    ) : (
      <Eye className="w-4 h-4 text-white/50" />
    );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="min-h-screen bg-[#0a0a0f] relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
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
              <Settings className="w-6 h-6 text-pink-400" />
              Settings
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Manage your profile, subscription, and preferences
            </p>
          </div>
        </motion.div>

        {/* ─── Profile Section ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Profile</h2>
              <p className="text-xs text-white/40">Update your personal information</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Email Address</Label>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5">
                <Mail className="w-4 h-4 text-white/20 shrink-0" />
                <span className="text-sm text-white/50">
                  {user?.email || "No email"}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] bg-white/5 text-white/30 border-0 ml-auto"
                >
                  Read-only
                </Badge>
              </div>
            </div>

            {/* Name (editable) */}
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Display Name</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1 focus-within:border-pink-500/30 transition-colors">
                  <User className="w-4 h-4 text-white/20 shrink-0" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-transparent text-white/90 placeholder:text-white/25 outline-none text-sm py-1.5"
                    placeholder="Your name"
                  />
                </div>
                <Button
                  onClick={handleSaveName}
                  disabled={
                    savingName ||
                    !editName.trim() ||
                    editName.trim() === user?.name
                  }
                  className={`shrink-0 h-10 rounded-lg border-0 transition-all ${
                    nameSaved
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/20"
                      : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 disabled:opacity-50"
                  }`}
                >
                  {savingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : nameSaved ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Plan badge */}
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Current Plan</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5">
                  {planIcon}
                  <span className="text-sm font-medium text-white/70">
                    {currentPlan.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {profileError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {profileError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ─── Subscription Section ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">
                Subscription
              </h2>
              <p className="text-xs text-white/40">
                Choose the plan that fits your needs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => {
              const isCurrentPlan = user?.plan === plan.id;
              const PlanIcon = plan.icon;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                  className={`relative bg-white/[0.02] border rounded-xl p-5 transition-all ${
                    isCurrentPlan
                      ? "border-pink-500/30 bg-pink-500/[0.03]"
                      : "border-white/5 hover:border-white/10"
                  } ${plan.popular && !isCurrentPlan ? "border-purple-500/20" : ""}`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 text-[10px] px-2.5">
                        <Star className="w-2.5 h-2.5 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 text-[10px] px-2.5">
                        <Check className="w-2.5 h-2.5 mr-1" />
                        Current
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-4 pt-1">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-3`}
                    >
                      <PlanIcon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-2xl font-bold text-white/90">
                        {plan.price}
                      </span>
                      <span className="text-xs text-white/30">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-xs text-white/40 flex items-start gap-2"
                      >
                        <Check className="w-3 h-3 text-green-400/60 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Action button */}
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full h-9 text-xs rounded-lg bg-white/5 text-white/30 border-0 cursor-not-allowed"
                    >
                      Current Plan
                    </Button>
                  ) : upgradeSuccess === plan.id ? (
                    <Button
                      disabled
                      className="w-full h-9 text-xs rounded-lg bg-green-500/20 text-green-400 border-0 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Upgraded!
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgradingPlan !== null}
                      className={`w-full h-9 text-xs rounded-lg border-0 transition-all ${
                        plan.popular
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 disabled:opacity-50"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 disabled:opacity-50"
                      }`}
                    >
                      {upgradingPlan === plan.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {upgradingPlan === plan.id ? "Upgrading..." : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Usage Section ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Usage</h2>
              <p className="text-xs text-white/40">
                Track your resource consumption
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Clips Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/60">Clips Used</span>
                </div>
                <span className="text-sm font-semibold text-white/80 tabular-nums">
                  {clipsUsed}{" "}
                  <span className="text-white/30 font-normal">
                    / {clipsLimit}
                  </span>
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${clipsPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    clipsPercentage >= 90
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : clipsPercentage >= 70
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-pink-500 to-purple-500"
                  }`}
                />
              </div>
              <p className="text-xs text-white/25">
                {clipsLimit - clipsUsed} clips remaining this month
              </p>
            </div>

            {/* Storage Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/60">Storage Used</span>
                </div>
                <span className="text-sm font-semibold text-white/80 tabular-nums">
                  {storageGB} GB{" "}
                  <span className="text-white/30 font-normal">/ 2 GB</span>
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, storageUsed)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    storageUsed >= 90
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : storageUsed >= 70
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}
                />
              </div>
              <p className="text-xs text-white/25">
                {(2 - parseFloat(storageGB)).toFixed(1)} GB available
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Danger Zone ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/[0.02] border border-red-500/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">
                Danger Zone
              </h2>
              <p className="text-xs text-white/40">
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-500/[0.03] border border-red-500/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-400/60 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white/70">
                  Delete Account
                </h4>
                <p className="text-xs text-white/30 mt-0.5">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="shrink-0 h-9 text-xs bg-red-500/80 hover:bg-red-600 text-white border-0 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#12121a] border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white/90 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Delete Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-white/40">
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers,
                    including videos, clips, and templates.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500/80 hover:bg-red-600 text-white border-0 disabled:opacity-50"
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Delete Account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </section>
  );
}
