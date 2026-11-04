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

  // Filter staff list
  const filteredStaff = React.useMemo(() => {
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staffList, searchQuery]);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const selectedReport = reports.find((r) => r.id === selectedStaff?.id);

  // Calculate training hours and split stats
  const totalCompletedLessons = reports.reduce((acc, r) => acc + r.lessons.completed, 0);
  const totalCompletedSimulations = reports.reduce((acc, r) => acc + r.optiCoach.completedCount, 0);
  const totalTrainingHours = (totalCompletedLessons * 1.5 + totalCompletedSimulations * 0.75).toFixed(1);
  const avgPracticeMastery = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.lessons.completionPercentage, 0) / reports.length)
    : 84;

  // Calendar dates mock generator for current month
  const calendarDays = [
    { day: 29, currentMonth: false },
    { day: 30, currentMonth: false },
    { day: 1, currentMonth: true, event: "Prescription Optics", eventType: "training" },
    { day: 2, currentMonth: true },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true, isOff: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true, highlight: "Dispensing Exam", isYellow: true },
    { day: 12, currentMonth: true, isOff: true },
    { day: 13, currentMonth: true, spanEvent: "Dispensing Sprint", spanStart: true },
    { day: 14, currentMonth: true, spanEvent: "Dispensing Sprint" },
    { day: 15, currentMonth: true, spanEvent: "Dispensing Sprint" },
    { day: 16, currentMonth: true, spanEvent: "Dispensing Sprint", spanEnd: true },
    { day: 17, currentMonth: true },
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true, isOff: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
    { day: 22, currentMonth: true, spanEvent: "Lens Science Lab", spanStart: true },
    { day: 23, currentMonth: true, spanEvent: "Lens Science Lab" },
    { day: 24, currentMonth: true, spanEvent: "Lens Science Lab", spanEnd: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true, isOff: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
    { day: 1, currentMonth: false },
    { day: 2, currentMonth: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ========================================================================= */}
      {/* COLUMN 1: EMPLOYEE ROSTER LIST (Reference 2 Left Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-3 bg-white border border-[#E3E9EF] rounded-[20px] p-4 space-y-4 shadow-xs">
        {/* Search & Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#20242B]">Staff Team</h3>
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={onEnrollStaff}
              className="text-xs h-7 px-2.5"
            >
              <Plus className="h-3 w-3" />
              <span>Enroll</span>
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737D8B]" />
            <input
              type="text"
              placeholder="Filter opticians..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-full bg-[#EEF3F7] text-[#20242B] placeholder-[#737D8B] border border-transparent focus:border-[#9CCBFF] focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Staff Cards List */}
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#737D8B]">
              No opticians found.
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const report = reports.find((r) => r.id === staff.id);
              const isSelected = staff.id === selectedStaffId;
              const mastery = report?.lessons.completionPercentage || 65;

              return (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`p-3 rounded-[16px] cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[#FFD95E] border-[#EAC248] text-[#20242B] shadow-xs"
                      : "bg-white hover:bg-[#EEF3F7]/70 border-[#E3E9EF] text-[#20242B]"
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
                        <h4 className="text-xs font-bold truncate">{staff.name}</h4>
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-[#20242B]" : "text-[#737D8B]"}`}>
                          {mastery}%
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? "text-[#20242B]/80" : "text-[#737D8B]"}`}>
                        {staff.role === "OWNER" ? "Practice Owner" : "Dispensing Optician"}
                      </p>

                      {/* Mini Dual Progress Bar (matching Reference 2) */}
                      <div className="mt-2 w-full h-1.5 rounded-full bg-black/10 overflow-hidden flex">
                        <div
                          className={`h-full ${isSelected ? "bg-[#20242B]" : "bg-[#FFD95E]"}`}
                          style={{ width: `${mastery}%` }}
                        />
                        <div
                          className="h-full bg-[#242629]/40"
                          style={{ width: `${Math.max(0, 100 - mastery)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2: CENTER CALENDAR & ACTIVITY SUMMARY (Reference 2 Center Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-6 bg-white border border-[#E3E9EF] rounded-[20px] p-5 space-y-5 shadow-xs">
        {/* Top Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3E9EF]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-[#20242B] tracking-tight">
                {totalTrainingHours} hrs / {avgPracticeMastery}%
              </h3>
              <Badge variant="success" size="sm">
                +12% vs last month
              </Badge>
            </div>
            <p className="text-xs text-[#737D8B] mt-0.5">
              Practice Dispensing Training & Clinical Simulation Output
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EEF3F7] text-[#20242B] border border-[#E3E9EF]">
              Active Term: Q4
            </span>
          </div>
        </div>

        {/* Training Activity Breakdown Status Bar (Crextio Pill Split) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737D8B] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD95E]" />
              Dispensing Curriculum (62%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#242629]" />
              AI Coach Simulations (26%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9CCBFF]" />
              Knowledge Checks (12%)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#EEF3F7] overflow-hidden flex gap-0.5 p-0.5 border border-[#E3E9EF]">
            <div className="h-full bg-[#FFD95E] rounded-l-full" style={{ width: "62%" }} />
            <div className="h-full bg-[#242629]" style={{ width: "26%" }} />
            <div className="h-full bg-[#9CCBFF] rounded-r-full" style={{ width: "12%" }} />
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#737D8B]" />
              <span>Training & Assessment Schedule</span>
            </h4>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded-full hover:bg-[#EEF3F7] text-[#737D8B]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-[#20242B] px-2">Current Month</span>
              <button className="p-1 rounded-full hover:bg-[#EEF3F7] text-[#737D8B]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#737D8B] mb-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((c, i) => {
              return (
                <div
                  key={i}
                  className={`min-h-[52px] p-1.5 rounded-[12px] border transition-colors flex flex-col justify-between ${
                    c.isYellow
                      ? "bg-[#FFD95E] border-[#EAC248] text-[#20242B] font-bold"
                      : c.spanEvent
                      ? "bg-[#DCEEFF]/60 border-[#9CCBFF] text-[#13457A]"
                      : c.isOff
                      ? "bg-[#EEF3F7]/50 border-dashed border-[#E3E9EF] text-[#737D8B]/50"
                      : c.currentMonth
                      ? "bg-[#EEF3F7]/30 border-[#E3E9EF] text-[#20242B]"
                      : "bg-transparent border-transparent text-[#737D8B]/30"
                  }`}
                >
                  <span className="text-[10px] font-mono leading-none">{c.day}</span>
                  {c.highlight && (
                    <span className="text-[9px] leading-tight font-bold bg-[#20242B] text-white px-1 py-0.5 rounded-full text-center">
                      {c.highlight}
                    </span>
                  )}
                  {c.spanStart && (
                    <span className="text-[9px] font-semibold truncate leading-tight">
                      {c.spanEvent}
                    </span>
                  )}
                  {c.event && (
                    <span className="text-[8px] truncate leading-tight font-medium text-[#737D8B]">
                      {c.event}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E3E9EF]">
          <div className="text-xs text-[#737D8B]">
            Showing roster activity for <strong>{selectedStaff?.name || "Team"}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" pill onClick={onNewAssignment}>
              <Plus className="h-3.5 w-3.5" />
              <span>Dispatch Assignment</span>
            </Button>
            <Button variant="dark" size="sm" pill onClick={() => onSelectTab("staff")}>
              <span>Full Staff Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 3: EMPLOYEE PROFILE & ANALYTICS PANEL (Reference 2 Right Panel) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-3 bg-white border border-[#E3E9EF] rounded-[20px] overflow-hidden shadow-xs">
        {selectedStaff ? (
          <div>
            {/* Top Luminous Ambient Banner */}
            <div className="relative h-24 bg-gradient-to-r from-[#242629] via-[#33383F] to-[#242629] p-4 flex items-end justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,#FFD95E,transparent_70%)]" />
              <div className="relative -bottom-6">
                <StaffAvatar
                  name={selectedStaff.name}
                  size="xl"
                  status={selectedStaff.status === "ACTIVE" ? "active" : "invited"}
                  className="ring-4 ring-white shadow-md"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-8 px-5 pb-5 text-center space-y-1 border-b border-[#E3E9EF]">
              <h3 className="text-base font-bold text-[#20242B]">{selectedStaff.name}</h3>
              <p className="text-xs text-[#737D8B]">
                {selectedStaff.role === "OWNER" ? "Practice Owner" : "Dispensing Optician"}
              </p>
              <div className="pt-1">
                <Badge
                  variant={selectedStaff.status === "ACTIVE" ? "success" : "warning"}
                  size="sm"
                >
                  {selectedStaff.status}
                </Badge>
              </div>
            </div>

            {/* Basic Information Block */}
            <div className="p-5 space-y-3 border-b border-[#E3E9EF] text-xs">
              <h4 className="text-[11px] font-bold text-[#737D8B] uppercase tracking-wider">
                Basic Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#737D8B]">Email</span>
                  <span className="font-semibold text-[#20242B] truncate max-w-[150px]">
                    {selectedStaff.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737D8B]">Practice Branch</span>
                  <span className="font-semibold text-[#20242B]">
                    {selectedStaff.clinicId || "Apex Optical Lab"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737D8B]">Enrolled Date</span>
                  <span className="font-semibold text-[#20242B]">
                    {new Date(selectedStaff.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidential Records / Evaluations */}
            <div className="p-5 space-y-3 border-b border-[#E3E9EF] text-xs">
              <h4 className="text-[11px] font-bold text-[#737D8B] uppercase tracking-wider">
                Practice Records
              </h4>
              {selectedStaff.privateRecords && selectedStaff.privateRecords.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedStaff.privateRecords.slice(0, 2).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-[12px] bg-[#EEF3F7] border border-[#E3E9EF] space-y-0.5"
                    >
                      <div className="font-semibold text-[#20242B] flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#242629]" />
                        <span>{rec.title}</span>
                      </div>
                      <p className="text-[11px] text-[#737D8B] line-clamp-2">
                        {rec.notes}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#737D8B] italic">
                  No private coaching records logged yet.
                </p>
              )}
            </div>

            {/* Performance Statistics (Progress Bars matching Reference 2) */}
            <div className="p-5 space-y-3 text-xs">
              <h4 className="text-[11px] font-bold text-[#737D8B] uppercase tracking-wider">
                Competency Statistics
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-[#737D8B]">Dispensing Modules</span>
                    <span className="font-bold text-[#20242B]">
                      {selectedReport?.lessons.completed || 8} completed
                    </span>
                  </div>
                  <ProgressBar
                    value={selectedReport?.lessons.completionPercentage || 75}
                    barColor="yellow"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-[#737D8B]">Simulations Completed</span>
                    <span className="font-bold text-[#20242B]">
                      {selectedReport?.optiCoach.completedCount || 4} sessions
                    </span>
                  </div>
                  <ProgressBar
                    value={(selectedReport?.optiCoach.completedCount || 4) * 20}
                    barColor="dark"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-1">
                    <span className="text-[#737D8B]">Knowledge Quiz Accuracy</span>
                    <span className="font-bold text-[#20242B]">
                      {selectedReport?.quizzes.averageScorePercent || 90}% avg
                    </span>
                  </div>
                  <ProgressBar
                    value={selectedReport?.quizzes.averageScorePercent || 90}
                    barColor="blue"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#737D8B]">
            Select an optician to inspect profile.
          </div>
        )}
      </div>
    </div>
  );
}
