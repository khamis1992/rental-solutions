import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseWorkflowManager } from "./workflow/CaseWorkflowManager";
import { CommunicationsList } from "./communications/CommunicationsList";
import { SettlementsList } from "./settlements/SettlementsList";
import { SettlementDialog } from "./settlements/SettlementDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ViewLegalCaseDialogProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewLegalCaseDialog = ({
  caseId,
  open,
  onOpenChange,
}: ViewLegalCaseDialogProps) => {
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: legalCase, isLoading, error } = useQuery({
    queryKey: ["legal-case", caseId],
    queryFn: async () => {
      if (!caseId) {
        return null;
      }

      const { data, error } = await supabase
        .from("legal_cases")
        .select(`
          *,
          customer:profiles!legal_cases_customer_id_fkey (
            full_name,
            phone_number,
            email,
            address
          )
        `)
        .eq("id", caseId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching legal case:", error);
        toast.error("Failed to load case details");
        throw error;
      }

      if (!data) {
        toast.error("Case not found");
        return null;
      }

      return data;
    },
    enabled: Boolean(caseId) && open,
  });

  const handleStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ["legal-case", caseId] });
  };

  if (error) {
    return null;
  }

  if (isLoading || !legalCase) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow">
            <CaseWorkflowManager
              caseId={caseId}
              currentStatus={legalCase?.status}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="communications">
            <CommunicationsList caseId={caseId} />
          </TabsContent>

          <TabsContent value="settlements">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowSettlementDialog(true)}
                  className="mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Settlement
                </Button>
              </div>
              <SettlementsList caseId={caseId} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <SettlementDialog
        caseId={caseId}
        open={showSettlementDialog}
        onOpenChange={setShowSettlementDialog}
      />
    </Dialog>
  );
};