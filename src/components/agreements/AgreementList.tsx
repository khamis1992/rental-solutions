import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceDialog } from "./InvoiceDialog";
import { PaymentTrackingDialog } from "./PaymentTrackingDialog";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { AgreementDetailsDialog } from "./AgreementDetailsDialog";
import { DeleteAgreementDialog } from "./DeleteAgreementDialog";
import { AgreementFilters } from "./AgreementFilters";
import { AgreementListHeader } from "./list/AgreementListHeader";
import { AgreementListContent } from "./list/AgreementListContent";
import { useAgreementList } from "./list/useAgreementList";

export const AgreementList = () => {
  const navigate = useNavigate();
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [selectedPaymentTrackingId, setSelectedPaymentTrackingId] = useState<string | null>(null);
  const [selectedPaymentHistoryId, setSelectedPaymentHistoryId] = useState<string | null>(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    agreements,
    totalPages,
    isLoading,
    error,
    handleViewContract,
    handlePrintContract,
    refetch,
  } = useAgreementList();

  const handleViewContractClick = async (agreementId: string) => {
    const agreement = await handleViewContract(agreementId);
    if (agreement) {
      navigate(`/agreements/${agreementId}/view`);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading agreements...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error loading agreements: {error.message}</div>;
  }

  if (!agreements || agreements.length === 0) {
    return <div className="text-center py-4">No agreements found. Try importing some agreements first.</div>;
  }

  return (
    <div className="space-y-6">
      <AgreementFilters
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onSortChange={setSortOrder}
      />
      
      <AgreementListContent
        agreements={agreements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onViewContract={handleViewContractClick}
        onPrintContract={handlePrintContract}
        onAgreementClick={setSelectedAgreementId}
        onNameClick={setSelectedDetailsId}
        onDeleteClick={setAgreementToDelete}
        onDeleted={refetch}
      />
      
      <InvoiceDialog
        agreementId={selectedAgreementId || ""}
        open={Boolean(selectedAgreementId)}
        onOpenChange={(open) => !open && setSelectedAgreementId(null)}
      />

      <PaymentTrackingDialog
        agreementId={selectedPaymentTrackingId || ""}
        open={Boolean(selectedPaymentTrackingId)}
        onOpenChange={(open) => !open && setSelectedPaymentTrackingId(null)}
      />

      <PaymentHistoryDialog
        agreementId={selectedPaymentHistoryId || ""}
        open={Boolean(selectedPaymentHistoryId)}
        onOpenChange={(open) => !open && setSelectedPaymentHistoryId(null)}
      />

      <AgreementDetailsDialog
        agreementId={selectedDetailsId || ""}
        open={Boolean(selectedDetailsId)}
        onOpenChange={(open) => !open && setSelectedDetailsId(null)}
      />

      <DeleteAgreementDialog
        agreementId={agreementToDelete || ""}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={refetch}
      />
    </div>
  );
};