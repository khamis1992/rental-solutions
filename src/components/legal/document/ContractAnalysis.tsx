import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ContractAnalysisProps {
  documentId: string;
}

interface ContractAnalysisMetadata {
  key_terms: string[];
  obligations: string[];
  risks: string[];
  recommendations: string[];
  analyzed_at: string;
}

interface AIDocumentClassification {
  id: string;
  document_id: string;
  classification_type: string;
  confidence_score: number;
  metadata: ContractAnalysisMetadata;
  created_at: string;
}

// Type guard to check if an object is a valid ContractAnalysisMetadata
function isContractAnalysisMetadata(obj: unknown): obj is ContractAnalysisMetadata {
  const metadata = obj as ContractAnalysisMetadata;
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    Array.isArray(metadata.key_terms) &&
    Array.isArray(metadata.obligations) &&
    Array.isArray(metadata.risks) &&
    Array.isArray(metadata.recommendations) &&
    typeof metadata.analyzed_at === 'string'
  );
}

export function ContractAnalysis({ documentId }: ContractAnalysisProps) {
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["contract-analysis", documentId],
    queryFn: async () => {
      if (!documentId) {
        console.log("No document ID provided");
        return null;
      }

      console.log("Fetching analysis for document:", documentId);
      
      try {
        const { data, error } = await supabase
          .from("ai_document_classification")
          .select(`
            id,
            document_id,
            classification_type,
            confidence_score,
            metadata,
            created_at
          `)
          .eq("document_id", documentId)
          .eq("classification_type", "contract_analysis")
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        
        if (!data) {
          console.log("No analysis found for document");
          return null;
        }

        // Validate metadata using type guard
        if (!isContractAnalysisMetadata(data.metadata)) {
          console.error("Invalid metadata structure:", data.metadata);
          throw new Error("Invalid metadata structure in analysis record");
        }

        // Cast the entire response to AIDocumentClassification after validation
        return {
          id: data.id,
          document_id: data.document_id,
          classification_type: data.classification_type,
          confidence_score: data.confidence_score,
          metadata: data.metadata as ContractAnalysisMetadata,
          created_at: data.created_at
        } as AIDocumentClassification;
      } catch (err) {
        console.error("Error in contract analysis query:", err);
        throw err;
      }
    },
    retry: false,
    enabled: Boolean(documentId)
  });

  if (error) {
    console.error("Error in ContractAnalysis:", error);
    return (
      <div className="flex flex-col items-center justify-center p-6 text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load analysis</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Analysis not available yet</p>
        <p className="text-sm mt-2">The document is pending analysis</p>
      </div>
    );
  }

  const { metadata, confidence_score } = analysis;

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Contract Analysis</h3>
          <Badge variant={confidence_score > 0.8 ? "success" : "warning"}>
            {Math.round(confidence_score * 100)}% Confidence
          </Badge>
        </div>

        <Card className="p-4 space-y-2">
          <h4 className="font-medium">Key Terms</h4>
          <ul className="list-disc pl-4 space-y-1">
            {metadata.key_terms.map((term: string, index: number) => (
              <li key={index} className="text-sm">{term}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-2">
          <h4 className="font-medium">Obligations</h4>
          <ul className="list-disc pl-4 space-y-1">
            {metadata.obligations.map((obligation: string, index: number) => (
              <li key={index} className="text-sm">{obligation}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-2">
          <h4 className="font-medium">Risks & Liabilities</h4>
          <ul className="list-disc pl-4 space-y-1">
            {metadata.risks.map((risk: string, index: number) => (
              <li key={index} className="text-sm text-destructive">{risk}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-2">
          <h4 className="font-medium">Recommendations</h4>
          <ul className="list-disc pl-4 space-y-1">
            {metadata.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-green-600 dark:text-green-400">
                {rec}
              </li>
            ))}
          </ul>
        </Card>

        <div className="text-xs text-muted-foreground">
          Last analyzed: {new Date(metadata.analyzed_at).toLocaleString()}
        </div>
      </div>
    </ScrollArea>
  );
}