"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Glasses,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
  History,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  TrendingUp,
  X,
  Target,
  Mic,
  ArrowUpRight,
  Search,
  Plus,
  Award,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OPTICAL_SCENARIOS, OptiCoachScenario } from "@/lib/opticoach/scenarios";
import { ContextualProductCard } from "@/lib/opticoach/rag";
import { AssessmentReportModal } from "@/components/opticoach/assessment-report-modal";
import { SessionAssessment } from "@/lib/opticoach/assessment";
import { useAuth } from "@/components/auth/auth-context";

interface MessageItem {
  id: string;
  role: "customer" | "staff" | "system";
  content: string;
  metadata?: string | null;
  createdAt: string;
}

interface SessionData {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  skillsPracticed: string;
  score?: number | null;
  feedbackSummary?: string | null;
  durationSeconds: number;
  startedAt: string;
  completedAt?: string | null;
  messages: MessageItem[];
}

export default function OptiCoachPage() {
  const { user } = useAuth();
  const [scenarios] = React.useState<OptiCoachScenario[]>(OPTICAL_SCENARIOS);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = React.useState(0);
  const [currentSession, setCurrentSession] = React.useState<SessionData | null>(null);
  const [contextualProducts, setContextualProducts] = React.useState<ContextualProductCard[]>([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isEnding, setIsEnding] = React.useState(false);
  const [reviewReport, setReviewReport] = React.useState<SessionAssessment | any | null>(null);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [pastSessions, setPastSessions] = React.useState<any[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [expandedCoachingNote, setExpandedCoachingNote] = React.useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = React.useState("");

  const scenario = scenarios[selectedScenarioIndex] || OPTICAL_SCENARIOS[0];
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isLoading]);

  const startSession = React.useCallback(async (scenarioToStart: OptiCoachScenario) => {
    setIsInitializing(true);
    setErrorMessage(null);
    setReviewReport(null);
    try {
      const res = await fetch("/api/opticoach/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenarioToStart.id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initialize practice session");
      }

      const data = await res.json();
      setCurrentSession(data.session);
      if (data.contextualProducts) {
        setContextualProducts(data.contextualProducts);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error("Start session error:", e);
      setErrorMessage(e.message || "Failed to start AI coaching simulation");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  React.useEffect(() => {
    startSession(scenarios[0]);
  }, [scenarios, startSession]);

  const loadSessionHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/opticoach/sessions");
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load session history:", err);
    }
  }, []);

  React.useEffect(() => {
    loadSessionHistory();
  }, [loadSessionHistory]);

  const handleSelectScenario = (index: number) => {
    if (index === selectedScenarioIndex && currentSession?.status === "ACTIVE") return;
    setSelectedScenarioIndex(index);
    startSession(scenarios[index]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading || currentSession.status !== "ACTIVE") {
      return;
    }

    const userText = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);
    setErrorMessage(null);

    const tempStaffMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      role: "staff",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    setCurrentSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...(prev.messages || []), tempStaffMsg],
      };
    });

    try {
      const res = await fetch(`/api/opticoach/sessions/${currentSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText, message: userText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to deliver consultation response");
      }

      const data = await res.json();
      if (data.session) {
        setCurrentSession(data.session);
      } else if (data.customerMessage) {
        setCurrentSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...(prev.messages || []), data.customerMessage],
          };
        });
      }
      if (data.contextualProducts) {
        setContextualProducts(data.contextualProducts);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error("Send message error:", e);
      setErrorMessage(e.message || "Gemini AI response failed. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSessionAndReview = async () => {
    if (!currentSession) return;
    setIsEnding(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/opticoach/sessions/${currentSession.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate evaluation scorecard");
      }

      setCurrentSession(data.session);
      if (data.review) {
        setReviewReport(data.review);
        setShowReviewModal(true);
      }
      loadSessionHistory();
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error("End session error:", e);
      setErrorMessage(e.message || "Failed to complete evaluation review");
    } finally {
      setIsEnding(false);
    }
  };

  const filteredScenarios = scenarios.filter((s) =>
    s.title.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    s.patientPersona.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <AppShell
      title="OptiCoach AI Simulation Arena"
      subtitle="Interactive retail consultation roleplay & clinical objection handling"
    >
      {/* Outer App Window (Faithful to Reference 4 "Qubi" Architecture: Rounded-3xl Split Window) */}
      <div className="rounded-[32px] border border-[#E6E4DD] bg-white shadow-md overflow-hidden flex flex-col lg:flex-row min-h-[760px] max-h-[880px]">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: DARK CHARCOAL NAVIGATION & SCENARIOS (Reference 4) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-80 bg-[#1E2023] text-white flex flex-col justify-between border-r border-[#2C2E33] shrink-0 p-5 space-y-4">
          <div className="space-y-4">
            {/* Top Logo / New Session Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#292929] border border-white/10 flex items-center justify-center text-[#FFD95E]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-white">OptiCoach AI</span>
              </div>

              <button
                type="button"
                onClick={() => startSession(scenario)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                title="Start a fresh consultation simulation"
              >
                <Plus className="h-3 w-3" />
                <span>New</span>
              </button>
            </div>

            {/* Search Input in Dark Sidebar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scenarios..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-full bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:border-[#FFD95E] focus:outline-none transition-all"
              />
            </div>

            {/* Scenario Categories List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                Consultation Scenarios ({filteredScenarios.length})
              </span>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {filteredScenarios.map((sc) => {
                  const scIdx = scenarios.findIndex((s) => s.id === sc.id);
                  const isSelected = scIdx === selectedScenarioIndex;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScenario(scIdx)}
                      className={`w-full text-left p-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between gap-2 text-xs ${
                        isSelected
                          ? "bg-white/15 text-white font-semibold shadow-xs"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <div className="truncate leading-tight">{sc.title}</div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          {sc.patientPersona.name} • {sc.category}
                        </div>
                      </div>
                      <ChevronRight className={`h-3 w-3 shrink-0 ${isSelected ? "text-[#FFD95E]" : "text-gray-500"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Past Evaluations Section */}
            {pastSessions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Recent Scorecards
                  </span>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-[10px] text-[#FFD95E] hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {pastSessions.slice(0, 3).map((sess) => (
                    <div
                      key={sess.id}
                      className="p-2 rounded-xl bg-white/5 flex items-center justify-between text-xs text-gray-300"
                    >
                      <span className="truncate max-w-[140px] text-[11px]">{sess.scenarioTitle}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FFD95E] text-[#222222] font-bold text-[10px]">
                        {sess.score || 85}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Status Bar at bottom of sidebar */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8CE071]" />
              <span className="text-white font-medium">{user?.name || "Staff Optician"}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10">
              Active
            </span>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* RIGHT WORKSPACE: CONVERSATION ARENA WITH AMBIENT GLOW (Reference 4) */}
        {/* ========================================================================= */}
        <section className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#FAF8FF] via-white to-[#F5F2FC] relative min-w-0">
          {/* Top Workspace Header Bar */}
          <div className="px-6 py-4 border-b border-[#E6E4DD]/80 bg-white/80 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#292929] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {scenario.patientPersona.name.charAt(0)}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-[#222222] truncate">
                    {scenario.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5D5] text-[#255217]">
                    ● Live Simulation
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] truncate">
                  Simulated Customer: <strong className="text-[#222222]">{scenario.patientPersona.name}</strong> ({scenario.patientPersona.age} yrs) • {scenario.patientPersona.lifestyleNeed}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startSession(scenario)}
                disabled={isInitializing}
                className="w-8 h-8 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#737373] hover:text-[#222222] transition-colors"
                title="Restart scenario"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isInitializing ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleEndSessionAndReview}
                disabled={isEnding || (currentSession?.messages?.length || 0) < 2}
                className="px-3.5 py-1.5 rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] text-[#222222] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isEnding ? "Evaluating..." : "End & Review Score"}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="font-bold px-2">✕</button>
            </div>
          )}

          {/* Central Workspace Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
            {/* REFERENCE 4 AUTHENTIC CENTERED WELCOME STATE (When session is fresh) */}
            {(!currentSession?.messages || currentSession.messages.length <= 1) && !isInitializing && (
              <div className="py-8 text-center space-y-6 max-w-2xl mx-auto">
                {/* AI Emblem Icon (Reference 4 Flower / Radial Orb) */}
                <div className="mx-auto w-14 h-14 rounded-full bg-white border border-[#E6E4DD] shadow-sm flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFD95E] to-[#9CCBFF] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#292929]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
                    How can OptiCoach assist you today?
                  </h1>
                  <p className="text-xs md:text-sm text-[#737373] max-w-lg mx-auto leading-relaxed">
                    Get expert guidance powered by AI agents specializing in progressive lenses, luxury frame styling, high-index materials, and customer objection resolution.
                  </p>
                </div>

                {/* 4 Suggestion Cards in a Row / 2x2 Grid with Top-Right Diagonal Arrows (Reference 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                  <button
                    type="button"
                    onClick={() =>
                      setInputMessage("Good afternoon, I understand progressive lenses can require brief adaptation. Let me walk you through how our modern corridor designs eliminate swim effect.")
                    }
                    className="p-4 rounded-2xl bg-white border border-[#E6E4DD] hover:border-[#292929] hover:shadow-sm transition-all group flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#222222]">
                        Progressive Adaptation
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
                        Resolve customer hesitation regarding progressive corridor swim
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#737373] group-hover:text-[#222222] shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputMessage("I completely respect your budget considerations. Let me explain how our high-index 1.74 lenses reduce edge thickness and eye magnification significantly.")
                    }
                    className="p-4 rounded-2xl bg-white border border-[#E6E4DD] hover:border-[#292929] hover:shadow-sm transition-all group flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#222222]">
                        High-Index 1.74 Upsell
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
                        Demonstrate thin-and-light aesthetics and anti-reflective benefits
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#737373] group-hover:text-[#222222] shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputMessage("For your prescription, a lightweight titanium frame with an oval bridge will balance your facial contours comfortably.")
                    }
                    className="p-4 rounded-2xl bg-white border border-[#E6E4DD] hover:border-[#292929] hover:shadow-sm transition-all group flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#222222]">
                        Luxury Frame Styling
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
                        Pair facial anatomy with premium acetate & titanium collections
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#737373] group-hover:text-[#222222] shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputMessage("Could you describe your daily computer and driving visual demands so I can recommend the right coating?")
                    }
                    className="p-4 rounded-2xl bg-white border border-[#E6E4DD] hover:border-[#292929] hover:shadow-sm transition-all group flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#222222]">
                        Lifestyle Consultation
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">
                        Discover daily screen habits, UV exposure, and occupational needs
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#737373] group-hover:text-[#222222] shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Stream (When Messages are present) */}
            {currentSession?.messages && currentSession.messages.length > 0 && (
              <div className="max-w-2xl mx-auto space-y-4">
                {currentSession.messages.map((msg) => {
                  const isCustomer = msg.role === "customer";
                  const isStaff = msg.role === "staff";

                  let metadataObj: any = null;
                  if (msg.metadata) {
                    try {
                      metadataObj = JSON.parse(msg.metadata);
                    } catch {
                      metadataObj = null;
                    }
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"} space-y-1.5`}
                    >
                      <div className="flex items-center gap-1.5 px-2">
                        <span className="text-[11px] font-semibold text-[#737373]">
                          {isCustomer ? scenario.patientPersona.name : "You (Dispensing Optician)"}
                        </span>
                        {isCustomer && metadataObj?.customerMood && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#EAF5D5] text-[#255217]">
                            Mood: {metadataObj.customerMood}
                          </span>
                        )}
                      </div>

                      {/* Speech Bubble */}
                      <div
                        className={`rounded-[24px] p-4 text-xs md:text-sm leading-relaxed shadow-xs max-w-[85%] ${
                          isStaff
                            ? "bg-[#292929] text-white rounded-tr-sm"
                            : "bg-white border border-[#E6E4DD] text-[#222222] rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* OptiCoach Real-Time Feedback Whisper */}
                      {isCustomer && metadataObj?.coachingNotes && (
                        <div className="max-w-[85%] pl-2">
                          <button
                            onClick={() =>
                              setExpandedCoachingNote((prev) => (prev === msg.id ? null : msg.id))
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#222222] hover:text-[#737373]"
                          >
                            <Sparkles className="h-3 w-3 text-[#FFD95E]" />
                            <span>AI Coach Whisper</span>
                            {expandedCoachingNote === msg.id ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {expandedCoachingNote === msg.id && (
                            <div className="mt-1.5 p-3 rounded-2xl bg-[#FFF9E6] border border-[#FFD95E] text-xs text-[#222222]">
                              <p className="leading-relaxed">{metadataObj.coachingNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#737373] p-3">
                    <div className="w-2 h-2 rounded-full bg-[#292929] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#292929] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#292929] animate-bounce [animation-delay:0.4s]" />
                    <span>{scenario.patientPersona.name} is responding...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FLOATING PILL MESSAGE COMPOSER ANCHORED AT BOTTOM (Reference 4) */}
          {/* ========================================================================= */}
          <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white/95 to-transparent">
            <div className="max-w-2xl mx-auto space-y-2">
              {/* Quick Prompts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {scenario.quickPrompts.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading || currentSession?.status !== "ACTIVE"}
                    onClick={() => setInputMessage(prompt)}
                    className="shrink-0 px-3 py-1 rounded-full bg-white hover:bg-[#F0EFE9] text-[#222222] border border-[#E6E4DD] text-[11px] font-medium shadow-xs transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Pill Composer Bar (Reference 4) */}
              <div className="relative flex items-center bg-white rounded-full border border-[#E6E4DD] shadow-lg px-4 py-2 transition-all focus-within:border-[#292929] focus-within:ring-2 focus-within:ring-[#292929]/10">
                <div className="text-[#737373] mr-2 shrink-0">
                  <Glasses className="h-4 w-4" />
                </div>

                <textarea
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || currentSession?.status !== "ACTIVE"}
                  placeholder={
                    currentSession?.status === "COMPLETED"
                      ? "Session completed. Click restart above to practice again."
                      : `Type your consultation response to ${scenario.patientPersona.name}...`
                  }
                  className="flex-1 bg-transparent border-none resize-none text-xs md:text-sm text-[#222222] placeholder-[#737373] focus:outline-none py-1"
                />

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    title="Microphone voice simulation"
                    className="text-[#737373] hover:text-[#222222] p-1"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    data-testid="send-message-button"
                    aria-label="Send message"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || currentSession?.status !== "ACTIVE"}
                    className="w-8 h-8 rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] text-[#222222] flex items-center justify-center font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Assessment Evaluation Report Modal */}
      {reviewReport && (
        <AssessmentReportModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          assessment={reviewReport}
        />
      )}
    </AppShell>
  );
}
