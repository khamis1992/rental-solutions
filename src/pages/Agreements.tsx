
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgreementListHeader } from "@/components/agreements/list/AgreementListHeader";
import { AgreementStats } from "@/components/agreements/AgreementStats";
import { CreateAgreementDialog } from "@/components/agreements/CreateAgreementDialog";
import { PaymentImport } from "@/components/agreements/PaymentImport";
import { ChevronRight, Building2, FileText, Search, AlertCircle, List, Grid2X2 } from "lucide-react";
import { useAgreements } from "@/components/agreements/hooks/useAgreements";
import { AgreementDetailsDialog } from "@/components/agreements/AgreementDetailsDialog";
import { type Agreement } from "@/types/agreement.types";
import { DeleteAgreementDialog } from "@/components/agreements/DeleteAgreementDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { EnhancedAgreementListV2 } from "@/components/agreements/v2/EnhancedAgreementListV2";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SearchInput } from "@/components/agreements/search/SearchInput";
import { ViewToggle } from "@/components/agreements/v2/ViewToggle";

const Agreements = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Get from localStorage or default to grid
    if (typeof window !== "undefined") {
      return (localStorage.getItem("agreement-view-mode") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  const {
    data: agreements = [],
    isLoading,
    isError,
    error,
    refetch
  } = useAgreements(searchQuery);

  const handleImportClick = () => {
    // Import handling logic
  };

  const handleViewDetails = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowDeleteDialog(true);
  };

  const handleDeleteComplete = () => {
    toast.success("Agreement deleted successfully");
    refetch();
    setShowDeleteDialog(false);
    setSelectedAgreement(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("agreement-view-mode", mode);
  };

  return <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-r from-[#2D2942]/5 via-[#2D2942]/10 to-[#2D2942]/5 border-b">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
          
          {/* Content Container */}
          <div className="relative w-full max-w-screen-xl mx-auto px-4 lg:px-8 py-8">
            {/* Enhanced Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm text-[#2D2942]/70 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#2D2942]/10 hover:bg-[#2D2942]/5 transition-all duration-300 shadow-sm">
                <Building2 className="h-4 w-4 text-[#2D2942]" />
                <span className="font-medium">Organization</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#2D2942]/30" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D2942]/5 backdrop-blur-md border border-[#2D2942]/10 shadow-sm">
                <span className="font-medium text-[#2D2942]">Agreements Management</span>
              </div>
            </nav>

            {/* Enhanced Title Section */}
            <div className="mb-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-[#2D2942] to-[#2D2942]/80 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2D2942] to-[#2D2942]/80 text-transparent bg-clip-text mb-2">
                    Agreements Management
                  </h1>
                  <p className="text-lg text-[#2D2942]/60">
                    Manage and track all your agreements efficiently
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex-1 relative">
                <SearchInput 
                  onSearch={handleSearchChange}
                  placeholder="Search agreements..."
                  initialValue={searchQuery}
                />
              </div>
              <div className="flex gap-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <ViewToggle initialMode={viewMode} onViewModeChange={handleViewModeChange} />
                  <AgreementListHeader onImportClick={handleImportClick} onDeleteClick={() => {}} isDeleting={false} />
                </div>
                <div className="flex-shrink-0">
                  <PaymentImport />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with Enhanced Styling */}
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Section with New Color Scheme */}
          <div className="py-8">
            <AgreementStats />
          </div>

          {/* Enhanced Agreements List with Loading/Error State */}
          <div className="pb-12">
            <ErrorBoundary>
              {isError ? <div className="bg-white border rounded-lg p-8 text-center shadow-sm">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <h3 className="text-xl font-semibold text-gray-800">Unable to load agreements</h3>
                    <p className="text-gray-600 max-w-md mb-4">
                      {error instanceof Error ? error.message : "There was an error fetching your agreements. This might be due to insufficient permissions."}
                    </p>
                    <Button onClick={() => refetch()} className="bg-[#2D2942] hover:bg-[#2D2942]/90">
                      Try Again
                    </Button>
                  </div>
                </div> : <EnhancedAgreementListV2 
                  agreements={agreements} 
                  onViewDetails={handleViewDetails} 
                  onDelete={handleDeleteClick} 
                  viewMode={viewMode} 
                  showLoadingState={isLoading} 
                  onViewModeChange={handleViewModeChange}
                />}
            </ErrorBoundary>
          </div>
        </div>

        {/* Dialogs */}
        <CreateAgreementDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

        {selectedAgreement && <>
            <AgreementDetailsDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} agreementId={selectedAgreement.id} />
            <DeleteAgreementDialog agreementId={selectedAgreement.id} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onDeleted={handleDeleteComplete} />
          </>}
      </div>
    </DashboardLayout>;
};

export default Agreements;
