"use client";

import * as React from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Quote,
  Sparkles,
  Target,
  ShieldAlert,
  X,
  MessageSquare,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionAssessment, CriterionResult } from "@/lib/opticoach/assessment";

interface AssessmentReportModalProps {
  open: boolean;
  onClose: () => void;
  assessment: SessionAssessment | any;
  scenarioTitle?: string;
  scenarioCategory?: string;
  practitionerName?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AssessmentReportModal({
  open,
  onClose,
  assessment,
  scenarioTitle,
  scenarioCategory,
  practitionerName,
  onRetry,
  isRetrying = false,
}: AssessmentReportModalProps) {
  if (!open || !assessment) return null;

  // Support backwards compatibility if older format is stored
  const criteria: CriterionResult[] = Array.isArray(assessment.criteria)
    ? assessment.criteria
    : [];

  const overallScore = typeof assessment.overallScore === "number" ? assessment.overallScore : 0;
  const rubricGrade = assessment.rubricGrade || (overallScore >= 85 ? "Exemplary Mastery" : overallScore >= 70 ? "Competency Demonstrated" : "Practice Recommended");

  const getRubricBadgeVariant = (level: string) => {
    switch (level?.toLowerCase()) {
      case "exemplary":
      case "exemplary mastery":
        return "success";
      case "proficient":
      case "competency demonstrated":
        return "primary";
      case "developing":
      case "practice recommended":
        return "warning";
      case "unsatisfactory":
      case "incomplete session":
      default:
        return "neutral";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-[#DCE8F5] shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-[#DCE8F5] bg-gradient-to-r from-[#F8FBFF] to-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E8F3FF] to-[#D0E5FF] border border-[#B8D9FF] flex items-center justify-center text-[#2A56C6] shadow-xs">
              <Award className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#172B4D]">
                  Clinical Dispensing Assessment
                </h2>
                <Badge variant={getRubricBadgeVariant(rubricGrade)} size="sm" isMono>
                  {rubricGrade.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-[#65758B] mt-0.5">
                Scenario: <span className="font-semibold text-[#172B4D]">{scenarioTitle || "AI Sales Consultation"}</span>
                {scenarioCategory && ` • Category: ${scenarioCategory}`}
                {practitionerName && ` • Practitioner: ${practitionerName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8796AA] hover:text-[#172B4D] hover:bg-[#F0F7FF] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* OVERALL SCORE & RUBRIC GRADE BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0F7FF] via-[#E8F3FF] to-white border border-[#B8D9FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="text-[11px] font-mono uppercase text-[#65758B] tracking-wide">
                Comprehensive Evaluation Score
              </div>
              <div className="text-3xl font-black text-[#172B4D] mt-0.5">
                {overallScore}
                <span className="text-base text-[#65758B] font-normal"> / 100</span>
              </div>
              <div className="text-[11px] text-[#65758B] mt-1 flex items-center gap-2">
                <span>Evaluated against 6 optical retail competencies</span>
                {assessment.staffTurnCount !== undefined && (
                  <>
                    <span>•</span>
                    <span>{assessment.staffTurnCount} staff dialogue turn{assessment.staffTurnCount === 1 ? "" : "s"}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <Badge variant={getRubricBadgeVariant(rubricGrade)} size="md" isMono className="px-3 py-1 text-xs">
                {rubricGrade.toUpperCase()}
              </Badge>
              <span className="text-[10px] text-[#8796AA] font-mono">
                {assessment.generatedAt ? new Date(assessment.generatedAt).toLocaleString() : "Real-time Evaluation"}
              </span>
            </div>
          </div>

          {/* DISTINCTION: EVIDENCE VS SUBJECTIVE AI JUDGMENT */}
          <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#B8D9FF]/70 text-[#172B4D] flex items-start gap-3">
            <div className="p-1 rounded-lg bg-[#4285F4]/10 text-[#4285F4] shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-[11px] text-[#172B4D] flex items-center gap-2">
                <span>Evidence-Based Findings vs. Subjective AI Judgments</span>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                <strong className="text-[#2A56C6]">Observed Evidence</strong> is drawn verbatim from the recorded dialogue transcript.
                Scores, rubric rankings, and suggestions represent <strong className="text-[#4285F4]">subjective AI coaching evaluations</strong> intended for deliberative practice, not infallible clinical grades.
              </p>
            </div>
          </div>

          {/* EXECUTIVE COACH SUMMARY */}
          {assessment.summary && (
            <div className="space-y-1.5">
              <span className="font-bold text-[#172B4D] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-[#4285F4]" />
                Executive Coach Summary
              </span>
              <p className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5] text-[#334155] leading-relaxed">
                {assessment.summary}
              </p>
            </div>
          )}

          {/* STRENGTHS & OPPORTUNITIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
              <span className="font-bold text-[#166534] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#16865C]" />
                Demonstrated Strengths
              </span>
              <ul className="space-y-1.5 text-[#14532D]">
                {assessment.strengths?.map((str: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#16865C] font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
              <span className="font-bold text-[#92400E] flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-[#D97706]" />
                Opportunities to Improve
              </span>
              <ul className="space-y-1.5 text-[#78350F]">
                {assessment.areasForImprovement?.map((area: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#D97706] font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6 CRITERIA DETAILED CARDS */}
          {criteria.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE8F5] pb-2">
                <span className="font-bold text-[#172B4D] uppercase text-[11px] tracking-wider">
                  Detailed Criteria Breakdown (6 Standards)
                </span>
                <span className="text-[11px] text-[#8796AA]">
                  Scored using 4-tier objective rubrics
                </span>
              </div>

              <div className="space-y-3.5">
                {criteria.map((item, idx) => (
                  <div
                    key={item.criterionId || idx}
                    className="p-4 rounded-xl bg-white border border-[#DCE8F5] shadow-xs space-y-3 hover:border-[#B8D9FF] transition-all"
                  >
                    {/* Criterion Title Bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#172B4D] text-sm">
                          {idx + 1}. {item.criterionName}
                        </div>
                        <p className="text-[11px] text-[#65758B] mt-0.5">
                          {item.rubricDescriptor}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-sm text-[#172B4D]">
                          {item.score}%
                        </span>
                        <Badge variant={getRubricBadgeVariant(item.rubricLevel)} size="sm" isMono>
                          {item.rubricLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-[#E8F3FF] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          item.score >= 85
                            ? "bg-[#16865C]"
                            : item.score >= 70
                            ? "bg-[#4285F4]"
                            : item.score >= 60
                            ? "bg-[#D97706]"
                            : "bg-[#C83F4F]"
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>

                    {/* Dialogue Evidence Section (Distinguished from AI judgment) */}
                    <div className="p-3 rounded-lg bg-[#F8FBFF] border border-[#DCE8F5] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono uppercase text-[10px] text-[#2A56C6] font-semibold flex items-center gap-1">
                          <Quote className="h-3 w-3" />
                          Observed Conversation Evidence
                        </span>
                        <Badge
                          variant={item.isEvidenceObserved ? "primary" : "neutral"}
                          size="sm"
                          isMono
                          className="text-[9px] py-0 px-1.5"
                        >
                          {item.isEvidenceObserved ? "VERIFIED TRANSCRIPT QUOTE" : "ABSENCE NOTED"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#334155] italic font-sans leading-relaxed">
                        &ldquo;{item.evidence}&rdquo;
                      </p>
                    </div>

                    {/* What Went Well & What Could Improve */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#F0FDF4]/70 border border-[#BBF7D0]/60 space-y-0.5">
                        <span className="font-semibold text-[#166534] flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 text-[#16865C]" />
                          What Went Well
                        </span>
                        <p className="text-[#14532D] leading-relaxed">{item.whatWentWell}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FFFBEB]/70 border border-[#FDE68A]/60 space-y-0.5">
                        <span className="font-semibold text-[#92400E] flex items-center gap-1 text-[10px]">
                          <AlertCircle className="h-3 w-3 text-[#D97706]" />
                          What Could Improve
                        </span>
                        <p className="text-[#78350F] leading-relaxed">{item.whatCouldImprove}</p>
                      </div>
                    </div>

                    {/* Suggested Alternative Response */}
                    {item.suggestedAlternativeResponse && (
                      <div className="p-3 rounded-lg bg-white border border-[#B8D9FF] space-y-1">
                        <span className="font-semibold text-[#2A56C6] text-[10px] uppercase tracking-wide flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Suggested Alternative Response
                        </span>
                        <p className="text-[11px] text-[#172B4D] font-medium leading-relaxed bg-[#F0F7FF] p-2 rounded-md">
                          {item.suggestedAlternativeResponse}
                        </p>
                      </div>
                    )}

                    {/* Recommended Follow-up Exercise */}
                    {item.recommendedFollowUpExercise && (
                      <div className="flex items-center gap-2 text-[11px] text-[#475569] pt-1 border-t border-[#F0F7FF]">
                        <Target className="h-3.5 w-3.5 text-[#4285F4] shrink-0" />
                        <span>
                          <strong className="text-[#172B4D]">Recommended Practice: </strong>
                          {item.recommendedFollowUpExercise}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANDATORY DISCLAIMERS & ETHICAL SAFEGUARDS */}
          <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5] space-y-2 text-[#65758B]">
            <div className="flex items-center gap-2 font-bold text-xs text-[#172B4D]">
              <ShieldAlert className="h-4 w-4 text-[#D97706]" />
              <span>Assessment Disclaimers & Employment Safeguards</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-[#475569]">
              <li>
                • <strong className="text-[#172B4D]">Heuristic AI Evaluation:</strong> Simulated conversation scores are computed by an automated AI coach. They reflect structured optical rubrics and recorded dialogue but are not an infallible or perfectly objective clinical measurement.
              </li>
              <li>
                • <strong className="text-[#172B4D]">Employment Decision Prohibition:</strong> Automated scores must <span className="underline font-semibold">NEVER</span> serve as the sole or decisive basis for employment decisions, including hiring, termination, performance reviews, compensation, or disciplinary actions.
              </li>
              <li>
                • <strong className="text-[#172B4D]">Factual Evidence Integrity:</strong> All quoted evidence reflects actual utterances recorded in the session. Evaluators never manufacture or simulate fictitious evidence.
              </li>
            </ul>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-[#DCE8F5] bg-[#F8FBFF] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#8796AA]">
            Persisted in PostgreSQL database with criterion-level telemetry
          </div>

          <div className="flex items-center gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
                <span>{isRetrying ? "Retrying..." : "Regenerate Assessment"}</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              <span>Close Review</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
