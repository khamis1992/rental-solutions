import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAnalysisCard } from "@/components/finance/transactions/AIAnalysisCard";
import { FileUploadSection } from "@/components/finance/transactions/FileUploadSection";
import { useImportProcess } from "@/components/finance/transactions/hooks/useImportProcess";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const TransactionImportTool = () => {
  const {
    isUploading,
    isAnalyzing,
    analysisResult,
    startImport,
    implementChanges
  } = useImportProcess();

  const queryClient = useQueryClient();

  // Query to fetch imported transactions
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
      "Lease_ID",
      "Customer_Name",
      "Amount",
      "License_Plate",
      "Vehicle",
      "Payment_Date",
      "Payment_Method",
      "Transaction_ID",
      "Description",
      "Type",
      "Status"
    ].join(",");
    
    const sampleData = "lease-uuid,John Doe,1000.00,ABC123,Toyota Camry,2024-01-01,credit_card,TRX001,Monthly Payment,payment,completed";
    const csvContent = `${headers}\n${sampleData}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transaction_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await startImport(file);
    if (!success) {
      event.target.value = '';
    }
  };

  const handleImplementChanges = async () => {
    try {
      // First implement the changes
      await implementChanges();
      
      // Wait for the database to update (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the data was imported by checking the latest imports
      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      
      const { data: verificationData, error: verificationError } = await supabase
        .from("financial_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (verificationError) {
        console.error("Verification error:", verificationError);
        toast.error("Error verifying import: " + verificationError.message);
        return;
      }

      // Additional check to ensure we have the expected data
      if (!verificationData || verificationData.length === 0) {
        console.error("No imported data found during verification");
        
        // Retry verification after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: retryData, error: retryError } = await supabase
          .from("financial_imports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (retryError || !retryData || retryData.length === 0) {
          console.error("Verification retry failed:", retryError || "No data found");
          toast.error("Import verification failed. Please try again.");
          return;
        }
        
        console.log("Import verified successfully on retry:", retryData[0]);
        toast.success("Changes implemented successfully");
      } else {
        console.log("Import verified successfully:", verificationData[0]);
        toast.success("Changes implemented successfully");
      }
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

        {/* Display imported transactions */}
        {importedTransactions && importedTransactions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Imported Transactions</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.payment_date), "PP")}
                      </TableCell>
                      <TableCell>{transaction.customer_name}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};