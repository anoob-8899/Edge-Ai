"use client";

import * as React from "react";
import {
  Users,
  Search,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ChevronDown,
  LayoutGrid,
  FileCheck,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { StaffAvatar } from "@/components/shared/staff-avatar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  clinicId?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  privateRecords?: {
    id: string;
    title: string;
    notes: string;
    confidentialSalaryOrBonusTier?: string | null;
  }[];
}

interface StaffProgressReport {
  id: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  lastActiveAt?: string | null;
  lessons: {
    completed: number;
    inProgress: number;
    totalAvailable: number;
    completionPercentage: number;
  };
  quizzes: {
    totalAttempts: number;
    passedCount: number;
    averageScorePercent?: number | null;
  };
  optiCoach: {
    completedCount: number;
    averageScore?: number | null;
  };
}

interface AssignmentItem {
  id: string;
  title: string;
  status: string;
  dueDate?: string | null;
  assignedTo: {
    id: string;
    name: string;
  };
}

interface OwnerAnalyticsOverviewProps {
  staffList: StaffMember[];
  reports: StaffProgressReport[];
  assignments: AssignmentItem[];
  onSelectTab: (tab: string) => void;
  onEnrollStaff: () => void;
  onNewAssignment: () => void;
}

export function OwnerAnalyticsOverview({
  staffList,
  reports,
  assignments,
  onSelectTab,
  onEnrollStaff,
  onNewAssignment,
}: OwnerAnalyticsOverviewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>(
    staffList[0]?.id || ""
  );

  React.useEffect(() => {
    if (!selectedStaffId && staffList.length > 0) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  const filteredStaff = React.useMemo(() => {
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staffList, searchQuery]);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const selectedReport = reports.find((r) => r.id === selectedStaff?.id);

  const totalCompletedLessons = reports.reduce((acc, r) => acc + r.lessons.completed, 0);
  const totalCompletedSimulations = reports.reduce((acc, r) => acc + r.optiCoach.completedCount, 0);
  const totalTrainingHours = (totalCompletedLessons * 1.5 + totalCompletedSimulations * 0.75).toFixed(1);
  const avgPracticeMastery = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.lessons.completionPercentage, 0) / reports.length)
    : 84;

  const calendarDays = [
    { day: 29, currentMonth: false, isHatched: true },
    { day: 30, currentMonth: false, isHatched: true },
    { day: 1, currentMonth: true, event: "Prescription Optics", eventType: "training" },
    { day: 2, currentMonth: true },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true, isOff: true, isHatched: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true, highlight: "OptiCoach Exam", isYellow: true },
    { day: 12, currentMonth: true, isOff: true, isHatched: true },
    { day: 13, currentMonth: true, spanEvent: "Dispensing Sprint", spanStart: true },
    { day: 14, currentMonth: true, spanEvent: "Dispensing Sprint" },
    { day: 15, currentMonth: true, spanEvent: "Dispensing Sprint" },
    { day: 16, currentMonth: true, spanEvent: "Dispensing Sprint", spanEnd: true },
    { day: 17, currentMonth: true },
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true, isOff: true, isHatched: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
    { day: 22, currentMonth: true, spanEvent: "Lens Science Lab", spanStart: true },
    { day: 23, currentMonth: true, spanEvent: "Lens Science Lab" },
    { day: 24, currentMonth: true, spanEvent: "Lens Science Lab", spanEnd: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true, isOff: true, isHatched: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
    { day: 1, currentMonth: false, isHatched: true },
    { day: 2, currentMonth: false, isHatched: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ========================================================================= */}
      {/* COLUMN 1: EMPLOYEE LIST (Faithful to Reference 2 Left Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-3 space-y-3">
        {/* Top Header Pill for List */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">
            Dispensing Team ({filteredStaff.length})
          </span>
          <button
            onClick={onEnrollStaff}
            className="text-xs font-semibold text-[#222222] hover:text-[#737373] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Enroll
          </button>
        </div>

        {/* Search Input for Roster */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search optician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs rounded-full bg-white text-[#222222] placeholder-[#737373] border border-[#E6E4DD] focus:border-[#292929] focus:outline-none transition-all shadow-xs"
          />
        </div>

        {/* Staff Card Stack (Reference 2: Rounded white cards with dual progress bar) */}
        <div className="space-y-2.5">
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-xs text-[#737373] border border-[#E6E4DD]">
              No opticians found.
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const report = reports.find((r) => r.id === staff.id);
              const isSelected = staff.id === selectedStaffId;
              const mastery = report?.lessons.completionPercentage || 68;

              return (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-white border-[#FFD95E] ring-2 ring-[#FFD95E]/50 shadow-sm"
                      : "bg-white hover:bg-[#F0EFE9]/60 border-[#E6E4DD] shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StaffAvatar
                      name={staff.name}
                      size="md"
                      status={staff.status === "ACTIVE" ? "active" : "invited"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#222222] truncate">{staff.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-[#737373]">
                          {mastery}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] truncate">
                        {staff.role === "OWNER" ? "Practice Owner" : "Senior Optician"}
                      </p>

                      {/* Dual Progress Bar (Yellow segment + Dark segment as in Reference 2) */}
                      <div className="mt-2 w-full h-1.5 rounded-full bg-[#F0EFE9] overflow-hidden flex">
                        <div
                          className="h-full bg-[#FFD95E]"
                          style={{ width: `${mastery}%` }}
                        />
                        <div
                          className="h-full bg-[#292929]"
                          style={{ width: `${Math.round(mastery * 0.4)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar (Reference 2: <- 1 2 ... 8 ->) */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button className="w-7 h-7 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-xs text-[#737373] hover:text-[#222222]">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="w-7 h-7 rounded-full bg-[#292929] text-white flex items-center justify-center text-xs font-semibold">
            1
          </button>
          <button className="w-7 h-7 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-xs text-[#737373] hover:text-[#222222]">
            2
          </button>
          <span className="text-xs text-[#737373] px-1">...</span>
          <button className="w-7 h-7 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-xs text-[#737373] hover:text-[#222222]">
            5
          </button>
          <button className="w-7 h-7 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-xs text-[#737373] hover:text-[#222222]">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2: CENTER CALENDAR & ACTIVITY SUMMARY (Reference 2 Center Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-6 bg-white border border-[#E6E4DD] rounded-[28px] p-6 space-y-6 shadow-sm">
        {/* Top Controls: Search & View Icons */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E6E4DD]/60">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
            <input
              type="text"
              placeholder="Search training events..."
              className="w-full h-8 pl-9 pr-3 text-xs rounded-full bg-[#F0EFE9] text-[#222222] placeholder-[#737373] border-none focus:outline-none focus:ring-1 focus:ring-[#292929]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-full bg-[#F0EFE9] flex items-center justify-center text-[#737373] hover:text-[#222222]">
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onNewAssignment}
              className="w-8 h-8 rounded-full bg-[#292929] flex items-center justify-center text-white hover:bg-[#3d3d3d]"
              title="Add Assignment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Big Metric Display & Month Selector (Reference 2: "264.00 hrs / $2,647" with "December v") */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#222222]">
              {totalTrainingHours} hrs <span className="text-[#737373] font-light">/</span> {avgPracticeMastery}%
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Verified clinical hours & competency mastery across practice
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E4DD] text-xs font-semibold text-[#222222] shadow-xs cursor-pointer self-start sm:self-auto">
            <span>November</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#737373]" />
          </div>
        </div>

        {/* Multi-Segment Status Pill Bar (Reference 2: Yellow pill, Dark pill, Grey pill) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD95E] text-[#222222] text-xs font-bold shadow-xs">
            <span>Clinical Work: 167 hrs</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#292929] text-white text-xs font-semibold shadow-xs">
            <span>AI Simulations: 43 hrs</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0EFE9] text-[#737373] text-xs font-medium border border-[#E6E4DD]">
            <span>Curriculum: 74 hrs</span>
          </div>
        </div>

        {/* Calendar Training Schedule Month View (Reference 2) */}
        <div className="space-y-3 pt-2">
          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-[#737373]">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Day Tiles */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {calendarDays.map((c, i) => {
              return (
                <div
                  key={i}
                  className={`min-h-[56px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                    c.isYellow
                      ? "bg-[#FFD95E] border-[#FFD95E] text-[#222222] font-bold shadow-xs"
                      : c.spanEvent
                      ? "bg-white border-[#E6E4DD] text-[#222222] shadow-2xs"
                      : c.isHatched
                      ? "bg-[#F0EFE9]/50 border-[#E6E4DD]/60 text-[#737373]/50 opacity-60"
                      : c.currentMonth
                      ? "bg-[#F0EFE9]/40 border-transparent text-[#222222]"
                      : "bg-transparent border-transparent text-[#737373]/30"
                  }`}
                >
                  <span className="text-[10px] font-mono leading-none">{c.day}</span>
                  {c.highlight && (
                    <span className="text-[8px] leading-tight font-extrabold bg-[#292929] text-[#FFD95E] px-1 py-0.5 rounded text-center">
                      {c.highlight}
                    </span>
                  )}
                  {c.spanStart && (
                    <span className="text-[9px] font-bold truncate leading-tight text-[#222222]">
                      ● {c.spanEvent}
                    </span>
                  )}
                  {c.event && (
                    <span className="text-[8px] truncate leading-tight font-medium text-[#737373]">
                      {c.event}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Fast Action Bar */}
        <div className="pt-3 flex items-center justify-between border-t border-[#E6E4DD]/60 text-xs">
          <span className="text-[#737373]">
            Showing roster activity for <strong className="text-[#222222]">{selectedStaff?.name}</strong>
          </span>
          <button
            onClick={() => onSelectTab("staff")}
            className="font-semibold text-[#222222] hover:text-[#737373]"
          >
            View Full Table &rarr;
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 3: STAFF DETAIL PANEL (Reference 2 Right Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-3 bg-white border border-[#E6E4DD] rounded-[28px] overflow-hidden shadow-sm">
        {/* Top Graphic Banner with Circular Avatar Overlapping */}
        <div className="relative h-28 bg-gradient-to-br from-[#292929] via-[#3a3a3a] to-[#1c1c1c] p-4 flex items-end justify-center">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_50%_0%,#FFD95E,transparent_75%)]" />
          <div className="relative -bottom-7">
            <StaffAvatar
              name={selectedStaff?.name || "Staff"}
              size="xl"
              status={selectedStaff?.status === "ACTIVE" ? "active" : "invited"}
              className="ring-4 ring-white shadow-md"
            />
          </div>
        </div>

        {/* Staff Title & Role */}
        <div className="pt-9 px-6 pb-4 text-center border-b border-[#E6E4DD]/60 space-y-1">
          <h3 className="text-base font-bold text-[#222222]">{selectedStaff?.name}</h3>
          <p className="text-xs text-[#737373]">
            {selectedStaff?.role === "OWNER" ? "Practice Owner" : "Senior Dispensing Optician"}
          </p>
        </div>

        {/* Basic Information with Dotted Leaders (Reference 2 Authentic Layout) */}
        <div className="p-6 space-y-3.5 border-b border-[#E6E4DD]/60 text-xs">
          <h4 className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
            Basic Information
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between text-[#737373]">
              <span className="flex items-center gap-1.5 shrink-0">
                <CalendarDays className="h-3 w-3" /> Enrolled
              </span>
              <span className="mx-2 flex-1 border-b border-dotted border-[#E6E4DD]" />
              <span className="font-semibold text-[#222222] shrink-0">
                {selectedStaff ? new Date(selectedStaff.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-[#737373]">
              <span className="flex items-center gap-1.5 shrink-0">
                <Phone className="h-3 w-3" /> Phone
              </span>
              <span className="mx-2 flex-1 border-b border-dotted border-[#E6E4DD]" />
              <span className="font-semibold text-[#222222] shrink-0">
                +44 20 7946 0912
              </span>
            </div>

            <div className="flex items-baseline justify-between text-[#737373]">
              <span className="flex items-center gap-1.5 shrink-0">
                <Mail className="h-3 w-3" /> E-Mail
              </span>
              <span className="mx-2 flex-1 border-b border-dotted border-[#E6E4DD]" />
              <span className="font-semibold text-[#222222] truncate max-w-[120px] shrink-0" title={selectedStaff?.email}>
                {selectedStaff?.email}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-[#737373]">
              <span className="flex items-center gap-1.5 shrink-0">
                <MapPin className="h-3 w-3" /> Practice Site
              </span>
              <span className="mx-2 flex-1 border-b border-dotted border-[#E6E4DD]" />
              <span className="font-semibold text-[#222222] shrink-0">
                {selectedStaff?.clinicId || "Apex Main"}
              </span>
            </div>
          </div>
        </div>

        {/* Documents & Badges (Reference 2 Authentic Layout: Blue and Orange Pills) */}
        <div className="p-6 space-y-3 border-b border-[#E6E4DD]/60">
          <h4 className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
            Certifications
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#EAF5D5] border border-[#D5E8B5] flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-[#255217] shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-[#255217] truncate">License L2</p>
                <p className="text-[10px] text-[#255217]/70">Verified</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#92400E] shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-[#92400E] truncate">Progressive</p>
                <p className="text-[10px] text-[#92400E]/70">Mastered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics & Competencies (Reference 2: Dual Bars at Bottom) */}
        <div className="p-6 space-y-3 text-xs">
          <h4 className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
            Statistics
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-[#737373]">Consultation Simulations</span>
                <span className="font-bold text-[#222222]">
                  {selectedReport?.optiCoach.completedCount || 14} sessions
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F0EFE9] overflow-hidden">
                <div className="h-full bg-[#FFD95E]" style={{ width: "88%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-[#737373]">Optical Accuracy</span>
                <span className="font-bold text-[#222222]">
                  {selectedReport?.quizzes.averageScorePercent || 92}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F0EFE9] overflow-hidden">
                <div className="h-full bg-[#292929]" style={{ width: "92%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
