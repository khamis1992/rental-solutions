import { useQuery } from "@tanstack/react-query";
import { TrafficFineStats } from "./TrafficFineStats";
import { TrafficFineImport } from "./TrafficFineImport";
import { TrafficFinesList } from "./TrafficFinesList";
import { ManualTrafficFineDialog } from "./ManualTrafficFineDialog";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { supabase } from "@/integrations/supabase/client";

export function TrafficFinesDashboard() {
  const { data: finesCount, refetch } = useQuery({
    queryKey: ["traffic-fines-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('traffic_fines')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ErrorBoundary>
          <TrafficFineStats paymentCount={finesCount || 0} />
        </ErrorBoundary>
        <ManualTrafficFineDialog onFineAdded={refetch} />
      </div>
      
      <ErrorBoundary>
        <TrafficFineImport />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <TrafficFinesList />
      </ErrorBoundary>
    </div>
  );
}