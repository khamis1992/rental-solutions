import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { CustomerDetailsDialog } from "@/components/customers/CustomerDetailsDialog";
import { AgreementDetailsDialog } from "@/components/agreements/AgreementDetailsDialog";

interface AssociatedAgreementsProps {
  vehicleId: string;
}

export const AssociatedAgreements = ({ vehicleId }: AssociatedAgreementsProps) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  const { data: agreements, isLoading } = useQuery({
    queryKey: ["agreements", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          profiles:customer_id (
            id,
            full_name
          )
        `)
        .eq("vehicle_id", vehicleId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Associated Agreements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements?.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>
                  <button
                    onClick={() => setSelectedAgreementId(agreement.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {agreement.agreement_number}
                  </button>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => setSelectedCustomerId(agreement.customer_id)}
                    className="text-blue-600 hover:underline"
                  >
                    {agreement.profiles?.full_name}
                  </button>
                </TableCell>
                <TableCell>
                  {new Date(agreement.start_date).toLocaleDateString()} -{" "}
                  {new Date(agreement.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{formatCurrency(agreement.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      agreement.status === "active"
                        ? "default"
                        : agreement.status === "pending_payment"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {agreement.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CustomerDetailsDialog
          customerId={selectedCustomerId || ""}
          open={Boolean(selectedCustomerId)}
          onOpenChange={(open) => !open && setSelectedCustomerId(null)}
        />

        <AgreementDetailsDialog
          agreementId={selectedAgreementId || ""}
          open={Boolean(selectedAgreementId)}
          onOpenChange={(open) => !open && setSelectedAgreementId(null)}
        />
      </CardContent>
    </Card>
  );
};