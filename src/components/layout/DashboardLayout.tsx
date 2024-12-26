'use client';

import { ReactNode } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={!isMobile}>
        <DashboardHeader />
        <div className="flex pt-[var(--header-height,56px)]">
          <DashboardSidebar />
          <main className="flex-1 w-full min-h-[calc(100vh-56px)]">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};