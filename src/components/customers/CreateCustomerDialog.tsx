import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerFormFields } from "./CustomerFormFields";
import { DocumentScanner } from "./DocumentScanner";

interface CreateCustomerDialogProps {
  children?: ReactNode;
}

export const CreateCustomerDialog = ({ children }: CreateCustomerDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      full_name: "",
      phone_number: "",
      address: "",
      driver_license: "",
      id_document_url: "",
      license_document_url: "",
      contract_document_url: "",
    },
  });

  const handleScanComplete = (extractedData: any) => {
    form.setValue('full_name', extractedData.full_name);
    form.setValue('driver_license', extractedData.id_number);
  };

  const onSubmit = async (values: any) => {
    console.log('Starting customer creation with values:', values);
    setIsLoading(true);
    try {
      // Generate a UUID for the new customer
      const newCustomerId = crypto.randomUUID();
      
      const customerData = {
        id: newCustomerId,
        ...values,
        role: "customer",
        status: "pending_review",
      };

      console.log('Attempting to insert customer with data:', customerData);

      const { data: newCustomer, error: insertError } = await supabase
        .from("profiles")
        .insert(customerData)
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating customer:', insertError);
        throw insertError;
      }

      console.log('Customer created successfully:', newCustomer);

      // Invalidate and refetch customers query
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      // Force a refetch of customer stats
      await queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      
      console.log('Queries invalidated, checking customer list refresh');

      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      setCustomerId(null);

    } catch (error: any) {
      console.error('Error in customer creation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to the system. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {customerId && (
              <DocumentScanner
                customerId={customerId}
                onScanComplete={handleScanComplete}
              />
            )}
            <CustomerFormFields form={form} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};