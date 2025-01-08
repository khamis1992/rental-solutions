import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgreementFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const AgreementFilters = ({
  onSearchChange,
  onStatusChange,
  onSortChange,
}: AgreementFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select defaultValue="all" onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="newest" onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="amount-high">Amount (High-Low)</SelectItem>
            <SelectItem value="amount-low">Amount (Low-High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};