import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateAgreementDialog } from "@/components/agreements/CreateAgreementDialog";
import { ProcessTemplatesDialog } from "@/components/agreements/ProcessTemplatesDialog";
import { useState } from "react";
interface AgreementListHeaderProps {
  onImportClick: () => void;
  onDeleteClick: () => void;
  isDeleting: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}
export const AgreementListHeader = ({
  onImportClick,
  onDeleteClick,
  isDeleting,
  searchQuery = "",
  onSearchChange
}: AgreementListHeaderProps) => {
  const [showProcessTemplates, setShowProcessTemplates] = useState(false);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search input changed:", e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };
  return <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full mb-6">
      <div className="relative w-full max-w-md">
        
        
      </div>
      
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="lg" className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 gap-2 group shadow-sm hover:shadow-md h-11" onClick={() => setShowProcessTemplates(true)}>
                <FileText className="h-5 w-5" />
                Process Templates
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Process agreement templates</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="lg" className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 gap-2 group shadow-sm hover:shadow-md h-11">
                <Download className="h-5 w-5 group-hover:translate-y-[2px] transition-transform duration-300" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CreateAgreementDialog>
                <Button variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-11">
                  <Upload className="h-5 w-5 mr-2" />
                  Create Agreement
                </Button>
              </CreateAgreementDialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create new agreement (⌘ N)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ProcessTemplatesDialog open={showProcessTemplates} onOpenChange={setShowProcessTemplates} />
      </div>
    </div>;
};