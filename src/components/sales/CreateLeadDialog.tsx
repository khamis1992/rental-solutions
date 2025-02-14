
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLeadDialog = ({ open, onOpenChange }: CreateLeadDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    preferredVehicleType: "",
    budgetMin: "",
    budgetMax: "",
    priority: "medium",
    agreementType: "short_term"
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPEG, or PNG file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('sales_documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sales_documents')
        .getPublicUrl(fileName);

      setDocumentUrl(publicUrl);
      toast.success('Document uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("sales_leads").insert({
        preferred_vehicle_type: formData.preferredVehicleType,
        budget_range_min: parseFloat(formData.budgetMin),
        budget_range_max: parseFloat(formData.budgetMax),
        priority: formData.priority,
        preferred_agreement_type: formData.agreementType,
        document_url: documentUrl,
        status: "new"
      });

      if (error) throw error;

      toast.success("Sales lead created successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Error creating sales lead");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Sales Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vehicleType">Preferred Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={formData.preferredVehicleType}
                onChange={(e) => setFormData({ ...formData, preferredVehicleType: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budgetMin">Minimum Budget</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budgetMax">Maximum Budget</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agreementType">Agreement Type</Label>
              <Select
                value={formData.agreementType}
                onValueChange={(value) => setFormData({ ...formData, agreementType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agreement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Short Term</SelectItem>
                  <SelectItem value="lease_to_own">Lease to Own</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="document">Document Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="document"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={uploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {documentUrl && (
                <p className="text-sm text-green-600">Document uploaded successfully</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
