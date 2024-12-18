import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateToDisplay } from "../utils/dateUtils";
import type { Agreement } from "../hooks/useAgreements";

interface AgreementTableRowProps {
  agreement: Agreement;
  onViewContract: (id: string) => void;
  onPrintContract: (id: string) => void;
  onAgreementClick: (id: string) => void;
  onNameClick: (id: string) => void;
}

export const AgreementTableRow = ({
  agreement,
  onViewContract,
  onPrintContract,
  onAgreementClick,
  onNameClick,
}: AgreementTableRowProps) => {
  const badgeVariant = agreement.status as "active" | "pending_payment" | "pending_deposit" | "closed";

  return (
    <TableRow>
      <TableCell>
        <button
          onClick={() => onNameClick(agreement.id)}
          className="text-blue-600 hover:underline"
        >
          {agreement.agreement_number}
        </button>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onAgreementClick(agreement.id)}
          className="text-blue-600 hover:underline"
        >
          {agreement.vehicle.license_plate}
        </button>
      </TableCell>
      <TableCell>{`${agreement.vehicle.make} ${agreement.vehicle.model}`}</TableCell>
      <TableCell>{agreement.customer.full_name}</TableCell>
      <TableCell>{formatDateToDisplay(agreement.start_date)}</TableCell>
      <TableCell>{formatDateToDisplay(agreement.end_date)}</TableCell>
      <TableCell>
        <Badge variant={badgeVariant} className="capitalize">
          {agreement.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewContract(agreement.id)}
        >
          View Contract
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPrintContract(agreement.id)}
        >
          Print
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAgreementClick(agreement.id)}
        >
          View Invoice
        </Button>
      </TableCell>
    </TableRow>
  );
};