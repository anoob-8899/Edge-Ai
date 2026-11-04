"use client";

import * as React from "react";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export function AppShell({ children, title, subtitle, fullWidth = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EF] text-[#222222]">
      {/* Top Floating Pill Navigation */}
      <React.Suspense
        fallback={
          <header className="w-full h-20 bg-[#F5F4EF] border-b border-[#E6E4DD]" />
        }
      >
        <TopBar title={title} subtitle={subtitle} />
      </React.Suspense>

      {/* Main Content Viewport */}
      <main
        className={
          fullWidth
            ? "flex-1 w-full flex flex-col"
            : "flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col"
        }
      >
        {children}
      </main>
    </div>
  );
}
