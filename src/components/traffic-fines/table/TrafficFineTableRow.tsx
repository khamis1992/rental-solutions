import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface TrafficFineTableRowProps {
  fine: any;
  onAssignCustomer: (fineId: string, customerId: string) => void;
  onMarkAsPaid: (fineId: string) => void;
}

export const TrafficFineTableRow = ({
  fine,
  onAssignCustomer,
  onMarkAsPaid,
}: TrafficFineTableRowProps) => {
  const getStatusColor = (status: string): string => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const handleLicensePlateClick = () => {
    // Copy to clipboard
    if (fine.license_plate) {
      navigator.clipboard.writeText(fine.license_plate);
      // You could add a toast notification here if you want to show feedback
    }
  };

  return (
    <TableRow key={fine.id} className="hover:bg-muted/50">
      <TableCell>
        <Button 
          variant="ghost" 
          className="h-auto p-0 font-normal hover:bg-transparent"
          onClick={handleLicensePlateClick}
        >
          {fine.license_plate || 'N/A'}
        </Button>
      </TableCell>
      <TableCell>{fine.violation_number || 'N/A'}</TableCell>
      <TableCell>
        {new Date(fine.violation_date).toLocaleDateString()}
      </TableCell>
      <TableCell>{fine.fine_location || 'N/A'}</TableCell>
      <TableCell>{fine.violation_charge || 'N/A'}</TableCell>
      <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
      <TableCell>{fine.violation_points || '0'}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(fine.payment_status)}>
          {fine.payment_status}
        </Badge>
      </TableCell>
      <TableCell>
        {fine.lease?.customer ? (
          <span className="font-medium">{fine.lease.customer.full_name}</span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        {fine.payment_status !== 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAsPaid(fine.id)}
          >
            Mark as Paid
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};