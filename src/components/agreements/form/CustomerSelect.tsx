import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface CustomerSelectProps {
  register: any;
  onCustomerSelect?: (customerId: string) => void;
}

export const CustomerSelect = ({ register, onCustomerSelect }: CustomerSelectProps) => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, id_document_url, license_document_url')
        .eq('role', 'customer');
      
      if (error) throw error;
      return data;
    }
  });

  const handleValueChange = (value: string) => {
    register("customerId").onChange({ target: { value } });
    if (onCustomerSelect) {
      onCustomerSelect(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="customerId">Customer</Label>
      <Select onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading..." : "Select customer"} />
        </SelectTrigger>
        <SelectContent>
          {customers?.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};