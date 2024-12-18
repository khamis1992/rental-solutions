import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export const AgreementImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    let pollInterval: number;

    try {
      console.log('Starting file upload process...', file);
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      console.log('Uploading file to storage:', fileName);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("imports")
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);
      setProgress(20);

      console.log('Creating import log...');
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

      setProgress(40);
      console.log('Starting import process via Edge Function...');
      
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('process-agreement-import', {
          body: { fileName },
          headers: {
            'Content-Type': 'application/json',
          }
        });

      if (functionError) {
        console.error('Edge Function error:', functionError);
        throw functionError;
      }

      console.log('Edge Function response:', functionData);
      setProgress(60);

      // Poll for import completion with increasing intervals
      let pollCount = 0;
      const maxPolls = 10;
      
      pollInterval = window.setInterval(async () => {
        console.log('Checking import status...');
        const { data: importLog } = await supabase
          .from("import_logs")
          .select("status, records_processed")
          .eq("file_name", fileName)
          .single();

        console.log('Import log status:', importLog);
        pollCount++;
        
        setProgress(60 + (pollCount * 4));

        if (importLog?.status === "completed") {
          window.clearInterval(pollInterval);
          setProgress(100);
          toast({
            title: "Success",
            description: `Successfully imported ${importLog.records_processed} agreements`,
          });
          
          await queryClient.invalidateQueries({ queryKey: ["agreements"] });
          await queryClient.invalidateQueries({ queryKey: ["agreements-stats"] });
          
          setIsUploading(false);
        } else if (importLog?.status === "error" || pollCount >= maxPolls) {
          window.clearInterval(pollInterval);
          throw new Error("Import failed or timed out");
        }
      }, 2000);

      // Set a timeout to stop polling after 30 seconds
      setTimeout(() => {
        if (pollInterval) {
          window.clearInterval(pollInterval);
        }
        if (isUploading) {
          setIsUploading(false);
          toast({
            title: "Error",
            description: "Import timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 30000);

    } catch (error: any) {
      console.error('Import process error:', error);
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to import agreements",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Agreement Number,License No,full_name,License Number,Check-out Date,Check-in Date,Return Date,STATUS\n" +
                      "AGR001,LIC123,John Doe,DL456,27/03/2024,28/03/2024,29/03/2024,active";
    
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing agreements...
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
};