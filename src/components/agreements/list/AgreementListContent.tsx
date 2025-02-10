
import { Table, TableBody } from "@/components/ui/table";
import { AgreementTableHeader } from "../table/AgreementTableHeader";
import { AgreementTableRow } from "../table/AgreementTableRow";
import { VehicleTablePagination } from "../../vehicles/table/VehicleTablePagination";
import type { Agreement } from "../hooks/useAgreements";

interface AgreementListContentProps {
  agreements: Agreement[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewContract: (id: string) => void;
  onPrintContract: (id: string) => void;
  onAgreementClick: (id: string) => void;
  onNameClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onDeleted: () => void;
}

export const AgreementListContent = ({
  agreements,
  currentPage,
  totalPages,
  onPageChange,
  onViewContract,
  onPrintContract,
  onAgreementClick,
  onNameClick,
  onDeleteClick,
  onDeleted,
}: AgreementListContentProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <AgreementTableHeader />
          <TableBody>
            {agreements.map((agreement) => (
              <AgreementTableRow
                key={agreement.id}
                agreement={agreement}
                onViewContract={onViewContract}
                onPrintContract={onPrintContract}
                onAgreementClick={onAgreementClick}
                onNameClick={onNameClick}
                onDeleted={onDeleted}
                onDeleteClick={() => onDeleteClick(agreement.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <VehicleTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};
