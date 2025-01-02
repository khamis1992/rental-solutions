import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentHistoryAnalysis } from "./profile/PaymentHistoryAnalysis";
import { RentDueManagement } from "./profile/RentDueManagement";
import { TrafficFinesSummary } from "./profile/TrafficFinesSummary";
import { CredibilityScore } from "./profile/CredibilityScore";
import { CustomerNotes } from "./profile/CustomerNotes";
import { CustomerDocuments } from "../agreements/CustomerDocuments";
import { AgreementsHistory } from "./profile/AgreementsHistory";

interface CustomerProfileViewProps {
  customerId: string;
}

export const CustomerProfileView = ({ customerId }: CustomerProfileViewProps) => {
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      console.log("Fetching customer profile for ID:", customerId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq('id', customerId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching customer profile:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Customer not found");
      }

      return data;
    },
    enabled: Boolean(customerId),
  });

  if (isLoadingProfile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{profile?.full_name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <span>{profile?.email}</span>
            <span>•</span>
            <span>{profile?.phone_number}</span>
          </div>
        </div>
        <Badge variant={profile?.role === "customer" ? "secondary" : "default"}>
          {profile?.role}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CredibilityScore customerId={customerId} />
      </div>

      <CustomerNotes customerId={customerId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RentDueManagement customerId={customerId} />
        <CustomerDocuments customerId={customerId} />
      </div>

      <Tabs defaultValue="payment_history" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="payment_history">Payment History</TabsTrigger>
          <TabsTrigger value="rent_due">Rent Due</TabsTrigger>
          <TabsTrigger value="traffic_fines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="agreements_history">Agreements History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment_history">
          <PaymentHistoryAnalysis customerId={customerId} />
        </TabsContent>

        <TabsContent value="rent_due">
          <RentDueManagement customerId={customerId} />
        </TabsContent>

        <TabsContent value="traffic_fines">
          <TrafficFinesSummary customerId={customerId} />
        </TabsContent>

        <TabsContent value="agreements_history">
          <AgreementsHistory customerId={customerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};