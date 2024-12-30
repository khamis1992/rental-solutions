import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentMethodType, PaymentStatus } from "@/types/database/agreement.types";

interface PaymentFormProps {
  agreementId: string;
}

interface PaymentFormData {
  amount: number;
  paymentMethod: PaymentMethodType;
  description?: string;
  isRecurring?: boolean;
  intervalValue?: number;
  intervalUnit?: 'days' | 'weeks' | 'months';
}

export const PaymentForm = ({ agreementId }: PaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>();

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting payment:', { agreementId, ...data });
      
      const paymentData = {
        lease_id: agreementId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        description: data.description,
        payment_date: new Date().toISOString(),
        status: 'pending' as PaymentStatus,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? 
          `${data.intervalValue} ${data.intervalUnit}` : null,
        next_payment_date: isRecurring ? 
          new Date(Date.now() + getIntervalInMilliseconds(data.intervalValue!, data.intervalUnit!)).toISOString() : 
          null
      };

      const { error } = await supabase
        .from("payments")
        .insert(paymentData);

      if (error) throw error;

      toast.success("Payment added successfully");
      reset();
      setIsRecurring(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIntervalInMilliseconds = (value: number, unit: string) => {
    const milliseconds = {
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000
    };
    return value * milliseconds[unit as keyof typeof milliseconds];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount (QAR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register("amount", { 
            required: "Amount is required",
            min: { value: 0.01, message: "Amount must be greater than 0" }
          })}
          aria-invalid={errors.amount ? "true" : "false"}
        />
        {errors.amount && (
          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select {...register("paymentMethod", { required: "Payment method is required" })}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="WireTransfer">Wire Transfer</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="On_hold">On Hold</SelectItem>
            <SelectItem value="Deposit">Deposit</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
        {errors.paymentMethod && (
          <p className="text-sm text-red-500 mt-1">{errors.paymentMethod.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
          aria-label="Enable recurring payments"
        />
        <Label htmlFor="recurring">Recurring Payment</Label>
      </div>

      {isRecurring && (
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="intervalValue">Repeat Every</Label>
            <Input
              id="intervalValue"
              type="number"
              min="1"
              {...register("intervalValue", { 
                required: isRecurring ? "Interval value is required" : false,
                min: { value: 1, message: "Interval must be at least 1" }
              })}
              aria-invalid={errors.intervalValue ? "true" : "false"}
            />
            {errors.intervalValue && (
              <p className="text-sm text-red-500 mt-1">{errors.intervalValue.message}</p>
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="intervalUnit">Unit</Label>
            <Select {...register("intervalUnit", { required: isRecurring })}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
            {errors.intervalUnit && (
              <p className="text-sm text-red-500 mt-1">{errors.intervalUnit.message}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add payment notes or description..."
          {...register("description")}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Adding Payment..." : "Add Payment"}
      </Button>
    </form>
  );
};