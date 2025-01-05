import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BulkPaymentFormProps {
  contractId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const BulkPaymentForm = ({ contractId, onSuccess, onClose }: BulkPaymentFormProps) => {
  const [firstChequeNumber, setFirstChequeNumber] = useState("");
  const [totalCheques, setTotalCheques] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [draweeBankName, setDraweeBankName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Submitting bulk payments:", {
        firstChequeNumber,
        totalCheques,
        amount,
        startDate,
        draweeBankName,
        contractId,
      });

      const { data, error } = await supabase.functions.invoke('create-bulk-payments', {
        body: {
          firstChequeNumber,
          totalCheques: parseInt(totalCheques),
          amount: parseFloat(amount),
          startDate,
          draweeBankName,
          contractId
        }
      });

      if (error) throw error;

      console.log("Bulk payments created:", data);
      
      // Invalidate queries to refresh the payments list
      await queryClient.invalidateQueries({ queryKey: ['car-installment-payments', contractId] });
      
      toast.success("Bulk payments created successfully");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error creating bulk payments:", error);
      toast.error("Failed to create bulk payments");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstChequeNumber">First Cheque Number</Label>
        <Input
          id="firstChequeNumber"
          value={firstChequeNumber}
          onChange={(e) => setFirstChequeNumber(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalCheques">Total Cheques</Label>
        <Input
          id="totalCheques"
          type="number"
          value={totalCheques}
          onChange={(e) => setTotalCheques(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount per Cheque</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="draweeBankName">Drawee Bank Name</Label>
        <Input
          id="draweeBankName"
          value={draweeBankName}
          onChange={(e) => setDraweeBankName(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Payments...
          </>
        ) : (
          'Create Bulk Payments'
        )}
      </Button>
    </form>
  );
};