import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { VehicleDetailsDialog } from "@/components/vehicles/VehicleDetailsDialog";
import { CustomerDetailsDialog } from "@/components/customers/CustomerDetailsDialog";
import { AgreementDetailsDialog } from "@/components/agreements/AgreementDetailsDialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SearchResults } from "@/components/search/SearchResults";
import { useSearch } from "@/components/search/useSearch";

export const SearchBox = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isMobile = useIsMobile();
  
  // Dialog states
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);

  const { data: searchResults, error, isLoading } = useSearch(debouncedSearch);

  const handleSelect = useCallback((type: string, id: string) => {
    setOpen(false);
    switch (type) {
      case "vehicle":
        setSelectedVehicle(id);
        break;
      case "customer":
        setSelectedCustomer(id);
        break;
      case "agreement":
        setSelectedAgreement(id);
        break;
    }
  }, []);

  return (
    <>
      <div className="relative w-full max-w-[280px] md:w-80">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isMobile ? "Search..." : "Search vehicles, customers, agreements..."}
          className="pl-8 h-9 md:h-10"
          onClick={() => setOpen(true)}
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className={cn("max-w-[90vw] md:max-w-[640px]")}>
          <CommandInput 
            placeholder="Type to search..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-10 md:h-12"
          />
          <CommandList className="max-h-[50vh] md:max-h-[400px]">
            <SearchResults
              isLoading={isLoading}
              error={error}
              searchQuery={searchQuery}
              searchResults={searchResults}
              handleSelect={handleSelect}
            />
          </CommandList>
        </div>
      </CommandDialog>

      {selectedVehicle && (
        <VehicleDetailsDialog
          vehicleId={selectedVehicle}
          open={Boolean(selectedVehicle)}
          onOpenChange={(open) => !open && setSelectedVehicle(null)}
        />
      )}
      
      {selectedCustomer && (
        <CustomerDetailsDialog
          customerId={selectedCustomer}
          open={Boolean(selectedCustomer)}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
        />
      )}
      
      {selectedAgreement && (
        <AgreementDetailsDialog
          agreementId={selectedAgreement}
          open={Boolean(selectedAgreement)}
          onOpenChange={(open) => !open && setSelectedAgreement(null)}
        />
      )}
    </>
  );
};