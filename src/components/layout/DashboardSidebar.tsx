
import { 
  LayoutDashboard, CarFront, Users, FileText, Wrench, 
  DollarSign, AlertTriangle, BarChart3, Archive,
  Building2, Scale, HelpCircle, ChevronRight, 
  ChevronLeft, Activity
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: React.ComponentType;
  label: string;
  href: string;
  description: string;
}

const menuGroups: MenuGroup[] = [
  {
    label: "Core Operations",
    items: [
      { 
        icon: LayoutDashboard, 
        label: "Dashboard", 
        href: "/",
        description: "Overview and key metrics"
      },
      { 
        icon: CarFront, 
        label: "Vehicles", 
        href: "/vehicles",
        description: "Manage vehicle fleet"
      },
      { 
        icon: Wrench, 
        label: "Maintenance", 
        href: "/maintenance",
        description: "Vehicle maintenance tracking"
      },
    ]
  },
  {
    label: "Customer Management",
    items: [
      { 
        icon: Users, 
        label: "Customers", 
        href: "/customers",
        description: "Customer database"
      },
      { 
        icon: FileText, 
        label: "Agreements", 
        href: "/agreements",
        description: "Rental agreements"
      },
    ]
  },
  {
    label: "Financial",
    items: [
      { 
        icon: DollarSign, 
        label: "Finance", 
        href: "/finance",
        description: "Financial management"
      },
      { 
        icon: AlertTriangle, 
        label: "Traffic Fines", 
        href: "/traffic-fines",
        description: "Manage traffic violations"
      },
      { 
        icon: BarChart3, 
        label: "Remaining Amount", 
        href: "/remaining-amount",
        description: "Outstanding payments"
      },
    ]
  },
  {
    label: "Services",
    items: [
      { 
        icon: Building2, 
        label: "Chauffeur Service", 
        href: "/chauffeur-service",
        description: "Driver services"
      },
    ]
  },
  {
    label: "Business Intelligence",
    items: [
      { 
        icon: Activity, 
        label: "Reports", 
        href: "/reports",
        description: "Business analytics"
      },
      { 
        icon: Archive, 
        label: "Audit", 
        href: "/audit",
        description: "System audit logs"
      },
    ]
  },
  {
    label: "Support",
    items: [
      { 
        icon: Scale, 
        label: "Legal", 
        href: "/legal",
        description: "Legal documentation"
      },
      { 
        icon: HelpCircle, 
        label: "Help", 
        href: "/help",
        description: "Support and documentation"
      },
    ]
  },
];

export const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { session, isLoading } = useSessionContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isLoading) {
    return (
      <Sidebar className="border-r animate-pulse">
        <SidebarContent>
          <div className="flex h-14 items-center border-b px-6">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar className={cn(
        "border-r transition-all duration-300 bg-gradient-to-b from-white to-gray-50",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}>
        <SidebarContent>
          <div className="flex h-14 items-center border-b px-4 justify-between">
            {!isCollapsed && (
              <span className="font-semibold text-lg bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Rental Solutions
              </span>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          <div className="py-4">
            {menuGroups.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex} className="px-2">
                {!isCollapsed && (
                  <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item, itemIndex) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <SidebarMenuItem key={itemIndex}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                                  "hover:bg-orange-50 group",
                                  isActive && "bg-orange-100 text-orange-600"
                                )}
                              >
                                <Link to={item.href} className="flex items-center gap-3 w-full">
                                  <item.icon className={cn(
                                    "h-5 w-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-orange-600" : "text-gray-500 group-hover:text-orange-500"
                                  )} />
                                  {!isCollapsed && (
                                    <span className={cn(
                                      "font-medium text-sm transition-colors",
                                      isActive ? "text-orange-600" : "text-gray-700 group-hover:text-orange-500"
                                    )}>
                                      {item.label}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side="right" className="ml-2">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs text-gray-500">{item.description}</div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
};
