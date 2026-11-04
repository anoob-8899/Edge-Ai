"use client";

import * as React from "react";
import Link from "next/link";
import {
  Glasses,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-context";

export default function SignInPage() {
  const { signIn, user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [clinicId, setClinicId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Bootstrap owner modal state
  const [isBootstrapOpen, setIsBootstrapOpen] = React.useState(false);
  const [bootstrapEmail, setBootstrapEmail] = React.useState("");
  const [bootstrapName, setBootstrapName] = React.useState("");
  const [bootstrapPassword, setBootstrapPassword] = React.useState("");
  const [bootstrapLoading, setBootstrapLoading] = React.useState(false);
  const [bootstrapError, setBootstrapError] = React.useState<string | null>(null);
  const [bootstrapSuccess, setBootstrapSuccess] = React.useState<string | null>(null);

  const handleQuickLogin = async (role: "staff" | "owner" | "ksenia") => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          role === "owner"
            ? { demoRole: "owner" }
            : role === "ksenia"
            ? { email: "ksenia@apexoptics.com", password: "Password123!" }
            : { demoRole: "staff" }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      window.location.href = role === "owner" ? "/owner" : "/staff";
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await signIn(email, password, clinicId);
    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const handleBootstrapOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapLoading(true);
    setBootstrapError(null);
    setBootstrapSuccess(null);

    try {
      const res = await fetch("/api/auth/bootstrap-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: bootstrapEmail,
          name: bootstrapName,
          password: bootstrapPassword,
          clinicId: clinicId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.details ? data.details[0] : "Initialization failed"));
      }

      setBootstrapSuccess("Practice owner account created successfully! Signing in...");
      setTimeout(() => {
        window.location.href = "/owner";
      }, 1000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setBootstrapError(e.message || "Failed to initialize owner account.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#DCEEFF]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FFD95E]/20 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Navigation back to homepage */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737D8B] hover:text-[#20242B] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Return to OptiTrain.ai Home</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[16px] bg-[#242629] text-white shadow-xs mb-3">
            <Glasses className="h-6 w-6 text-[#FFD95E]" />
          </div>
          <h1 className="text-2xl font-bold text-[#20242B] tracking-tight">
            OptiTrain<span className="text-[#9CCBFF]">.ai</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#737D8B] mt-1 font-normal">
            AI Optical Staff Training & Performance Platform
          </p>
        </div>

        {/* Already Logged In Banner */}
        {user && (
          <div className="mb-4 p-3.5 rounded-[16px] bg-white border border-[#E3E9EF] text-xs text-[#20242B] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#225414]" />
              <span>
                Signed in as <strong className="font-semibold">{user.name}</strong> ({user.role})
              </span>
            </div>
            <Link
              href={user.role === "OWNER" ? "/owner" : "/staff"}
              className="font-bold text-[#20242B] hover:underline"
            >
              Go to Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-[16px] bg-[#FCE4E4] border border-[#F5C2C7] text-xs text-[#962222] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#962222]" />
            <div>
              <p className="font-semibold">Sign In Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sign In Card */}
        <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#20242B]">Staff & Practice Access</h2>
              <Badge variant="secondary" size="sm" isMono>
                SECURE AUTH
              </Badge>
            </div>
            <p className="text-xs text-[#737D8B]">
              Enter your optical practice credentials to sign in
            </p>
          </div>

          <div>
            {/* Interactive Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#20242B] mb-1">
                  Practice Domain / Clinic ID (Optional)
                </label>
                <Input
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  placeholder="e.g. apex-optics"
                  icon={<Building2 className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20242B] mb-1">
                  Staff Email or Username
                </label>
                <Input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abhi, staff@apexoptics.com, or owner@apexoptics.com"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#20242B]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBootstrapOpen(true)}
                    className="text-[11px] text-[#20242B] hover:underline font-medium"
                  >
                    Initialize Owner Account?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  icon={<Lock className="h-4 w-4" />}
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="yellow"
                  size="md"
                  pill
                  className="w-full shadow-xs font-bold"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "Verifying Credentials..." : "Sign In to Platform"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Instant One-Click Demo Access */}
              <div className="pt-4 border-t border-[#E3E9EF]">
                <p className="text-[11px] font-semibold text-[#737D8B] text-center mb-2 uppercase tracking-wider">
                  Instant Test & Demo Accounts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("staff")}
                    disabled={isLoading}
                    className="flex items-center justify-between p-2.5 rounded-[14px] bg-[#EEF3F7] hover:bg-[#DCEEFF] text-left transition-colors border border-[#E3E9EF]"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#20242B] truncate">Alex Chen (Abhi)</div>
                      <div className="text-[10px] text-[#737D8B]">Staff Dispenser</div>
                    </div>
                    <UserCheck className="h-4 w-4 text-[#20242B] shrink-0 ml-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("owner")}
                    disabled={isLoading}
                    className="flex items-center justify-between p-2.5 rounded-[14px] bg-[#242629] hover:bg-[#33383F] text-left transition-colors shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Dr. Marcus Vance</div>
                      <div className="text-[10px] text-[#FFD95E]">Practice Owner</div>
                    </div>
                    <ShieldCheck className="h-4 w-4 text-[#FFD95E] shrink-0 ml-1" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Security / Compliance Notice Footer */}
        <div className="mt-6 text-center text-xs text-[#737D8B] space-y-1">
          <p>OptiTrain.ai • Optical Retail Staff Training Platform</p>
          <p>Role-based access control with secure cryptographic session tokens.</p>
        </div>
      </div>

      {/* Initial Owner Bootstrap Dialog Modal */}
      <Dialog
        open={isBootstrapOpen}
        onOpenChange={setIsBootstrapOpen}
        title="Initialize Practice Owner Account"
        description="Provision the first owner account for this optical practice. This method is protected by a safety lock and can only be performed once."
      >
        <form onSubmit={handleBootstrapOwner} className="space-y-3">
          {bootstrapError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C83F4F]">
              {bootstrapError}
            </div>
          )}

          {bootstrapSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#16865C]">
              {bootstrapSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Owner Full Name & Title
            </label>
            <Input
              required
              value={bootstrapName}
              onChange={(e) => setBootstrapName(e.target.value)}
              placeholder="e.g. Dr. Sarah Lin, OD"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Owner Email Address
            </label>
            <Input
              type="email"
              required
              value={bootstrapEmail}
              onChange={(e) => setBootstrapEmail(e.target.value)}
              placeholder="owner@optical-practice.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Strong Master Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <Input
              type="password"
              required
              value={bootstrapPassword}
              onChange={(e) => setBootstrapPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBootstrapOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={bootstrapLoading}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{bootstrapLoading ? "Creating Owner..." : "Provision Owner"}</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
