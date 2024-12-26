import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TransactionPreviewTableProps {
  data: any[];
  onDataChange: (data: any[]) => void;
}

export const TransactionPreviewTable = ({ data, onDataChange }: TransactionPreviewTableProps) => {
  const formatDate = (dateString: string) => {
    try {
      // First try parsing as ISO string
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy');
      }
      
      // If not valid ISO, try creating a new Date
      const fallbackDate = new Date(dateString);
      if (isValid(fallbackDate)) {
        return format(fallbackDate, 'dd/MM/yyyy');
      }
      
      // If still not valid, return the original string
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agreement Number</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Payment Number</TableHead>
            <TableHead>Payment Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.agreement_number}</TableCell>
              <TableCell>{row.customer_name}</TableCell>
              <TableCell>{typeof row.amount === 'number' ? row.amount.toFixed(2) : row.amount}</TableCell>
              <TableCell>{row.license_plate}</TableCell>
              <TableCell>{row.vehicle}</TableCell>
              <TableCell>{row.payment_date ? formatDate(row.payment_date) : 'N/A'}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {row.payment_method}
                </Badge>
              </TableCell>
              <TableCell>{row.payment_number}</TableCell>
              <TableCell>{row.payment_description}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                No data to preview
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};