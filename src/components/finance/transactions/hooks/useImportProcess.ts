import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateFileContent, repairCSVLine } from "../utils/importValidation";

export const useImportProcess = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const startImport = async (file: File) => {
    setIsUploading(true);
    setIsAnalyzing(true);
    try {
      console.log('Starting file analysis...');
      
      // First read the file content as text
      const fileContent = await file.text();
      console.log('File content length:', fileContent.length);
      
      // Validate file content
      if (!validateFileContent(fileContent)) {
        toast.error("Invalid file format. Please check the console for details.");
        return false;
      }

      // Create FormData with validated content
      const formData = new FormData();
      const validatedFile = new File([fileContent], file.name, { type: 'text/csv' });
      formData.append('file', validatedFile);
      
      const { data: aiAnalysis, error: analysisError } = await supabase.functions
        .invoke('analyze-transaction-import', {
          body: formData,
        });

      if (analysisError) {
        console.error('AI Analysis error:', analysisError);
        toast.error(analysisError.message || "Failed to analyze file");
        return false;
      }

      console.log('AI Analysis complete:', aiAnalysis);

      // Transform the analysis result
      const transformedAnalysis = {
        success: aiAnalysis.success,
        totalRows: aiAnalysis.totalRows,
        validRows: aiAnalysis.validRows,
        invalidRows: aiAnalysis.invalidRows,
        totalAmount: aiAnalysis.totalAmount,
        rawData: [], 
        issues: aiAnalysis.issues || [],
        suggestions: aiAnalysis.suggestions || []
      };

      // Process the CSV content
      if (aiAnalysis.processedFileUrl) {
        const response = await fetch(aiAnalysis.processedFileUrl);
        const csvContent = await response.text();
        console.log('Processed CSV content length:', csvContent.length);
        
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rawData = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            // Repair line if needed
            const repairedLine = repairCSVLine(line, headers.length);
            const values = repairedLine.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index]?.trim() || '';
              return obj;
            }, {} as Record<string, string>);
          });

        console.log('Processed raw data count:', rawData.length);
        transformedAnalysis.rawData = rawData;
      }
      
      setAnalysisResult(transformedAnalysis);
      return true;
    } catch (error: any) {
      console.error("Import process error:", error);
      toast.error(error.message || "Failed to process import");
      return false;
    } finally {
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const implementChanges = async () => {
    if (!analysisResult) {
      toast.error("No analysis result available");
      return;
    }

    setIsUploading(true);
    try {
      console.log('Implementing changes with analysis result:', analysisResult);
      
      const { error } = await supabase.functions
        .invoke('process-payment-import', {
          body: { analysisResult }
        });

      if (error) throw error;
      
      // Wait for the database to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the import with retries
      let retryCount = 0;
      const maxRetries = 3;
      let importVerified = false;

      while (retryCount < maxRetries && !importVerified) {
        console.log(`Verification attempt ${retryCount + 1}`);
        
        const { data, error: verifyError } = await supabase
          .from("financial_imports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (verifyError) {
          console.error(`Verification error attempt ${retryCount + 1}:`, verifyError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw verifyError;
        }

        if (data && data.length > 0) {
          importVerified = true;
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!importVerified) {
        throw new Error(`Verification retry failed: No data found after ${maxRetries} attempts`);
      }

      await queryClient.invalidateQueries({ queryKey: ["imported-transactions"] });
      setAnalysisResult(null);
      toast.success("Changes implemented successfully");
      
    } catch (error: any) {
      console.error("Implementation error:", error);
      toast.error(error.message || "Failed to implement changes");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    isAnalyzing,
    analysisResult,
    startImport,
    implementChanges
  };
};