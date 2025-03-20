
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const TrafficFineTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>License Plate</TableHead>
        <TableHead>Violation Number</TableHead>
        <TableHead>Violation Date</TableHead>
        <TableHead>Violation Charge</TableHead>
        <TableHead>Fine Amount</TableHead>
        <TableHead>Points</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>Agreement#</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
