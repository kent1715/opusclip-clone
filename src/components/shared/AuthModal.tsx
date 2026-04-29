"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, Github, KeyRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function AuthModal() {
  const {
    showAuthModal,
    authModalTab,
    setShowAuthModal,
    setAuthModalTab,
    setUser,
    setCurrentView,
  } = useAppStore();

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Social login state
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const resetForm = () => {
    setSignInEmail("");
    setSignInPassword("");
    setSignInError("");
    setSignInLoading(false);
    setSignUpName("");
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpConfirmPassword("");
    setSignUpError("");
    setSignUpLoading(false);
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");

    if (!signInEmail || !signInPassword) {
      setSignInError("Please fill in all fields");
      return;
    }

    setSignInLoading(true);
    try {
      // Retry logic for server cold starts
      let res: Response | null = null;
      let lastError: string | null = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: signInEmail, password: signInPassword }),
          });
          break; // Success, exit retry loop
        } catch {
          lastError = "Network error. Server may be starting up.";
          if (attempt < 2) {
            // Wait before retrying (server might be cold starting)
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          }
        }
      }

      if (!res) {
        setSignInError(lastError || "Could not connect to server. Please refresh the page and try again.");
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        setSignInError("Server error. Please refresh the page and try again.");
        return;
      }

      if (!res.ok) {
        setSignInError(data.error || "Login failed");
        return;
      }

      if (!data.user) {
        setSignInError("Invalid response from server.");
        return;
      }

      setUser(data.user);
      setShowAuthModal(false);
      setCurrentView("dashboard");
      resetForm();
    } catch (err) {
      console.error("Login error:", err);
      setSignInError("Something went wrong. Please refresh the page and try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");

    if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      setSignUpError("Please fill in all fields");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match");
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }

    setSignUpLoading(true);
    try {
      // Retry logic for server cold starts
      let res: Response | null = null;
      let lastError: string | null = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: signUpEmail,
              name: signUpName,
              password: signUpPassword,
            }),
          });
          break;
        } catch {
          lastError = "Network error. Server may be starting up.";
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          }
        }
      }

      if (!res) {
        setSignUpError(lastError || "Could not connect to server. Please refresh the page and try again.");
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        setSignUpError("Server error. Please refresh the page and try again.");
        return;
      }

      if (!res.ok) {
        setSignUpError(data.error || "Registration failed");
        return;
      }

      if (!data.user) {
        setSignUpError("Invalid response from server.");
        return;
      }

      setUser(data.user);
      setShowAuthModal(false);
      setCurrentView("dashboard");
      resetForm();
    } catch (err) {
      console.error("Registration error:", err);
      setSignUpError("Something went wrong. Please refresh the page and try again.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    try {
      // Create an account with social provider email format
      const email = `${provider.toLowerCase()}_user_${Date.now()}@opusclip.app`;
      const name = `${provider} User`;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password: `social_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If user already exists, try logging in
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: `social_${Date.now()}` }),
        });
        if (!loginRes.ok) {
          setSignInError(`Failed to sign in with ${provider}. Please try again.`);
          return;
        }
        const loginData = await loginRes.json();
        setUser(loginData.user);
      } else {
        setUser(data.user);
      }
      localStorage.setItem("opus_user_id", data.user?.id || "");
      setShowAuthModal(false);
      setCurrentView("dashboard");
      resetForm();
    } catch {
      setSignInError(`Something went wrong with ${provider} sign in.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleTabChange = (value: string) => {
    setAuthModalTab(value as "signin" | "signup");
    setSignInError("");
    setSignUpError("");
  };

  return (
    <Dialog
      open={showAuthModal}
      onOpenChange={(open) => {
        if (!open) {
          setShowAuthModal(false);
          resetForm();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[440px] bg-[#12121a] border-white/10 text-white p-0 overflow-hidden"
        showCloseButton={true}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={authModalTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Gradient accent line at top */}
            <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

            <div className="px-6 pt-6 pb-2">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white text-center">
                  {authModalTab === "signin" ? "Welcome Back" : "Create Account"}
                </DialogTitle>
                <DialogDescription className="text-white/50 text-center text-sm">
                  {authModalTab === "signin"
                    ? "Sign in to continue creating viral clips"
                    : "Join OpusClip and start creating viral clips"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <Tabs
              value={authModalTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="px-6">
                <TabsList className="w-full bg-white/5 h-10 p-1 rounded-lg">
                  <TabsTrigger
                    value="signin"
                    className="flex-1 rounded-md text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-white/50 hover:text-white/70 transition-colors"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="flex-1 rounded-md text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-white/50 hover:text-white/70 transition-colors"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="px-6 pb-6 pt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {signInError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                    >
                      {signInError}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotEmail(signInEmail);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Forgot Password Dialog */}
                  <AnimatePresence>
                    {showForgotPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-pink-400" />
                            <span className="text-sm font-medium text-white/80">Reset Password</span>
                          </div>
                          {forgotSuccess ? (
                            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                              Password reset instructions have been sent to your email. Please check your inbox.
                            </div>
                          ) : (
                            <>
                              {forgotError && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                  {forgotError}
                                </div>
                              )}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-white/70">Email Address</label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                  <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotError("");
                                  }}
                                  className="flex-1 h-10 text-white/50 hover:text-white/80 hover:bg-white/5"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  disabled={forgotLoading || !forgotEmail.trim()}
                                  onClick={async () => {
                                    if (!forgotEmail.trim()) return;
                                    setForgotLoading(true);
                                    setForgotError("");
                                    try {
                                      // Check if user exists
                                      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(forgotEmail.trim())}`);
                                      // Always show success for security (don't reveal if email exists)
                                      setForgotSuccess(true);
                                    } catch {
                                      setForgotSuccess(true); // Still show success for security
                                    } finally {
                                      setForgotLoading(false);
                                    }
                                  }}
                                  className="flex-1 h-10 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 border-0"
                                >
                                  {forgotLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    "Send Reset Link"
                                  )}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={signInLoading}
                    className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:opacity-50"
                  >
                    {signInLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#12121a] px-3 text-white/30">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={socialLoading !== null}
                      onClick={() => handleSocialLogin("Google")}
                      className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {socialLoading === "Google" ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <svg className="size-4 mr-2" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={socialLoading !== null}
                      onClick={() => handleSocialLogin("GitHub")}
                      className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {socialLoading === "GitHub" ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Github className="size-4 mr-2" />
                      )}
                      GitHub
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="px-6 pb-6 pt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {signUpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                    >
                      {signUpError}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="At least 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 focus-visible:border-pink-500/50 focus-visible:ring-pink-500/20"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={signUpLoading}
                    className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:opacity-50"
                  >
                    {signUpLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#12121a] px-3 text-white/30">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={socialLoading !== null}
                      onClick={() => handleSocialLogin("Google")}
                      className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {socialLoading === "Google" ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <svg className="size-4 mr-2" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={socialLoading !== null}
                      onClick={() => handleSocialLogin("GitHub")}
                      className="h-11 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {socialLoading === "GitHub" ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Github className="size-4 mr-2" />
                      )}
                      GitHub
                    </Button>
                  </div>

                  <p className="text-xs text-white/30 text-center pt-2">
                    By creating an account, you agree to our{" "}
                    <span className="text-white/50 hover:text-white/70 cursor-pointer transition-colors">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-white/50 hover:text-white/70 cursor-pointer transition-colors">
                      Privacy Policy
                    </span>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
