
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { VehicleRecommendations } from "./VehicleRecommendations";

interface SalesLead {
  id: string;
  status: string;
  customer_name: string | null;
  lead_score: number;
  preferred_vehicle_type: string;
  budget_range_min: number;
  budget_range_max: number;
}

export const SalesLeadList = () => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["sales-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_leads")
        .select(`
          id,
          status,
          lead_score,
          customer_name,
          preferred_vehicle_type,
          budget_range_min,
          budget_range_max
        `)
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
      {leads?.map((lead) => (
        <Card key={lead.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{lead.customer_name || "Unnamed Lead"}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Budget: ${lead.budget_range_min?.toLocaleString()} - ${lead.budget_range_max?.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={lead.lead_score >= 70 ? "default" : "secondary"}>
                  Score: {lead.lead_score}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Preferred: {lead.preferred_vehicle_type || "Any"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VehicleRecommendations leadId={lead.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
