import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";

export const metadata: Metadata = {
  title: "OptiTrain.ai | Optical Staff Training & Performance Platform",
  description: "AI-powered staff training and performance improvement platform for optical retail businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F4EF] text-[#222222] font-sans antialiased selection:bg-[#FFD95E]/40 selection:text-[#222222]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
