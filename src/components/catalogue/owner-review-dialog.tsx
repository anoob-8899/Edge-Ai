"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { ApprovalStatusType, SunglassModelItem } from "@/lib/types";

interface OwnerReviewDialogProps {
  model: SunglassModelItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedModel: SunglassModelItem) => void;
  currentUserRole?: string | null;
}

export function OwnerReviewDialog({
  model,
  isOpen,
  onClose,
  onSuccess,
  currentUserRole,
}: OwnerReviewDialogProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<ApprovalStatusType>(model.approvalStatus);
  const [reviewNotes, setReviewNotes] = React.useState<string>(model.reviewNotes || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedStatus(model.approvalStatus);
    setReviewNotes(model.reviewNotes || "");
    setErrorMsg(null);
  }, [model, isOpen]);

  const roleUpper = currentUserRole?.toUpperCase();
  const isOwner = roleUpper === "OWNER" || roleUpper === "ADMIN";

  const handleSubmit = async () => {
    if (!isOwner) {
      setErrorMsg("Owner permissions required to submit approval sign-off. Please sign in as Owner.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/catalogue/models/${model.slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus: selectedStatus,
          reviewNotes: reviewNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update review status");
      }

      onSuccess(data.model);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Owner Review & Approval Sign-off"
      description={`${model.brand.name} • ${model.officialProductName} (${model.modelCode})`}
      className="max-w-md"
    >
      <div className="space-y-4 py-2">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isOwner && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <p className="font-semibold">Staff Observer Mode</p>
            <p className="mt-0.5">
              Only Practice Owners and Lab Managers can formally approve or reject catalogue models.
            </p>
          </div>
        )}

        {/* Status Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#172B4D] block">
            Approval Decision
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedStatus("APPROVED")}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedStatus === "APPROVED"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                  : "bg-white border-[#DCE8F5] text-[#65758B] hover:bg-[#F8FBFF]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("PENDING_REVIEW")}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedStatus === "PENDING_REVIEW"
                  ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200"
                  : "bg-white border-[#DCE8F5] text-[#65758B] hover:bg-[#F8FBFF]"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Hold Review</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("REJECTED")}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                selectedStatus === "REJECTED"
                  ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200"
                  : "bg-white border-[#DCE8F5] text-[#65758B] hover:bg-[#F8FBFF]"
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject</span>
            </button>
          </div>
        </div>

        {/* Review Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#172B4D] block">
            Owner Dispensing & Educational Feedback Notes
          </label>
          <textarea
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="e.g. Verified with Luxottica spec sheet. Approved for staff progressive lens dispensing training..."
            className="w-full rounded-xl border border-[#DCE8F5] p-3 text-xs text-[#172B4D] focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] outline-hidden resize-none"
            disabled={!isOwner}
          />
        </div>

        {/* Verification Audit Summary */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] space-y-1">
          <div className="flex items-center justify-between text-[#65758B]">
            <span>Verification Status:</span>
            <span className="font-semibold text-[#172B4D]">{model.verificationStatus}</span>
          </div>
          <div className="flex items-center justify-between text-[#65758B]">
            <span>Current Sign-off:</span>
            <span className="font-semibold text-[#172B4D]">
              {model.approvedBy ? `${model.approvedBy} (${model.approvalStatus})` : "None"}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || !isOwner}
          className="bg-[#4285F4] hover:bg-[#2A56C6] text-white flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Save Decision</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
