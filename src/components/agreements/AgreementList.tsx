import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Table, TableBody } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceDialog } from "./InvoiceDialog";
import { PaymentTrackingDialog } from "./PaymentTrackingDialog";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { AgreementTableHeader } from "./table/AgreementTableHeader";
import { AgreementTableRow } from "./table/AgreementTableRow";
import { useAgreements } from "./hooks/useAgreements";
import type { Agreement } from "./hooks/useAgreements";
import { AgreementDetailsDialog } from "./AgreementDetailsDialog";
import { VehicleTablePagination } from "../vehicles/table/VehicleTablePagination";
import { AgreementFilters } from "./AgreementFilters";
import { DeleteAgreementDialog } from "./DeleteAgreementDialog";

const ITEMS_PER_PAGE = 10;

export const AgreementList = () => {
  const navigate = useNavigate();
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [selectedPaymentTrackingId, setSelectedPaymentTrackingId] = useState<string | null>(null);
  const [selectedPaymentHistoryId, setSelectedPaymentHistoryId] = useState<string | null>(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<string | null>(null);

  const { data: agreements = [], isLoading, error, refetch } = useAgreements();

  const handleViewContract = async (agreementId: string) => {
    try {
      const { data: agreement, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (error) throw error;

      if (agreement) {
        navigate(`/agreements/${agreementId}/view`);
      } else {
        toast.error("Agreement not found");
      }
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast.error("Failed to view contract");
    }
  };

  const handlePrintContract = async (agreementId: string) => {
    try {
      const { data: agreement, error } = await supabase
        .from('leases')
        .select(`
          *,
          vehicles (make, model, year),
          profiles (full_name, address)
        `)
        .eq('id', agreementId)
        .single();

      if (error) throw error;

      if (agreement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Rental Agreement - ${agreement.id}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .section { margin-bottom: 20px; }
                  .footer { margin-top: 50px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>Rental Agreement</h1>
                  <p>Agreement ID: ${agreement.id}</p>
                </div>
                <div class="section">
                  <h2>Vehicle Details</h2>
                  <p>${agreement.vehicles.year} ${agreement.vehicles.make} ${agreement.vehicles.model}</p>
                </div>
                <div class="section">
                  <h2>Customer Details</h2>
                  <p>${agreement.profiles.full_name}</p>
                  <p>${agreement.profiles.address}</p>
                </div>
                <div class="section">
                  <h2>Agreement Terms</h2>
                  <p>Start Date: ${new Date(agreement.start_date).toLocaleDateString()}</p>
                  <p>End Date: ${new Date(agreement.end_date).toLocaleDateString()}</p>
                  <p>Total Amount: ${agreement.total_amount}</p>
                </div>
                <div class="footer">
                  <p>Signatures:</p>
                  <div style="margin-top: 30px;">
                    <div style="float: left; width: 45%;">
                      ____________________<br>
                      Customer Signature
                    </div>
                    <div style="float: right; width: 45%;">
                      ____________________<br>
                      Company Representative
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        } else {
          toast.error("Unable to open print window");
        }
      } else {
        toast.error("Agreement not found");
      }
    } catch (error) {
      console.error('Error printing contract:', error);
      toast.error("Failed to print contract");
    }
  };

  // Filter and sort agreements
  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      !searchQuery ||
      agreement.agreement_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.vehicle?.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || agreement.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort agreements
  const sortedAgreements = [...filteredAgreements].sort((a, b) => {
    switch (sortOrder) {
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "amount-high":
        return b.total_amount - a.total_amount;
      case "amount-low":
        return a.total_amount - b.total_amount;
      default: // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPages = Math.ceil(sortedAgreements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAgreements = sortedAgreements.slice(startIndex, endIndex);

  if (isLoading) {
    return <div className="text-center py-4">Loading agreements...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error loading agreements: {error.message}</div>;
  }

  if (!agreements || agreements.length === 0) {
    return <div className="text-center py-4">No agreements found. Try importing some agreements first.</div>;
  }

  const handleAgreementDeleted = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <AgreementFilters
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onSortChange={setSortOrder}
      />
      
      <div className="rounded-md border">
        <Table>
          <AgreementTableHeader />
          <TableBody>
            {currentAgreements.map((agreement: Agreement) => (
              <AgreementTableRow
                key={agreement.id}
                agreement={agreement}
                onViewContract={handleViewContract}
                onPrintContract={handlePrintContract}
                onAgreementClick={setSelectedAgreementId}
                onNameClick={setSelectedDetailsId}
                onDeleted={handleAgreementDeleted}
                onDeleteClick={() => {
                  setAgreementToDelete(agreement.id);
                  setShowDeleteDialog(true);
                }}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center mt-4">
        <VehicleTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      
      <InvoiceDialog
        agreementId={selectedAgreementId || ""}
        open={!!selectedAgreementId}
        onOpenChange={(open) => !open && setSelectedAgreementId(null)}
      />

      <PaymentTrackingDialog
        agreementId={selectedPaymentTrackingId || ""}
        open={!!selectedPaymentTrackingId}
        onOpenChange={(open) => !open && setSelectedPaymentTrackingId(null)}
      />

      <PaymentHistoryDialog
        agreementId={selectedPaymentHistoryId || ""}
        open={!!selectedPaymentHistoryId}
        onOpenChange={(open) => !open && setSelectedPaymentHistoryId(null)}
      />

      <AgreementDetailsDialog
        agreementId={selectedDetailsId || ""}
        open={!!selectedDetailsId}
        onOpenChange={(open) => !open && setSelectedDetailsId(null)}
      />

      <DeleteAgreementDialog
        agreementId={agreementToDelete || ""}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={handleAgreementDeleted}
      />
    </div>
  );
};
