import { FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustomerDocumentsProps {
  customerId: string;
}

export const CustomerDocuments = ({ customerId }: CustomerDocumentsProps) => {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-documents', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id_document_url, license_document_url')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;

      // Get public URLs for both documents if they exist
      const idDocumentUrl = data.id_document_url 
        ? supabase.storage.from('customer_documents').getPublicUrl(data.id_document_url).data.publicUrl
        : null;
      
      const licenseDocumentUrl = data.license_document_url
        ? supabase.storage.from('customer_documents').getPublicUrl(data.license_document_url).data.publicUrl
        : null;

      return {
        ...data,
        id_document_url: idDocumentUrl,
        license_document_url: licenseDocumentUrl
      };
    },
    enabled: !!customerId,
  });

  if (!customerId || isLoading) return null;

  return (
    <div className="col-span-2 space-y-4 border rounded-lg p-4 bg-muted/50">
      <h3 className="font-medium">Customer Documents</h3>
      <div className="grid grid-cols-2 gap-4">
        <a
          href={customer?.id_document_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 p-2 rounded-md ${
            customer?.id_document_url
              ? "text-blue-600 hover:bg-blue-50"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>ID Document</span>
          {!customer?.id_document_url && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </a>
        <a
          href={customer?.license_document_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 p-2 rounded-md ${
            customer?.license_document_url
              ? "text-blue-600 hover:bg-blue-50"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Driver License</span>
          {!customer?.license_document_url && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </a>
      </div>
    </div>
  );
};