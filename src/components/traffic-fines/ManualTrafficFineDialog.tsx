import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ManualTrafficFineDialogProps {
  onFineAdded: () => void;
}

export const ManualTrafficFineDialog = ({ onFineAdded }: ManualTrafficFineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [agreementNumber, setAgreementNumber] = useState("");
  const [violationDate, setViolationDate] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [fineType, setFineType] = useState("");
  const [fineLocation, setFineLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: agreement, error: agreementError } = useQuery({
    queryKey: ["agreement", agreementNumber],
    queryFn: async () => {
      if (!agreementNumber) return null;
      
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          agreement_number,
          customer:profiles(
            id,
            full_name
          ),
          vehicle:vehicles(
            id,
            license_plate
          )
        `)
        .eq("agreement_number", agreementNumber)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(agreementNumber),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) {
      toast({
        title: "Error",
        description: "Please enter a valid agreement number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("traffic_fines")
        .insert({
          lease_id: agreement.id,
          violation_date: format(new Date(violationDate), "yyyy-MM-dd"),
          fine_amount: Number(fineAmount),
          fine_type: fineType,
          fine_location: fineLocation,
          license_plate: agreement.vehicle?.license_plate,
          entry_type: "manual",
          validation_status: "validated",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Traffic fine has been added successfully",
      });
      
      setOpen(false);
      onFineAdded();
      
      // Reset form
      setAgreementNumber("");
      setViolationDate("");
      setFineAmount("");
      setFineType("");
      setFineLocation("");
    } catch (error) {
      console.error("Error adding traffic fine:", error);
      toast({
        title: "Error",
        description: "Failed to add traffic fine",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Manual Fine</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Traffic Fine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agreementNumber">Agreement Number</Label>
            <Input
              id="agreementNumber"
              value={agreementNumber}
              onChange={(e) => setAgreementNumber(e.target.value)}
              placeholder="Enter agreement number"
            />
            {agreement && (
              <p className="text-sm text-muted-foreground">
                Customer: {agreement.customer?.full_name}
                <br />
                Vehicle: {agreement.vehicle?.license_plate}
              </p>
            )}
            {agreementError && (
              <p className="text-sm text-destructive">Invalid agreement number</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="violationDate">Violation Date</Label>
            <Input
              id="violationDate"
              type="date"
              value={violationDate}
              onChange={(e) => setViolationDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fineAmount">Fine Amount</Label>
            <Input
              id="fineAmount"
              type="number"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              placeholder="Enter fine amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fineType">Fine Type</Label>
            <Input
              id="fineType"
              value={fineType}
              onChange={(e) => setFineType(e.target.value)}
              placeholder="Enter fine type"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fineLocation">Location</Label>
            <Input
              id="fineLocation"
              value={fineLocation}
              onChange={(e) => setFineLocation(e.target.value)}
              placeholder="Enter fine location"
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : "Add Fine"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};