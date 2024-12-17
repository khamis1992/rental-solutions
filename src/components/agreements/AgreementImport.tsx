import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export const AgreementImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast({
        title: "Error",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting file upload process...');
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      console.log('Uploading file to storage:', fileName);
      const { error: uploadError } = await supabase.storage
        .from("imports")
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully, creating import log...');
      const { error: logError } = await supabase
        .from("import_logs")
        .insert({
          file_name: fileName,
          import_type: "agreements",
          status: "pending",
        });

      if (logError) {
        console.error('Import log creation error:', logError);
        throw logError;
      }

      console.log('Starting import process via Edge Function...');
      const { error: functionError } = await supabase.functions
        .invoke('process-agreement-import', {
          body: { fileName }
        });

      if (functionError) {
        console.error('Edge Function error:', functionError);
        throw functionError;
      }

      // Poll for import completion
      const pollInterval = setInterval(async () => {
        console.log('Checking import status...');
        const { data: importLog } = await supabase
          .from("import_logs")
          .select("status, records_processed")
          .eq("file_name", fileName)
          .single();

        if (importLog?.status === "completed") {
          clearInterval(pollInterval);
          toast({
            title: "Success",
            description: `Successfully imported ${importLog.records_processed} agreements`,
          });
          
          // Force refresh the queries
          await queryClient.invalidateQueries({ queryKey: ["agreements"] });
          
          setIsUploading(false);
        } else if (importLog?.status === "error") {
          clearInterval(pollInterval);
          throw new Error("Import failed");
        }
      }, 1000);

      // Set a timeout to stop polling after 15 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isUploading) {
          setIsUploading(false);
          toast({
            title: "Error",
            description: "Import timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 15000);

    } catch (error: any) {
      console.error('Import process error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "customer_identifier,vehicle_id,start_date,end_date,total_amount,initial_mileage,agreement_type,down_payment,monthly_payment,interest_rate,lease_duration\n" +
                      "John Doe,1,2024-03-20,2025-03-20,50000,1000,lease_to_own,5000,1000,5,12";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'agreement_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <Button
          variant="outline"
          onClick={downloadTemplate}
          disabled={isUploading}
        >
          Download Template
        </Button>
      </div>
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Importing agreements...
        </div>
      )}
    </div>
  );
};