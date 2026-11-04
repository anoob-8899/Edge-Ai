"use client";

import * as React from "react";
import {
  Sparkles,
  Glasses,
  Send,
  RotateCcw,
  Info,
  CheckCircle2,
  User,
  Zap,
  Award,
  Clock,
  ChevronRight,
  History,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  TrendingUp,
  X,
  Target,
  Mic,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { OPTICAL_SCENARIOS, OptiCoachScenario } from "@/lib/opticoach/scenarios";
import { ContextualProductCard } from "@/lib/opticoach/rag";
import { AssessmentReportModal } from "@/components/opticoach/assessment-report-modal";
import { SessionAssessment } from "@/lib/opticoach/assessment";

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

type ReviewReport = SessionAssessment | any;

export default function OptiCoachPage() {
  const [scenarios, setScenarios] = React.useState<OptiCoachScenario[]>(OPTICAL_SCENARIOS);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = React.useState(0);
  const [currentSession, setCurrentSession] = React.useState<SessionData | null>(null);
  const [contextualProducts, setContextualProducts] = React.useState<ContextualProductCard[]>([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isEnding, setIsEnding] = React.useState(false);
  const [reviewReport, setReviewReport] = React.useState<ReviewReport | null>(null);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [pastSessions, setPastSessions] = React.useState<any[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [expandedCoachingNote, setExpandedCoachingNote] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"chat" | "products">("chat");

  const scenario = scenarios[selectedScenarioIndex] || OPTICAL_SCENARIOS[0];
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isLoading]);

  // Start new session with scenario
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

      if (res.status === 401) {
        window.location.href = "/sign-in?from=/opticoach";
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response received from server");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to start coaching session");
      }

      setCurrentSession(data.session);
      if (data.contextualProducts) {
        setContextualProducts(data.contextualProducts);
      }
    } catch (err: any) {
      console.error("Start session error:", err);
      setErrorMessage(err.message || "Failed to initialize session. Please check your network and sign-in status.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Initialize first scenario on mount
  React.useEffect(() => {
    startSession(OPTICAL_SCENARIOS[0]);
  }, [startSession]);

  // Load session history
  const loadSessionHistory = async () => {
    try {
      const res = await fetch("/api/opticoach/sessions");
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  // Switch scenario handler
  const handleSelectScenario = (index: number) => {
    if (index === selectedScenarioIndex && currentSession?.status === "ACTIVE") return;
    setSelectedScenarioIndex(index);
    startSession(scenarios[index]);
  };

  // Send message turn
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);
    setErrorMessage(null);

    // Optimistically append staff message to UI
    const optimisticStaffMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      role: "staff",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setCurrentSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticStaffMsg] } : null
    );

    try {
      const res = await fetch(`/api/opticoach/sessions/${currentSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });

      if (res.status === 401) {
        window.location.href = "/sign-in?from=/opticoach";
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response received from server");
      }

      if (!res.ok) {
        throw new Error(data.error || "Simulation turn failed");
      }

      // Update session with customer response and updated session state
      setCurrentSession((prev) => {
        if (!prev) return null;
        // Filter out temp message and append verified server messages
        const filtered = prev.messages.filter((m) => !m.id.startsWith("temp-"));
        return {
          ...data.session,
          messages: [...filtered, data.staffMessage, data.customerMessage],
        };
      });

      if (data.contextualProducts && data.contextualProducts.length > 0) {
        setContextualProducts((prev) => {
          const map = new Map(prev.map((p) => [p.slug, p]));
          for (const item of data.contextualProducts) {
            map.set(item.slug, item);
          }
          return Array.from(map.values());
        });
      }
    } catch (err: any) {
      console.error("Message send error:", err);
      setErrorMessage(err.message || "Failed to communicate with AI Sales Coach");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // End Session & Review
  const handleEndSessionAndReview = async () => {
    if (!currentSession || isEnding) return;
    setIsEnding(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/opticoach/sessions/${currentSession.id}/complete`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate review");
      }

      setCurrentSession(data.session);
      if (data.review) {
        setReviewReport(data.review);
        setShowReviewModal(true);
      } else {
        alert("Session completed. Practice turns were not sufficient for a scored evaluation.");
      }
    } catch (err: any) {
      console.error("End session error:", err);
      setErrorMessage(err.message || "Failed to complete review");
    } finally {
      setIsEnding(false);
    }
  };

  // Helper to parse practiced skills
  const practicedSkillsList: string[] = React.useMemo(() => {
    if (!currentSession?.skillsPracticed) return [];
    try {
      return JSON.parse(currentSession.skillsPracticed);
    } catch {
      return [];
    }
  }, [currentSession?.skillsPracticed]);

  return (
    <AppShell
      title="Training Studio"
      subtitle="AI Sales Coach with interactive simulated customer consultations"
    >
      <div className="flex flex-col gap-5 max-w-7xl mx-auto">
        {/* REFINED SESSION CONTROL BAR */}
        <header className="rounded-[20px] p-4 md:p-5 bg-white border border-[#E3E9EF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#242629] flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="h-5 w-5 text-[#FFD95E]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-base md:text-lg text-[#20242B] tracking-tight">
                  {scenario.title}
                </h1>
                <Badge variant={currentSession?.status === "COMPLETED" ? "success" : "yellow"} size="sm" isMono>
                  {currentSession?.status === "COMPLETED" ? "COMPLETED" : "LIVE SIMULATION"}
                </Badge>
              </div>
              <p className="text-xs text-[#737D8B] mt-0.5">
                Scenario #{selectedScenarioIndex + 1} • {scenario.category} • Simulated Customer: <strong className="text-[#20242B]">{scenario.patientPersona.name}</strong> ({scenario.patientPersona.age} yrs)
              </p>
            </div>
          </div>

          {/* Action Buttons: Past Sessions, Restart, End Session */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => {
                loadSessionHistory();
                setShowHistoryModal(true);
              }}
              className="gap-1.5"
            >
              <History className="h-3.5 w-3.5 text-[#737D8B]" />
              <span>Session History</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => startSession(scenario)}
              disabled={isInitializing}
              title="Restart current scenario session"
              className="gap-1.5"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-[#737D8B] ${isInitializing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Restart</span>
            </Button>

            {currentSession?.status === "ACTIVE" && (
              <Button
                variant="yellow"
                size="sm"
                pill
                onClick={handleEndSessionAndReview}
                disabled={isEnding || (currentSession?.messages?.length || 0) < 2}
                className="gap-1.5 shadow-xs font-bold"
              >
                <Award className="h-3.5 w-3.5" />
                <span>{isEnding ? "Evaluating..." : "End & Review Scorecard"}</span>
              </Button>
            )}

            {currentSession?.status === "COMPLETED" && reviewReport && (
              <Button
                variant="dark"
                size="sm"
                pill
                onClick={() => setShowReviewModal(true)}
                className="gap-1.5"
              >
                <Award className="h-3.5 w-3.5 text-[#FFD95E]" />
                <span>View Evaluation ({reviewReport.overallScore}%)</span>
              </Button>
            )}
          </div>
        </header>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="p-3.5 rounded-[16px] bg-[#FCE4E4] border border-[#F5C2C2] text-[#962222] text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#962222]" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {currentSession && (
                <Button
                  variant="outline"
                  size="sm"
                  pill
                  onClick={handleEndSessionAndReview}
                  disabled={isEnding}
                  className="h-7 text-xs bg-white text-[#962222] border-[#F5C2C2]"
                >
                  <RotateCcw className={`h-3 w-3 mr-1 ${isEnding ? "animate-spin" : ""}`} />
                  <span>{isEnding ? "Retrying..." : "Retry Assessment"}</span>
                </Button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-[#962222] hover:text-black font-semibold text-xs px-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* SCENARIO SELECTOR CAROUSEL STRIP (9 SCENARIOS) */}
        <div className="rounded-[20px] p-4 bg-white border border-[#E3E9EF] shadow-xs">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Glasses className="h-4 w-4 text-[#20242B]" />
              <span className="text-xs font-bold text-[#20242B] uppercase tracking-wider">
                Select Practice Scenario ({scenarios.length})
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#737D8B]">
              Active: Scenario #{selectedScenarioIndex + 1}
            </span>
          </div>

          {/* 9 Scenario Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[175px] overflow-y-auto pr-1">
            {scenarios.map((sc, index) => {
              const isSelected = index === selectedScenarioIndex;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(index)}
                  className={`text-left p-3 rounded-[16px] transition-all duration-150 border relative ${
                    isSelected
                      ? "bg-[#242629] border-[#242629] text-white shadow-xs"
                      : "bg-[#EEF3F7]/50 border-[#E3E9EF] hover:bg-white hover:border-[#9CCBFF] text-[#20242B]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono uppercase tracking-tight ${isSelected ? "text-gray-300" : "text-[#737D8B]"}`}>
                      {index + 1}. {sc.category}
                    </span>
                    <Badge
                      variant={isSelected ? "yellow" : sc.difficulty === "Beginner" ? "success" : "secondary"}
                      size="sm"
                      isMono
                    >
                      {sc.difficulty}
                    </Badge>
                  </div>
                  <div className={`font-semibold text-xs leading-tight line-clamp-1 mb-1 ${isSelected ? "text-white" : "text-[#20242B]"}`}>
                    {sc.title}
                  </div>
                  <div className={`text-[11px] flex items-center justify-between ${isSelected ? "text-gray-400" : "text-[#737D8B]"}`}>
                    <span className="truncate max-w-[150px]">👤 {sc.patientPersona.name}</span>
                    <span className="font-mono flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {sc.durationMinutes}m
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN STUDIO GRID: CONVERSATION ARENA (8 COLS) + LIVE DISPENSING RADAR (4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CONVERSATION ARENA (8 COLS) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <Card variant="default" className="flex flex-col min-h-[580px] shadow-xs border-[#E3E9EF]">
              {/* Studio Arena Header with Simulated Customer summary */}
              <div className="p-3.5 md:p-4 border-b border-[#E3E9EF] flex items-center justify-between bg-white rounded-t-[20px]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#242629] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {scenario.patientPersona.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#20242B]">
                        {scenario.patientPersona.name}
                      </span>
                      <span className="text-[11px] text-[#737D8B]">
                        ({scenario.patientPersona.age} yrs • Simulated Customer)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#737D8B] truncate max-w-sm">
                      Target Focus: <span className="font-medium text-[#20242B]">{scenario.patientPersona.lifestyleNeed}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={currentSession?.status === "ACTIVE" ? "yellow" : "secondary"} size="sm" isMono>
                    {currentSession?.status === "ACTIVE" ? "LIVE PRACTICE" : "SESSION COMPLETED"}
                  </Badge>
                </div>
              </div>

              {/* CONVERSATION STREAM (Pearl White Workspace with Ambient Soft-Blue Glow) */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[520px] space-y-4 bg-[#F4F7FA] relative">
                {isInitializing && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#20242B] border-t-transparent animate-spin" />
                    <p className="text-xs font-semibold text-[#20242B]">
                      Preparing consultation simulation with {scenario.patientPersona.name}...
                    </p>
                    <p className="text-[11px] text-[#737D8B]">
                      Grounding optical dispensing specs and clinical objection scenarios...
                    </p>
                  </div>
                )}

                {/* REFERENCE 4: HERO AI COACH LANDING WORKSPACE (When session is fresh) */}
                {(!currentSession?.messages || currentSession.messages.length <= 1) && !isInitializing && (
                  <div className="py-6 px-2 text-center space-y-5">
                    {/* Glowing Orb / Center Graphic (Reference 4) */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-[#9CCBFF] via-[#DCEEFF] to-[#FFD95E]/50 flex items-center justify-center shadow-md animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs">
                        <Sparkles className="h-6 w-6 text-[#242629]" />
                      </div>
                    </div>

                    <div className="max-w-md mx-auto space-y-1">
                      <h2 className="text-lg md:text-xl font-bold text-[#20242B] tracking-tight">
                        How can OptiCoach assist your dispensing today?
                      </h2>
                      <p className="text-xs text-[#737D8B] leading-relaxed">
                        Get expert optical guidance powered by AI specializing in progressive lenses, high-index materials, price objections, and frame styling.
                      </p>
                    </div>

                    {/* 4 Suggestion Action Cards (Reference 4) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2 text-left">
                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage("Good afternoon, I understand progressive lenses can require brief adaptation. Let me walk you through how our modern corridor designs eliminate swim effect.")
                        }
                        className="p-3.5 rounded-[16px] bg-white border border-[#E3E9EF] hover:border-[#9CCBFF] hover:shadow-xs transition-all group flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#20242B] group-hover:text-black">
                            Practice a Sales Conversation
                          </div>
                          <p className="text-[11px] text-[#737D8B] mt-0.5 line-clamp-1">
                            Consult customer hesitating over progressives
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#737D8B] group-hover:text-[#20242B] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage("I completely respect your budget considerations. Let me explain how our high-index 1.74 lenses reduce edge thickness and eye magnification significantly.")
                        }
                        className="p-3.5 rounded-[16px] bg-white border border-[#E3E9EF] hover:border-[#9CCBFF] hover:shadow-xs transition-all group flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#20242B] group-hover:text-black">
                            Handle a Customer Objection
                          </div>
                          <p className="text-[11px] text-[#737D8B] mt-0.5 line-clamp-1">
                            Overcome sticker shock on premium optics
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#737D8B] group-hover:text-[#20242B] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setInputMessage("Could you explain the optical difference between polarized sunglasses and standard tinted UV400 lenses for driving glare?")
                        }
                        className="p-3.5 rounded-[16px] bg-white border border-[#E3E9EF] hover:border-[#9CCBFF] hover:shadow-xs transition-all group flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#20242B] group-hover:text-black">
                            Learn a Product & Lens Tech
                          </div>
                          <p className="text-[11px] text-[#737D8B] mt-0.5 line-clamp-1">
                            Master polarized vs anti-reflective treatments
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#737D8B] group-hover:text-[#20242B] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loadSessionHistory();
                          setShowHistoryModal(true);
                        }}
                        className="p-3.5 rounded-[16px] bg-white border border-[#E3E9EF] hover:border-[#9CCBFF] hover:shadow-xs transition-all group flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#20242B] group-hover:text-black">
                            Review My Performance
                          </div>
                          <p className="text-[11px] text-[#737D8B] mt-0.5 line-clamp-1">
                            Audit 6-criterion evaluation scorecards
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#737D8B] group-hover:text-[#20242B] shrink-0" />
                      </button>
                    </div>

                    <div className="pt-2 text-[11px] text-[#737D8B]">
                      <span>Or reply directly to <strong>{scenario.patientPersona.name}</strong> below:</span>
                    </div>
                  </div>
                )}

                {/* Render Conversation Messages */}
                {currentSession?.messages?.map((msg) => {
                  const isCustomer = msg.role === "customer";
                  const isStaff = msg.role === "staff";

                  let metadataObj: any = null;
                  if (msg.metadata) {
                    try {
                      metadataObj = JSON.parse(msg.metadata);
                    } catch (e) {
                      metadataObj = null;
                    }
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"} space-y-1.5`}
                    >
                      {/* Speaker Badge */}
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[11px] font-semibold text-[#737D8B]">
                          {isCustomer
                            ? scenario.patientPersona.name
                            : isStaff
                            ? "Staff Optician (You)"
                            : "System"}
                        </span>
                        {isCustomer && metadataObj?.customerMood && (
                          <Badge
                            variant={
                              metadataObj.customerMood === "impressed" || metadataObj.customerMood === "satisfied"
                                ? "success"
                                : metadataObj.customerMood === "curious"
                                ? "primary"
                                : "warning"
                            }
                            size="sm"
                            isMono
                            className="text-[10px] uppercase py-0"
                          >
                            Mood: {metadataObj.customerMood}
                          </Badge>
                        )}
                      </div>

                      {/* Message Bubble: Pearl White for Customer, Dark Charcoal for Staff */}
                      <div
                        className={`rounded-[20px] p-4 max-w-[88%] md:max-w-[78%] text-xs md:text-sm leading-relaxed shadow-xs ${
                          isStaff
                            ? "bg-[#242629] text-white rounded-tr-xs"
                            : "bg-white border border-[#E3E9EF] text-[#20242B] rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Real-time OptiCoach Feedback Whisper for Customer turns */}
                      {isCustomer && metadataObj?.coachingNotes && (
                        <div className="max-w-[88%] md:max-w-[78%] pl-2">
                          <button
                            onClick={() =>
                              setExpandedCoachingNote((prev) => (prev === msg.id ? null : msg.id))
                            }
                            className="flex items-center gap-1.5 text-[11px] font-medium text-[#20242B] hover:text-[#737D8B] transition-colors"
                          >
                            <Sparkles className="h-3 w-3 text-[#FFD95E]" />
                            <span className="font-semibold">
                              {expandedCoachingNote === msg.id
                                ? "Hide AI Coach Analysis"
                                : "AI Coach Real-Time Whispers"}
                            </span>
                            {expandedCoachingNote === msg.id ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {expandedCoachingNote === msg.id && (
                            <div className="mt-1.5 p-3.5 rounded-[16px] bg-[#EEF3F7] border border-[#E3E9EF] text-xs text-[#20242B] space-y-1.5 shadow-xs">
                              <div className="flex items-center gap-1.5 font-bold text-[#20242B] text-[11px]">
                                <Target className="h-3.5 w-3.5 text-[#242629]" />
                                <span>Clinical Feedback:</span>
                              </div>
                              <p className="text-[11px] text-[#737D8B]">{metadataObj.coachingNotes}</p>
                              {metadataObj.skillsDemonstrated?.length > 0 && (
                                <div className="pt-1 border-t border-[#E3E9EF] flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] text-[#737D8B]">Practiced:</span>
                                  {metadataObj.skillsDemonstrated.map((sk: string, sIdx: number) => (
                                    <Badge key={sIdx} variant="secondary" size="sm" className="text-[10px]">
                                      ✓ {sk}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Live typing indicator */}
                {isLoading && (
                  <div className="flex items-start space-y-1.5">
                    <div className="rounded-[20px] rounded-tl-xs p-3.5 bg-white border border-[#E3E9EF] shadow-xs flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#242629] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[#242629] animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-[#242629] animate-bounce [animation-delay:0.4s]" />
                      <span className="text-xs text-[#737D8B] ml-1.5 font-medium">
                        {scenario.patientPersona.name} is speaking...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* REFINED MESSAGE COMPOSER (Pill Composer Matching Reference 4) */}
              <div className="p-4 border-t border-[#E3E9EF] bg-white rounded-b-[20px] space-y-3">
                {/* Scenario Discovery Prompt Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  <span className="text-[11px] font-bold text-[#737D8B] shrink-0 mr-1 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#242629]" />
                    Coach Suggests:
                  </span>
                  {scenario.quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading || currentSession?.status !== "ACTIVE"}
                      onClick={() => setInputMessage(prompt)}
                      className="shrink-0 px-3 py-1 rounded-full bg-[#EEF3F7] hover:bg-[#E3E9EF] text-[#20242B] border border-[#E3E9EF] text-[11px] font-medium transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Pill Composer Bar */}
                <div className="relative flex items-center bg-[#EEF3F7] rounded-full border border-[#E3E9EF] px-3.5 py-1.5 transition-all focus-within:border-[#9CCBFF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9CCBFF]/40">
                  <div className="text-[#737D8B] mr-2 shrink-0">
                    <Glasses className="h-4 w-4" />
                  </div>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || currentSession?.status !== "ACTIVE"}
                    placeholder={
                      currentSession?.status === "COMPLETED"
                        ? "Session completed. Restart or select a new scenario to practice again."
                        : `Type your clinical consultation reply to ${scenario.patientPersona.name}...`
                    }
                    className="flex-1 bg-transparent border-none text-xs md:text-sm text-[#20242B] placeholder-[#737D8B] focus:outline-none"
                  />

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div
                      className="p-1.5 rounded-full text-[#737D8B] hover:text-[#20242B] hover:bg-black/5 cursor-pointer"
                      title="Microphone voice simulation"
                    >
                      <Mic className="h-4 w-4" />
                    </div>

                    <Button
                      type="button"
                      variant="yellow"
                      size="sm"
                      pill
                      className="h-8 px-3 font-bold"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading || currentSession?.status !== "ACTIVE"}
                    >
                      <span>Send</span>
                      <Send className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#737D8B]">
                  <span className="font-mono">
                    {inputMessage.length} / 500 characters
                  </span>
                  <span>Press Enter to send • Shift + Enter for newline</span>
                </div>
              </div>
            </Card>
          </div>

          {/* DISPENSING RADAR & SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Simulated Customer Context */}
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Simulated Customer Context</CardTitle>
                  <Badge variant="secondary" size="sm" isMono>
                    SIMULATED PERSONA
                  </Badge>
                </div>
                <CardDescription>
                  Synthetic training profile for optical retail practice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {/* Prescription & Lifestyle Reference */}
                <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#DCE8F5] text-left text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#65758B] border-b border-[#DCE8F5] pb-1">
                    <span className="font-semibold text-[#172B4D]">PRESCRIPTION REFERENCE</span>
                    <span>PRACTICE EXERCISE</span>
                  </div>
                  <div className="font-mono text-xs text-[#172B4D] font-bold">
                    {scenario.patientPersona.rxDescription}
                  </div>
                  <div className="text-[11px] text-[#65758B] pt-1 border-t border-[#DCE8F5]/80">
                    <span className="font-semibold text-[#172B4D]">Lifestyle Discovery: </span>
                    {scenario.patientPersona.lifestyleNeed}
                  </div>
                </div>

                {/* Primary Hesitation Quote */}
                <div className="p-3 rounded-xl bg-[#FFF8F0] border border-[#FFE0B2] text-xs space-y-1">
                  <span className="font-bold text-[#B45309] text-[11px] uppercase tracking-wider block">
                    Customer&apos;s Stated Hesitation:
                  </span>
                  <p className="text-[#9A3412] italic">
                    &ldquo;{scenario.patientPersona.primaryHesitation}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Skills Being Practiced with Live Indicators */}
            <Card variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Skills Being Practiced</CardTitle>
                  <span className="text-[11px] font-mono text-[#8796AA]">
                    {practicedSkillsList.length} / {scenario.skills.length} Demonstrated
                  </span>
                </div>
                <CardDescription>
                  Live competency evaluation during roleplay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {scenario.skills.map((skillName, idx) => {
                  const isDemonstrated = practicedSkillsList.some(
                    (s) => s.toLowerCase() === skillName.toLowerCase() || skillName.toLowerCase().includes(s.toLowerCase())
                  );
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                        isDemonstrated
                          ? "bg-[#F0FDF4] border-[#86EFAC] text-[#166534]"
                          : "bg-white/80 border-[#DCE8F5] text-[#172B4D]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDemonstrated ? (
                          <CheckCircle2 className="h-4 w-4 text-[#16865C] shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-[#DCE8F5] shrink-0" />
                        )}
                        <span className="font-medium text-xs">{skillName}</span>
                      </div>
                      <Badge
                        variant={isDemonstrated ? "success" : "neutral"}
                        size="sm"
                        isMono
                        className="text-[10px]"
                      >
                        {isDemonstrated ? "DEMONSTRATED" : "IN FOCUS"}
                      </Badge>
                    </div>
                  );
                })}

                <div className="pt-2 text-[11px] text-[#65758B] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#4285F4]" />
                  <span>AI Sales Coach evaluates dialogue and triggers skills as you converse.</span>
                </div>
              </CardContent>
            </Card>

            {/* Contextual Product Cards (Grounded Optical Specs) */}
            {contextualProducts.length > 0 && (
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Grounded Product References</CardTitle>
                    <Badge variant="primary" size="sm" isMono>
                      {contextualProducts.length} RECORD{contextualProducts.length > 1 ? "S" : ""}
                    </Badge>
                  </div>
                  <CardDescription>
                    Approved catalogue models referenced in this scenario
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contextualProducts.slice(0, 3).map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-white/90 border border-[#DCE8F5] hover:border-[#B8D9FF] transition-all space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#65758B]">
                            {prod.brandName}
                          </span>
                          <div className="font-bold text-xs text-[#172B4D]">
                            {prod.officialProductName}
                          </div>
                        </div>
                        <Badge
                          variant={prod.verificationStatus === "VERIFIED" ? "success" : "warning"}
                          size="sm"
                          isMono
                          className="text-[9px]"
                        >
                          {prod.verificationStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-[#65758B] pt-1 border-t border-[#DCE8F5]/60 font-mono">
                        <div>
                          <span className="text-[#8796AA]">Shape: </span>
                          <span className="text-[#172B4D] font-sans font-medium">{prod.frameShape}</span>
                        </div>
                        <div>
                          <span className="text-[#8796AA]">Polarized: </span>
                          <span className="text-[#172B4D] font-sans font-medium">
                            {prod.isPolarized === null ? "Unverified" : prod.isPolarized ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8796AA]">UV: </span>
                          <span className="text-[#172B4D] font-sans font-medium">
                            {prod.uvProtection || "Unverified"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8796AA]">Lens: </span>
                          <span className="text-[#172B4D] font-sans font-medium truncate">
                            {prod.lensMaterial || "Standard"}
                          </span>
                        </div>
                      </div>

                      {prod.dimensionsVerified ? (
                        <div className="text-[10px] text-[#16865C] flex items-center gap-1 font-mono">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Specs: {prod.lensWidthMm}□{prod.bridgeWidthMm}-{prod.templeLengthMm}mm</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#8796AA] italic">
                          * Millimeter dimensions unverified in manufacturer catalogue
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE END SESSION & REVIEW MODAL */}
      <AssessmentReportModal
        open={showReviewModal && Boolean(reviewReport)}
        onClose={() => setShowReviewModal(false)}
        assessment={reviewReport}
        scenarioTitle={scenario.title}
        scenarioCategory={scenario.category}
        onRetry={handleEndSessionAndReview}
        isRetrying={isEnding}
      />

      {/* SESSION HISTORY DRAWER / MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 border border-[#DCE8F5] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8F5] pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#4285F4]" />
                <h2 className="text-base font-bold text-[#172B4D]">Past Training Sessions</h2>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-[#8796AA] hover:text-[#172B4D] hover:bg-[#F0F7FF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {pastSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8796AA]">
                  No past sessions recorded yet. Complete a consultation turn to record your history!
                </div>
              ) : (
                pastSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl border border-[#DCE8F5] hover:border-[#B8D9FF] bg-white/80 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#172B4D]">{sess.scenarioTitle}</div>
                      <div className="text-[11px] text-[#8796AA] flex items-center gap-2 mt-0.5">
                        <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{sess._count?.messages || 0} messages</span>
                        <span>•</span>
                        <span>{Math.round(sess.durationSeconds / 60)} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sess.score !== null && sess.score !== undefined ? (
                        <Badge
                          variant={sess.score >= 80 ? "success" : sess.score >= 60 ? "primary" : "warning"}
                          size="sm"
                          isMono
                        >
                          Score: {sess.score}%
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm" isMono>
                          {sess.status}
                        </Badge>
                      )}

                      {sess.feedbackSummary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(sess.feedbackSummary);
                              setReviewReport(parsed);
                              setShowReviewModal(true);
                            } catch (e) {
                              console.error("Failed to parse review summary:", e);
                            }
                          }}
                        >
                          Review
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setShowHistoryModal(false);
                          setIsInitializing(true);
                          try {
                            const res = await fetch(`/api/opticoach/sessions/${sess.id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setCurrentSession(data.session);
                              if (data.contextualProducts) {
                                setContextualProducts(data.contextualProducts);
                              }
                              if (data.session.feedbackSummary) {
                                try {
                                  setReviewReport(JSON.parse(data.session.feedbackSummary));
                                } catch (e) {}
                              }
                            }
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsInitializing(false);
                          }
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
