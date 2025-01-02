import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { InvoiceDialog } from "../InvoiceDialog";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface InvoiceListProps {
  agreementId: string;
}

export const InvoiceList = ({ agreementId }: InvoiceListProps) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["agreement-invoices", agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_invoices")
        .select("*")
        .eq("customer_id", agreementId)
        .order("issued_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoices</h3>
        <Button onClick={() => setSelectedInvoiceId(agreementId)} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices?.length ? (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.issued_date 
                    ? format(new Date(invoice.issued_date), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{invoice.amount} QAR</TableCell>
                <TableCell className="capitalize">
                  {invoice.status?.toLowerCase() || '-'}
                </TableCell>
                <TableCell>
                  {invoice.due_date
                    ? format(new Date(invoice.due_date), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <InvoiceDialog
        agreementId={selectedInvoiceId || ""}
        open={Boolean(selectedInvoiceId)}
        onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
      />
    </div>
  );
};