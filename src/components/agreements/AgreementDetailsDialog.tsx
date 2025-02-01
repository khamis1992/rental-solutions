import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Agreement } from "@/types/agreement.types";
import { AgreementEditor } from "./print/AgreementEditor";

interface AgreementDetailsDialogProps {
  agreement: Agreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgreementDetailsDialog = ({
  agreement,
  open,
  onOpenChange,
}: AgreementDetailsDialogProps) => {
  // Generate the initial content for the editor based on the agreement details
  const generateAgreementContent = () => {
    return `
      <div dir="${agreement.template?.language === 'arabic' ? 'rtl' : 'ltr'}">
        <h1 style="text-align: center;">Rental Agreement</h1>
        <p style="text-align: center;">Agreement Number: ${agreement.agreement_number}</p>
        
        <h2>Customer Details</h2>
        <p>Name: ${agreement.customer?.full_name || ''}</p>
        <p>Phone: ${agreement.customer?.phone_number || ''}</p>
        
        <h2>Vehicle Details</h2>
        <p>Make: ${agreement.vehicle?.make || ''}</p>
        <p>Model: ${agreement.vehicle?.model || ''}</p>
        <p>Year: ${agreement.vehicle?.year || ''}</p>
        <p>License Plate: ${agreement.vehicle?.license_plate || ''}</p>
        
        <h2>Agreement Terms</h2>
        <p>Start Date: ${new Date(agreement.start_date || '').toLocaleDateString()}</p>
        <p>End Date: ${new Date(agreement.end_date || '').toLocaleDateString()}</p>
        <p>Rent Amount: ${agreement.rent_amount} QAR</p>
        <p>Total Amount: ${agreement.total_amount} QAR</p>
        
        <div style="margin-top: 50px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <p>Customer Signature</p>
              <div style="border-top: 1px solid black; width: 200px; margin-top: 50px;"></div>
            </div>
            <div style="text-align: center;">
              <p>Company Signature</p>
              <div style="border-top: 1px solid black; width: 200px; margin-top: 50px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AgreementEditor initialContent={generateAgreementContent()} />
      </DialogContent>
    </Dialog>
  );
};