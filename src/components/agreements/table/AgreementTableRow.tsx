import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDateToDisplay } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Info, Car, User, Truck, Calendar, Activity } from "lucide-react";
import type { Agreement } from "@/types/agreement.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DeleteAgreementDialog } from "../DeleteAgreementDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgreementEditor } from "../print/AgreementEditor";

interface AgreementTableRowProps {
  agreement: Agreement;
  onViewContract: (id: string) => void;
  onPrintContract: (id: string) => void;
  onAgreementClick: (id: string) => void;
  onNameClick: (id: string) => void;
  onDeleted: () => void;
  onDeleteClick: () => void;
}

export const AgreementTableRow = ({
  agreement,
  onAgreementClick,
  onNameClick,
  onDeleted,
  onDeleteClick,
}: AgreementTableRowProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false);
  const [templateContent, setTemplateContent] = React.useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-400';
      case 'pending_payment':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-400';
      case 'terminated':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-400';
    }
  };

  const handleViewTemplate = async () => {
    try {
      const { data: templateData, error } = await supabase
        .from("agreement_templates")
        .select("content")
        .eq("id", agreement.template_id)
        .single();

      if (error) throw error;

      if (!templateData?.content) {
        toast.error("No template content found");
        return;
      }

      let content = templateData.content
        .replace(/{{customer\.customer_name}}/g, agreement.customer?.full_name || "")
        .replace(/{{customer\.phone_number}}/g, agreement.customer?.phone_number || "")
        .replace(/{{vehicle\.make}}/g, agreement.vehicle?.make || "")
        .replace(/{{vehicle\.model}}/g, agreement.vehicle?.model || "")
        .replace(/{{vehicle\.year}}/g, agreement.vehicle?.year?.toString() || "")
        .replace(/{{vehicle\.license_plate}}/g, agreement.vehicle?.license_plate || "")
        .replace(/{{agreement\.agreement_number}}/g, agreement.agreement_number || "")
        .replace(/{{agreement\.start_date}}/g, formatDateToDisplay(agreement.start_date))
        .replace(/{{agreement\.end_date}}/g, formatDateToDisplay(agreement.end_date));

      setTemplateContent(content);
      setShowTemplateDialog(true);
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template");
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors group">
      <TableCell>
        <button
          onClick={() => onNameClick(agreement.id)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium group-hover:translate-x-1 transition-all duration-300"
        >
          <FileText className="h-4 w-4" />
          {agreement.agreement_number}
        </button>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onNameClick(agreement.id)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 group-hover:translate-x-1 transition-all duration-300"
        >
          <Car className="h-4 w-4" />
          {agreement.vehicle?.license_plate}
        </button>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2 font-medium">
          <Truck className="h-4 w-4 text-gray-500" />
          {`${agreement.vehicle?.make} ${agreement.vehicle?.model}`}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2 font-medium truncate max-w-[200px]">
          <User className="h-4 w-4 text-gray-500 shrink-0" />
          {agreement.customer?.full_name}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          {formatDateToDisplay(agreement.start_date)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          {formatDateToDisplay(agreement.end_date)}
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={`capitalize ${getStatusColor(agreement.status)} border px-3 py-1 transition-all duration-300 group-hover:scale-105`}
        >
          <Activity className="h-3 w-3 mr-1 inline-block" />
          {agreement.status}
        </Badge>
      </TableCell>
      
      <TableCell className="text-right space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewTemplate}
                className="hover:bg-primary/10 transition-colors duration-300"
              >
                <FileText className="h-4 w-4 text-primary hover:text-primary/80 transition-colors duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Agreement Template</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNameClick(agreement.id)}
                className="hover:bg-blue-100 transition-colors duration-300"
              >
                <Info className="h-4 w-4 text-blue-600 hover:text-blue-500 transition-colors duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Agreement Details</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="hover:bg-red-100 transition-colors duration-300"
              >
                <Trash2 className="h-4 w-4 text-red-600 hover:text-red-500 transition-colors duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Agreement</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DeleteAgreementDialog
          agreementId={agreement.id}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDeleted={onDeleted}
        />

        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl">
            <AgreementEditor initialContent={templateContent} />
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};
