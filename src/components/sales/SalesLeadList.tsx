
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRightCircle } from "lucide-react";
import { VehicleRecommendations } from "./VehicleRecommendations";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SalesLead } from "@/types/sales.types";
import { DeleteLeadButton } from "./DeleteLeadButton";

export const SalesLeadList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["sales-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      return data as SalesLead[];
    }
  });

  const handleTransferToOnboarding = async (leadId: string) => {
    try {
      const lead = leads?.find(l => l.id === leadId);

      const { data, error } = await supabase
        .from("sales_leads")
        .update({
          status: "onboarding",
          onboarding_progress: {
            customer_conversion: false,
            agreement_creation: false,
            initial_payment: false
          }
        })
        .eq("id", leadId);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      toast.success("Lead transferred to onboarding");
      setSearchParams({ tab: 'onboarding' });
      await refetch();
      
    } catch (error: any) {
      console.error("Error transferring lead to onboarding:", error);
      toast.error(error.message || "Failed to transfer lead to onboarding");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {leads?.map((lead, index) => (
        <Card 
          key={lead.id}
          className="transition-all duration-300 hover:shadow-lg animate-fade-in"
          style={{ 
            animationDelay: `${index * 100}ms`,
            opacity: 0,
            animation: "fade-in 0.5s ease forwards"
          }}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                <CardTitle className="group">
                  <span className="transition-colors duration-300 group-hover:text-primary">
                    {lead.full_name}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 animate-fade-in" 
                   style={{ animationDelay: `${index * 200}ms` }}>
                  Budget: {formatCurrency(lead.budget_range_min || 0)} - {formatCurrency(lead.budget_range_max || 0)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant={lead.lead_score && lead.lead_score >= 70 ? "default" : "secondary"} 
                  className="bg-cyan-400 hover:bg-cyan-300 transition-colors duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 250}ms` }}
                >
                  Score: {lead.lead_score || 0}
                </Badge>
                <p className="text-sm text-muted-foreground animate-fade-in"
                   style={{ animationDelay: `${index * 300}ms` }}>
                  Preferred: {lead.preferred_vehicle_type || "Any"}
                </p>
                <div className="flex gap-2">
                  {lead.status !== "onboarding" && (
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTransferToOnboarding(lead.id)}
                      className="mt-2 bg-primary hover:bg-primary/90 text-white transition-all duration-300 
                               hover:scale-105 active:scale-95 animate-fade-in"
                      style={{ animationDelay: `${index * 350}ms` }}
                    >
                      <ArrowRightCircle className="h-4 w-4 mr-2 transition-transform group-hover:translate-x-1" />
                      Transfer to Onboarding
                    </Button>
                  )}
                  <DeleteLeadButton 
                    leadId={lead.id} 
                    className="mt-2 animate-fade-in"
                  />
                </div>
                {lead.status === "onboarding" && (
                  <Badge 
                    variant="outline" 
                    className="mt-2 animate-fade-in"
                    style={{ animationDelay: `${index * 350}ms` }}
                  >
                    In Onboarding
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="animate-fade-in" style={{ animationDelay: `${index * 400}ms` }}>
            <VehicleRecommendations leadId={lead.id} />
          </CardContent>
        </Card>
      ))}
      {(!leads || leads.length === 0) && (
        <div className="text-center text-muted-foreground py-8 animate-fade-in">
          No leads available
        </div>
      )}
    </div>
  );
};
