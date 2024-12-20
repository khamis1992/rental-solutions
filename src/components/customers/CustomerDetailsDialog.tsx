import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentHistoryAnalysis } from "./profile/PaymentHistoryAnalysis";
import { RentDueManagement } from "./profile/RentDueManagement";
import { TrafficFinesSummary } from "./profile/TrafficFinesSummary";
import { CredibilityScore } from "./profile/CredibilityScore";
import { CustomerDocumentUpload } from "./CustomerDocumentUpload";
import { CustomerDocumentAnalysis } from "./analysis/CustomerDocumentAnalysis";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface CustomerDetailsDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerDetailsDialog = ({
  customerId,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) => {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["customer-details", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching customer details:", error);
        toast({
          title: "Error",
          description: "Failed to load customer details",
          variant: "destructive",
        });
        throw error;
      }
      
      if (!data) {
        toast({
          title: "Error",
          description: "Customer not found",
          variant: "destructive",
        });
        return null;
      }
      
      return data;
    },
    enabled: !!customerId && open,
  });

  const handleDocumentUpload = async (url: string, type: 'id' | 'license') => {
    try {
      const field = type === 'id' ? 'id_document_url' : 'license_document_url';
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: url })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${type === 'id' ? 'ID' : 'License'} document uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading customer details...</div>
        ) : profile ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-lg font-medium">{profile.full_name}</p>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <p className="text-lg font-medium">{profile.phone_number}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <p>{profile.address || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Driver License</Label>
                    <p>{profile.driver_license || 'N/A'}</p>
                  </div>
                  
                  {/* Document Upload Section */}
                  <div className="col-span-2 space-y-4 border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-medium">Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <CustomerDocumentUpload
                          label="ID Document"
                          fieldName="id_document_url"
                          onUploadComplete={(url) => handleDocumentUpload(url, 'id')}
                        />
                        {profile.id_document_url && (
                          <div className="mt-2">
                            <a
                              href={profile.id_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">View ID Document</Button>
                            </a>
                          </div>
                        )}
                      </div>
                      <div>
                        <CustomerDocumentUpload
                          label="Driver License"
                          fieldName="license_document_url"
                          onUploadComplete={(url) => handleDocumentUpload(url, 'license')}
                        />
                        {profile.license_document_url && (
                          <div className="mt-2">
                            <a
                              href={profile.license_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">View License Document</Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="credibility" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="credibility">Credibility Score</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="rentdue">Rent Due</TabsTrigger>
                <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
                <TabsTrigger value="documents">Document Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="credibility">
                <CredibilityScore customerId={customerId} />
              </TabsContent>
              <TabsContent value="payments">
                <PaymentHistoryAnalysis customerId={customerId} />
              </TabsContent>
              <TabsContent value="rentdue">
                <RentDueManagement customerId={customerId} />
              </TabsContent>
              <TabsContent value="fines">
                <TrafficFinesSummary customerId={customerId} />
              </TabsContent>
              <TabsContent value="documents">
                <CustomerDocumentAnalysis customerId={customerId} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div>Customer not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};