"use client";

import * as React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { VerificationStatusType, ApprovalStatusType } from "@/lib/types";


interface VerificationBadgeProps {
  status: VerificationStatusType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function VerificationBadge({ status, size = "md", showLabel = true }: VerificationBadgeProps) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
        <ShieldCheck className={size === "sm" ? "w-3.5 h-3.5 text-emerald-600" : "w-4 h-4 text-emerald-600"} />
        {showLabel && <span>Verified Specs</span>}
      </span>
    );
  }

  if (status === "PARTIALLY_VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
        <ShieldAlert className={size === "sm" ? "w-3.5 h-3.5 text-amber-600" : "w-4 h-4 text-amber-600"} />
        {showLabel && <span>Incomplete Specs</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <AlertTriangle className={size === "sm" ? "w-3.5 h-3.5 text-slate-500" : "w-4 h-4 text-slate-500"} />
      {showLabel && <span>Unverified</span>}
    </span>
  );
}

interface ApprovalBadgeProps {
  status: ApprovalStatusType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ApprovalBadge({ status, size = "md", showLabel = true }: ApprovalBadgeProps) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1E40AF] border border-blue-200">
        <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />
        {showLabel && <span>Owner Approved</span>}
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        {showLabel && <span>Review Rejected</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3 text-amber-600" />
      {showLabel && <span>Pending Review</span>}
    </span>
  );
}
