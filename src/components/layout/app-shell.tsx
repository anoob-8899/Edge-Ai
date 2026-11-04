"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F7FA]">
      {/* Desktop Sidebar with Suspense boundary for useSearchParams */}
      <React.Suspense
        fallback={
          <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E3E9EF] h-screen sticky top-0 shrink-0" />
        }
      >
        <Sidebar />
      </React.Suspense>

      {/* Mobile Top Navigation & Drawer */}
      <MobileNav />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
