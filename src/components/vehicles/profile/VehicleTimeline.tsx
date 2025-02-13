import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateToDisplay } from "@/lib/dateUtils";
import { useState } from "react";
import { CustomerDetailsDialog } from "@/components/customers/CustomerDetailsDialog";
import { AgreementDetailsDialog } from "@/components/agreements/AgreementDetailsDialog";
interface VehicleTimelineProps {
  vehicleId: string;
}
export const VehicleTimeline = ({
  vehicleId
}: VehicleTimelineProps) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const {
    data: events = [],
    isLoading
  } = useQuery({
    queryKey: ["vehicle-timeline", vehicleId],
    queryFn: async () => {
      // Fetch maintenance records
      const {
        data: maintenance,
        error: maintenanceError
      } = await supabase.from("maintenance").select("*").eq("vehicle_id", vehicleId).order("scheduled_date", {
        ascending: false
      });
      if (maintenanceError) throw maintenanceError;

      // Fetch rental records (leases)
      const {
        data: rentals,
        error: rentalsError
      } = await supabase.from("leases").select(`
          *,
          profiles:customer_id (
            id,
            full_name
          )
        `).eq("vehicle_id", vehicleId).order("start_date", {
        ascending: false
      });
      if (rentalsError) throw rentalsError;

      // Fetch damage records
      const {
        data: damages,
        error: damagesError
      } = await supabase.from("damages").select("*").eq("vehicle_id", vehicleId).order("reported_date", {
        ascending: false
      });
      if (damagesError) throw damagesError;

      // Combine and sort all events
      const allEvents = [...(maintenance?.map(m => ({
        ...m,
        type: 'maintenance',
        date: m.scheduled_date
      })) || []), ...(rentals?.map(r => ({
        ...r,
        type: 'rental',
        date: r.start_date
      })) || []), ...(damages?.map(d => ({
        ...d,
        type: 'damage',
        date: d.reported_date
      })) || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return allEvents;
    }
  });
  if (isLoading) {
    return <div>Loading timeline...</div>;
  }
  const getEventBadge = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-400">Maintenance</Badge>;
      case 'rental':
        return <Badge className="bg-primary hover:bg-primary/90">Rental</Badge>;
      case 'damage':
        return <Badge variant="destructive">Damage</Badge>;
      default:
        return null;
    }
  };
  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'maintenance':
        return <div className="flex items-center gap-2">
            <span>{event.service_type}</span>
            <Badge variant="outline" className="bg-green-400 hover:bg-green-300">
              {event.status}
            </Badge>
          </div>;
      case 'rental':
        return <div className="flex items-center gap-2 flex-wrap">
            <span>Rented to </span>
            <button onClick={() => setSelectedCustomerId(event.customer_id)} className="text-primary hover:underline font-medium">
              {event.profiles?.full_name}
            </button>
            <span className="text-muted-foreground mx-1">•</span>
            <button onClick={() => setSelectedAgreementId(event.id)} className="flex items-center gap-1 text-primary hover:underline">
              <Link className="h-4 w-4" />
              <span>Agreement #{event.agreement_number}</span>
            </button>
            <span className="text-muted-foreground mx-1">•</span>
            <Badge variant={event.status === 'active' ? 'default' : 'outline'} className="bg-rose-600 hover:bg-rose-500">
              {event.status}
            </Badge>
          </div>;
      case 'damage':
        return event.description;
      default:
        return '';
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Vehicle Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map(event => <div key={`${event.type}-${event.id}`} className={`flex items-start gap-4 border-l-2 pl-4 ${event.type === 'rental' && event.status === 'closed' ? 'border-neutral-200' : event.type === 'rental' ? 'border-primary' : 'border-muted'}`}>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventBadge(event.type)}
                    <div className="text-sm font-medium">{getEventDescription(event)}</div>
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {formatDateToDisplay(new Date(event.date))}
                  </time>
                </div>
              </div>
            </div>)}
        </div>

        <CustomerDetailsDialog customerId={selectedCustomerId || ""} open={!!selectedCustomerId} onOpenChange={open => !open && setSelectedCustomerId(null)} />

        <AgreementDetailsDialog agreementId={selectedAgreementId || ""} open={!!selectedAgreementId} onOpenChange={open => !open && setSelectedAgreementId(null)} />
      </CardContent>
    </Card>;
};