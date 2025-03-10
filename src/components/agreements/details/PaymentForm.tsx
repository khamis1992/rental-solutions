
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { getFirstDayOfMonth, calculateDaysOverdue } from "@/components/reports/utils/pendingPaymentsUtils";
import { format, parseISO, differenceInMonths } from "date-fns";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface PaymentFormProps {
  agreementId: string;
}

export const PaymentForm = ({ agreementId }: PaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lateFee, setLateFee] = useState(0);
  const [rentAmount, setRentAmount] = useState(0);
  const [dailyLateFeeRate, setDailyLateFeeRate] = useState(120);
  const [dueAmount, setDueAmount] = useState(0);
  const [existingLateFee, setExistingLateFee] = useState<any>(null);
  const [isHistoricalPayment, setIsHistoricalPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [contractStartDate, setContractStartDate] = useState<Date | null>(null);
  const [missingMonths, setMissingMonths] = useState<{month: string, year: number, dueDate: Date}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  // Fetch rent amount, contract details, and calculate late fee
  useEffect(() => {
    const fetchContractDetails = async () => {
      if (!agreementId) {
        console.error("No agreement ID provided");
        return;
      }

      try {
        const { data: lease, error } = await supabase
          .from('leases')
          .select('rent_amount, rent_due_day, daily_late_fee, start_date, agreement_number')
          .eq('id', agreementId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (lease) {
          setRentAmount(Number(lease.rent_amount));
          if (lease.daily_late_fee) {
            setDailyLateFeeRate(Number(lease.daily_late_fee));
          }
          
          // Set contract start date
          if (lease.start_date) {
            const startDate = parseISO(lease.start_date);
            setContractStartDate(startDate);
            
            // Check for historical payment needs
            await checkMissingPayments(lease.agreement_number, startDate);
          }
        } else {
          console.warn("No rent amount found for agreement:", agreementId);
        }
      } catch (error) {
        console.error("Error fetching rent amount:", error);
        toast.error("Failed to fetch rent amount");
      }
    };

    const fetchExistingLateFee = async () => {
      if (!agreementId) return;
      
      try {
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const { data, error } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementId)
          .eq('type', 'LATE_PAYMENT_FEE')
          .eq('original_due_date', firstOfMonth.toISOString())
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setExistingLateFee(data);
          setLateFee(data.late_fine_amount || 0);
        } else {
          calculateLateFee();
        }
      } catch (error) {
        console.error("Error fetching existing late fee:", error);
        calculateLateFee();
      }
    };

    const calculateLateFee = () => {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      if (today > firstOfMonth) {
        const daysLate = Math.floor((today.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        setLateFee(daysLate * dailyLateFeeRate);
      } else {
        setLateFee(0);
      }
    };
    
    const checkMissingPayments = async (agreementNumber: string, startDate: Date) => {
      try {
        // Get all existing payments
        const { data: existingPayments, error } = await supabase
          .from('unified_payments')
          .select('payment_date, original_due_date')
          .eq('lease_id', agreementId)
          .eq('type', 'Income');
          
        if (error) throw error;
        
        // Calculate months between contract start and now
        const today = new Date();
        const months = differenceInMonths(today, startDate) + 1; // +1 to include current month
        
        if (months <= 0) return; // Future contract
        
        // Track existing payment months
        const paidMonths = new Set<string>();
        existingPayments?.forEach(payment => {
          if (payment.payment_date) {
            const date = new Date(payment.payment_date);
            paidMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
          }
          if (payment.original_due_date) {
            const date = new Date(payment.original_due_date);
            paidMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
          }
        });
        
        // Find missing months
        const missing: {month: string, year: number, dueDate: Date}[] = [];
        
        for (let i = 0; i < months; i++) {
          const monthDate = new Date(startDate);
          monthDate.setMonth(startDate.getMonth() + i);
          
          const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
          
          if (!paidMonths.has(monthKey)) {
            const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            missing.push({
              month: format(monthDate, 'MMMM'),
              year: monthDate.getFullYear(),
              dueDate
            });
          }
        }
        
        setMissingMonths(missing);
        
        if (missing.length > 0) {
          setSelectedMonth(`${missing[0].month} ${missing[0].year}`);
          setIsHistoricalPayment(true);
          // Set the payment date to the missing month's due date
          setPaymentDate(missing[0].dueDate);
        }
      } catch (error) {
        console.error("Error checking for missing payments:", error);
      }
    };

    if (agreementId) {
      fetchContractDetails();
      fetchExistingLateFee();
    }
  }, [agreementId, dailyLateFeeRate]);

  // Update due amount when rent amount or late fee changes
  useEffect(() => {
    setDueAmount(rentAmount + lateFee);
  }, [rentAmount, lateFee]);

  const onSubmit = async (data: any) => {
    if (!agreementId) {
      toast.error("No agreement ID provided");
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentAmount = Number(data.amount);
      const balance = dueAmount - paymentAmount;
      
      // Use selected payment date or current date
      const selectedPaymentDate = isHistoricalPayment ? paymentDate : new Date();
      const daysOverdue = isHistoricalPayment ? 0 : calculateDaysOverdue(selectedPaymentDate);
      const originalDueDate = isHistoricalPayment ? paymentDate : getFirstDayOfMonth(selectedPaymentDate);
      const lateFineAmount = isHistoricalPayment ? 0 : (existingLateFee?.late_fine_amount || (daysOverdue > 0 ? daysOverdue * dailyLateFeeRate : 0));
      
      // Add description for historical payment if needed
      const paymentDescription = isHistoricalPayment 
        ? `Historical payment for ${selectedMonth}` 
        : data.description;
      
      // Batch operations using transactions
      const { error } = await supabase.rpc('record_payment_with_late_fee', {
        p_lease_id: agreementId,
        p_amount: dueAmount,
        p_amount_paid: paymentAmount,
        p_balance: balance,
        p_payment_method: data.paymentMethod,
        p_description: paymentDescription,
        p_payment_date: selectedPaymentDate.toISOString(),
        p_late_fine_amount: lateFineAmount,
        p_days_overdue: daysOverdue,
        p_original_due_date: originalDueDate.toISOString(),
        p_existing_late_fee_id: existingLateFee?.id || null
      });

      if (error) throw error;

      toast.success("Payment added successfully");
      reset();
      setIsHistoricalPayment(false);
      setSelectedMonth("");
      
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['unified-payments'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!agreementId) {
    return <div>No agreement selected</div>;
  }

  const handleMonthSelect = (month: string, year: number, dueDate: Date) => {
    setSelectedMonth(`${month} ${year}`);
    setPaymentDate(dueDate);
  };

  const toggleHistoricalPayment = () => {
    setIsHistoricalPayment(!isHistoricalPayment);
    if (!isHistoricalPayment && missingMonths.length > 0) {
      setSelectedMonth(`${missingMonths[0].month} ${missingMonths[0].year}`);
      setPaymentDate(missingMonths[0].dueDate);
    } else {
      setSelectedMonth("");
      setPaymentDate(new Date());
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-muted p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Due Amount</div>
            <div className="text-lg font-semibold">
              {formatCurrency(dueAmount)}
              <span className="text-sm text-muted-foreground ml-2">
                (Rent: {formatCurrency(rentAmount)} + Late Fee: {formatCurrency(lateFee)})
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {missingMonths.length > 0 && (
        <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Missing Payments Detected</AlertTitle>
          <AlertDescription className="text-amber-600">
            This agreement has {missingMonths.length} missing monthly payments since its start.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              type="button"
              onClick={toggleHistoricalPayment}
            >
              {isHistoricalPayment ? "Cancel Historical Payment" : "Record Historical Payment"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isHistoricalPayment && (
        <div className="bg-background border rounded-md p-4 mb-4">
          <h3 className="font-semibold mb-2">Record Historical Payment</h3>
          <div className="grid gap-4 mb-4">
            <div>
              <Label htmlFor="month">Select Month</Label>
              <Select 
                onValueChange={(value) => {
                  const [month, year, day, month_num] = value.split('|');
                  const dueDate = new Date(parseInt(year), parseInt(month_num), parseInt(day));
                  handleMonthSelect(month, parseInt(year), dueDate);
                }}
                value={missingMonths.find(m => `${m.month} ${m.year}` === selectedMonth)
                  ? `${missingMonths.find(m => `${m.month} ${m.year}` === selectedMonth)?.month}|${
                      missingMonths.find(m => `${m.month} ${m.year}` === selectedMonth)?.year
                    }|1|${missingMonths.findIndex(m => `${m.month} ${m.year}` === selectedMonth)}`
                  : ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month for payment" />
                </SelectTrigger>
                <SelectContent>
                  {missingMonths.map((month, index) => (
                    <SelectItem
                      key={index}
                      value={`${month.month}|${month.year}|1|${index}`}
                    >
                      {month.month} {month.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="amount">Amount Paid (QAR)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          {...register("amount", { required: true })}
        />
      </div>
      
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select onValueChange={(value) => setValue("paymentMethod", value)}>
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
      </div>

      {!isHistoricalPayment && (
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Add payment notes or description..."
            {...register("description")}
          />
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Adding Payment..." : `Add ${isHistoricalPayment ? 'Historical' : ''} Payment`}
      </Button>
    </form>
  );
};
