import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { injectPrintStyles } from "@/lib/printStyles";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHeader } from "./document/DocumentHeader";
import { DocumentContent } from "./document/DocumentContent";
import { DocumentVersionControl } from "./document/DocumentVersionControl";
import { DocumentSignature } from "./document/DocumentSignature";
import { DocumentClassification } from "./document/DocumentClassification";
import { ContractAnalysis } from "./document/ContractAnalysis";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

interface LegalDocumentDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegalDocumentDialog({
  customerId,
  open,
  onOpenChange,
}: LegalDocumentDialogProps) {
  const [currentVersion, setCurrentVersion] = useState(1);

  const { data: customerData, isLoading } = useQuery({
    queryKey: ["legal-document", customerId],
    queryFn: async () => {
      if (!customerId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          leases (
            id,
            payment_schedules (
              id,
              due_date,
              amount,
              status
            ),
            traffic_fines (
              id,
              violation_date,
              fine_amount,
              fine_type,
              payment_status
            ),
            damages (
              id,
              description,
              repair_cost,
              reported_date,
              status
            )
          )
        `)
        .eq("id", customerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && Boolean(customerId),
  });

  const { data: versions } = useQuery({
    queryKey: ["document-versions", customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("legal_document_versions")
        .select("*")
        .eq("document_id", customerId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && Boolean(customerId),
  });

  const handleSignatureCapture = async (signature: string) => {
    if (!customerId) return;

    try {
      const { data: versionData, error: fetchError } = await supabase
        .from("legal_document_versions")
        .select("signatures")
        .eq("document_id", customerId)
        .eq("version_number", currentVersion)
        .single();

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const currentSignatures = versionData?.signatures as string[] || [];
      const newSignatures = [...currentSignatures, signature];

      const { error } = await supabase
        .from("legal_document_versions")
        .update({ 
          signatures: newSignatures,
          signature_status: 'signed',
          metadata: {
            signed_at: new Date().toISOString(),
            signed_by: user.id
          }
        })
        .eq("document_id", customerId)
        .eq("version_number", currentVersion);

      if (error) throw error;
      toast.success("Document signed successfully");
    } catch (error: any) {
      console.error("Error saving signature:", error);
      toast.error(error.message || "Failed to save signature");
    }
  };

  const handlePrint = () => {
    injectPrintStyles();
    window.print();
  };

  if (!open) return null;

  const currentVersionData = versions?.find(v => v.version_number === currentVersion);
  const canSign = currentVersionData?.signature_status !== 'signed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <div className="p-6">
          <DocumentHeader 
            customerName={customerData?.full_name} 
            onPrint={handlePrint} 
          />
        </div>
        
        <Separator />
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-6 p-6 h-full">
            <div className="col-span-2 overflow-hidden">
              <DocumentContent 
                customerData={customerData} 
                isLoading={isLoading} 
              />
            </div>
            <div className="space-y-6 overflow-y-auto pr-2">
              <Card className="p-4">
                <DocumentVersionControl
                  versions={versions || []}
                  currentVersion={currentVersion}
                  onVersionChange={setCurrentVersion}
                />
              </Card>
              
              <DocumentClassification
                documentId={customerId}
              />
              
              <ContractAnalysis
                documentId={customerId}
              />
              
              <DocumentSignature
                onSignatureCapture={handleSignatureCapture}
                signatureStatus={currentVersionData?.signature_status || 'pending'}
                disabled={!canSign}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}