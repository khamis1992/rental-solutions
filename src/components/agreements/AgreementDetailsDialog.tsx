import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentForm } from "./details/PaymentForm";
import { InvoiceList } from "./details/InvoiceList";
import { DocumentUpload } from "./details/DocumentUpload";
import { DamageAssessment } from "./details/DamageAssessment";
import { TrafficFines } from "./details/TrafficFines";
import { RentManagement } from "./details/RentManagement";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AgreementHeader } from "./AgreementHeader";

interface AgreementDetailsDialogProps {
  agreementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgreementDetailsDialog = ({
  agreementId,
  open,
  onOpenChange,
}: AgreementDetailsDialogProps) => {
  const queryClient = useQueryClient();

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement-details', agreementId],
    queryFn: async () => {
      const [{ data: agreement, error: agreementError }, { data: remainingAmount, error: remainingError }] = await Promise.all([
        supabase
          .from('leases')
          .select(`
            *,
            customer:profiles (
              id,
              full_name,
              phone_number,
              address
            ),
            vehicle:vehicles (
              id,
              make,
              model,
              year,
              license_plate
            )
          `)
          .eq('id', agreementId)
          .single(),
        supabase
          .from('remaining_amounts')
          .select('*')
          .eq('lease_id', agreementId)
          .maybeSingle()
      ]);

      if (agreementError) throw agreementError;
      
      return {
        ...agreement,
        remainingAmount
      };
    },
    enabled: !!agreementId && open,
  });

  // Set up real-time subscription for both leases and remaining_amounts tables
  useEffect(() => {
    if (!agreementId || !open) return;

    const channel = supabase
      .channel('agreement-details-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leases',
          filter: `id=eq.${agreementId}`
        },
        async (payload) => {
          console.log('Real-time update received for agreement:', payload);
          await queryClient.invalidateQueries({ queryKey: ['agreement-details', agreementId] });
          toast.info('Agreement details updated');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remaining_amounts',
          filter: `lease_id=eq.${agreementId}`
        },
        async (payload) => {
          console.log('Real-time update received for remaining amounts:', payload);
          await queryClient.invalidateQueries({ queryKey: ['agreement-details', agreementId] });
          toast.info('Remaining amounts updated');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agreementId, open, queryClient]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agreement Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading agreement details...</div>
        ) : agreement ? (
          <div className="space-y-6">
            <AgreementHeader 
              agreement={agreement} 
              remainingAmount={agreement.remainingAmount}
            />

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p>{agreement.customer?.full_name}</p>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <p>{agreement.customer?.phone_number}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <p>{agreement.customer?.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle</Label>
                    <p>{`${agreement.vehicle?.year} ${agreement.vehicle?.make} ${agreement.vehicle?.model}`}</p>
                  </div>
                  <div>
                    <Label>License Plate</Label>
                    <p>{agreement.vehicle?.license_plate}</p>
                  </div>
                  <div>
                    <Label>Initial Mileage</Label>
                    <p>{agreement.initial_mileage}</p>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <p>{agreement.total_amount} QAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="damages">Damages</TabsTrigger>
                <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
                {agreement.status === 'active' && (
                  <TabsTrigger value="rent">Rent Management</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="payments">
                <PaymentForm agreementId={agreementId} />
              </TabsContent>
              <TabsContent value="invoices">
                <InvoiceList agreementId={agreementId} />
              </TabsContent>
              <TabsContent value="documents">
                <DocumentUpload agreementId={agreementId} />
              </TabsContent>
              <TabsContent value="damages">
                <DamageAssessment agreementId={agreementId} />
              </TabsContent>
              <TabsContent value="fines">
                <TrafficFines agreementId={agreementId} />
              </TabsContent>
              {agreement.status === 'active' && (
                <TabsContent value="rent">
                  <Card>
                    <CardContent className="pt-6">
                      <RentManagement 
                        agreementId={agreementId}
                        initialRentAmount={agreement.rent_amount}
                        initialRentDueDay={agreement.rent_due_day}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        ) : (
          <div>Agreement not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};