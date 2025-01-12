import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { usePaymentForm } from "../hooks/usePaymentForm";
import { formatCurrency } from "@/lib/utils";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentMethodType } from "@/types/database/payment.types";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  agreementId: string;
}

export const PaymentForm = ({ agreementId }: PaymentFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    lateFineAmount,
    daysOverdue,
    baseAmount,
    totalAmount,
    calculateLateFine,
    watch,
    setValue
  } = usePaymentForm(agreementId);

  const rentAmount = watch("amount");

  useEffect(() => {
    calculateLateFine();
  }, [calculateLateFine]);

  useEffect(() => {
    if (rentAmount !== baseAmount && baseAmount > 0) {
      console.log('Syncing base amount with rent amount:', rentAmount, baseAmount);
      setValue("amount", baseAmount);
    }
  }, [baseAmount, rentAmount, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const amountPaid = Number(data.amountPaid);
      
      if (isNaN(amountPaid) || amountPaid <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }

      if (!data.paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }

      const { data: payment, error: paymentError } = await supabase
        .from('unified_payments')
        .insert([{
          lease_id: agreementId,
          amount: totalAmount,
          amount_paid: amountPaid,
          balance: Math.max(0, totalAmount - amountPaid),
          payment_method: data.paymentMethod,
          description: data.description || '',
          type: 'Income',
          status: 'completed',
          payment_date: new Date().toISOString(),
          late_fine_amount: lateFineAmount,
          days_overdue: daysOverdue
        }])
        .select()
        .single();

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        throw paymentError;
      }

      toast.success("Payment recorded successfully");
      setValue("amountPaid", 0);
      setValue("description", "");
    } catch (error) {
      console.error('Error in payment submission:', error);
      toast.error("Failed to record payment. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        {daysOverdue > 0 && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-medium">Payment is overdue by {daysOverdue} days</p>
            <p>Late fine: {formatCurrency(lateFineAmount)}</p>
          </div>
        )}

        <div>
          <Label htmlFor="amount">Base Amount (QAR)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount")}
            disabled
            value={baseAmount}
            className="bg-gray-100 font-medium"
          />
        </div>

        {lateFineAmount > 0 && (
          <div>
            <Label>Late Fine Amount</Label>
            <Input
              type="number"
              disabled
              value={lateFineAmount}
              className="bg-gray-100"
            />
          </div>
        )}

        <div>
          <Label className="font-bold">Total Amount to Pay</Label>
          <Input
            type="number"
            disabled
            value={totalAmount}
            className="bg-gray-100"
          />
        </div>

        <div>
          <Label htmlFor="amountPaid">Amount Paid (QAR)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            {...register("amountPaid", { 
              required: "Amount paid is required",
              min: {
                value: 0,
                message: "Amount paid must be positive"
              },
              valueAsNumber: true
            })}
          />
          {errors.amountPaid && (
            <p className="text-sm text-red-500 mt-1">{errors.amountPaid.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Controller
            name="paymentMethod"
            control={control}
            rules={{ required: "Payment method is required" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="WireTransfer">Wire Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.paymentMethod && (
            <p className="text-sm text-red-500 mt-1">{errors.paymentMethod.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Add payment notes or description..."
            {...register("description")}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Add Payment'
        )}
      </Button>
    </form>
  );
};