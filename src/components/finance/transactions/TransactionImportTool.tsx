import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAnalysisCard } from "./AIAnalysisCard";
import { FileUploadSection } from "./FileUploadSection";
import { useImportProcess } from "./hooks/useImportProcess";
import { ImportedTransactionsTable } from "./ImportedTransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentImportData } from "./types/payment.types";

export const TransactionImportTool = () => {
  const {
    isUploading,
    isAnalyzing,
    analysisResult,
    startImport,
    implementChanges
  } = useImportProcess();

  const queryClient = useQueryClient();

  const { data: importedTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["imported-transactions"],
    queryFn: async () => {
      console.log("Fetching imported transactions");
      const { data, error } = await supabase
        .from("financial_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      console.log("Fetched transactions:", data);
      return data;
    }
  });

  const downloadTemplate = () => {
    const headers = [
      "lease_id",
      "amount",
      "payment_date",
      "payment_method",
      "status",
      "description",
      "transaction_id"
    ].join(",");
    
    const sampleData = "lease-uuid,1000.00,2024-03-20,WireTransfer,completed,Monthly Payment,TRX001";
    const csvContent = `${headers}\n${sampleData}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'payment_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await startImport(file);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
    }
  };

  const handleImplementChanges = async () => {
    try {
      await implementChanges();
      
      // Wait for the database to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      toast.success("Changes implemented successfully");
      
    } catch (error) {
      console.error("Implementation error:", error);
      toast.error("Failed to implement changes. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploadSection
          onFileUpload={handleFileUpload}
          onDownloadTemplate={downloadTemplate}
          isUploading={isUploading}
          isAnalyzing={isAnalyzing}
        />
        
        {analysisResult && (
          <AIAnalysisCard
            analysisResult={analysisResult}
            onImplementChanges={handleImplementChanges}
            isUploading={isUploading}
          />
        )}

        {importedTransactions && importedTransactions.length > 0 && (
          <ImportedTransactionsTable transactions={importedTransactions} />
        )}
      </CardContent>
    </Card>
  );
};