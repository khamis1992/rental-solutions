import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

interface CustomerSelectProps {
  register: any;
  onCustomerSelect?: (customerId: string) => void;
}

export const CustomerSelect = ({ register, onCustomerSelect }: CustomerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    full_name: string;
  } | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      console.log("Fetching customers with search:", searchQuery);
      
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('role', 'customer')
        .limit(10); // Limit results for better performance

      if (searchQuery) {
        query = query.or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const handleSelect = (customer: { id: string; full_name: string }) => {
    setSelectedCustomer(customer);
    register("customerId").onChange({ target: { value: customer.id } });
    if (onCustomerSelect) {
      onCustomerSelect(customer.id);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="customerId">Customer</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer ? selectedCustomer.full_name : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No customers found."}
              </CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelect(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.full_name}</span>
                      {customer.email && (
                        <span className="text-sm text-muted-foreground">
                          {customer.email}
                        </span>
                      )}
                      {customer.phone_number && (
                        <span className="text-sm text-muted-foreground">
                          {customer.phone_number}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};