import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "NovaHR — Next-Gen HRMS",
  description: "Decision-driven, AI-assisted Human Resource Management System.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}


