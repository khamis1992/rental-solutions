
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDetails } from "./LeadDetails";
import { LeadCommunication } from "./LeadCommunication";
import { LeadTasks } from "./LeadTasks";
import { Loader2 } from "lucide-react";
import type { SalesLead } from "@/types/sales.types";

export const SalesPipeline = () => {
  const { data: onboardingLeads, isLoading } = useQuery({
    queryKey: ["onboarding-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_leads")
        .select("*")
        .eq("status", "onboarding")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as SalesLead[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onboardingLeads?.map((lead) => (
        <div key={lead.id} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <LeadDetails leadId={lead.id} />
            </TabsContent>
            
            <TabsContent value="communication">
              <LeadCommunication leadId={lead.id} />
            </TabsContent>
            
            <TabsContent value="tasks">
              <LeadTasks leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </div>
      ))}

      {(!onboardingLeads || onboardingLeads.length === 0) && (
        <div className="text-center text-muted-foreground py-8">
          No leads in onboarding
        </div>
      )}
    </div>
  );
};
