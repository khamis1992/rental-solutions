import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentClassifier } from "./DocumentClassifier";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LegalDocumentViewerProps {
  documentId: string;
}

export function LegalDocumentViewer({ documentId }: LegalDocumentViewerProps) {
  const { data: document, isLoading } = useQuery({
    queryKey: ['legal-document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: classification } = useQuery({
    queryKey: ['document-classification', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_document_classification')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!document) {
    return <div>Document not found</div>;
  }

  // Default document type if not specified
  const documentType = document.type || 'unspecified';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="prose max-w-none dark:prose-invert">
            {document.content}
          </div>
        </CardContent>
      </Card>

      {classification && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Classification:</span>
              <Badge variant="outline" className="capitalize">
                {classification.classification_type}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Confidence:</span>
              <Badge 
                variant={classification.confidence_score > 0.8 ? "success" : "warning"}
              >
                {Math.round(classification.confidence_score * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <DocumentClassifier
        documentId={document.id}
        documentContent={document.content}
        documentType={documentType}
      />
    </div>
  );
}