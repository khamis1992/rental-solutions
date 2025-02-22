
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgreementStats } from "@/components/agreements/AgreementStats";
import { CreateAgreementDialog } from "@/components/agreements/CreateAgreementDialog";
import { PaymentImport } from "@/components/agreements/PaymentImport";
import { ChevronRight, Building2, FileText, Grid2x2, List } from "lucide-react";
import { AgreementList } from "@/components/agreements/AgreementList";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Agreements = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Section with Professional Gradient */}
        <div className="relative bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-b">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
          
          {/* Content Container */}
          <div className="relative w-full max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
            {/* Enhanced Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 hover:bg-blue-50 transition-all duration-300 shadow-sm">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Organization</span>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-300" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 backdrop-blur-md border border-blue-200 shadow-sm">
                <span className="font-medium text-blue-700">Agreements Management</span>
              </div>
            </nav>

            {/* Title Section */}
            <div className="mb-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-transparent bg-clip-text mb-2">
                    Agreements Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage and track all your agreements efficiently
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons and View Toggle */}
            <div className="flex justify-between items-center gap-6 max-w-screen-xl mx-auto mb-6">
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex bg-white rounded-lg border shadow-sm p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="px-2"
                      >
                        <Grid2x2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="px-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle view mode</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex-shrink-0">
                <PaymentImport />
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <AgreementList viewMode={viewMode} />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <AgreementStats />
          </div>
        </div>

        <CreateAgreementDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </DashboardLayout>
  );
};

export default Agreements;
