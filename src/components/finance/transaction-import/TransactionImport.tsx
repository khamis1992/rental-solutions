import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TransactionPreviewTable } from "./TransactionPreviewTable";
import { FileUploadSection } from "./components/FileUploadSection";
import { ImportActions } from "./components/ImportActions";

export const TransactionImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        const rows = csvContent.split('\n')
          .map(row => {
            const values = row.split(',').map(value => value.trim());
            return {
              agreement_number: values[0] || '',
              customer_name: values[1] || '',
              amount: parseFloat(values[2]) || 0,
              license_plate: values[3] || '',
              vehicle: values[4] || '',
              payment_date: values[5] || '',
              payment_method: values[6] || '',
              payment_number: values[7] || '',
              description: values[8] || ''
            };
          })
          .filter((row, index) => index > 0);

        setImportedData(rows);

        // Save to Supabase
        const { data, error: functionError } = await supabase.functions
          .invoke('process-transaction-import', {
            body: { rows }
          });

        if (functionError) {
          console.error('Import error:', functionError);
          toast({
            title: "Error",
            description: "Failed to import transactions. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setCurrentImportId(data?.importId);

        toast({
          title: "Success",
          description: `Successfully imported ${rows.length} transactions`,
        });

      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import transactions",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssigned = () => {
    // Refresh the preview table or other relevant data
    // This will be called after auto-assignment completes
  };

  return (
    <div className="space-y-4">
      <FileUploadSection 
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
      />
      {currentImportId && (
        <ImportActions
          importId={currentImportId}
          onAssigned={handleAssigned}
          disabled={isUploading}
        />
      )}
      {importedData.length > 0 && (
        <TransactionPreviewTable 
          data={importedData}
          onDataChange={setImportedData}
        />
      )}
    </div>
  );
};