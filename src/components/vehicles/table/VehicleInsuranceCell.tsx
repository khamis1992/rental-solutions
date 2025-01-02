import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface VehicleInsuranceCellProps {
  isEditing: boolean;
  insurance: string | null;
  insuranceValue: string;
  onInsuranceChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onClick: (e: React.MouseEvent) => void;
}

export const VehicleInsuranceCell = ({
  isEditing,
  insurance,
  insuranceValue,
  onInsuranceChange,
  onKeyPress,
  onBlur,
  onClick,
}: VehicleInsuranceCellProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center" onClick={e => e.stopPropagation()}>
        <Input
          value={insuranceValue}
          onChange={(e) => onInsuranceChange(e.target.value)}
          onKeyDown={onKeyPress}
          onBlur={onBlur}
          
          className="w-full"
          placeholder="Enter insurance company"
        />
      </div>
    );
  }

  return (
    <div 
      className="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer" 
      onClick={onClick}
    >
      <Building2 className="h-4 w-4 mr-1" />
      {insurance || <span className="text-muted-foreground">Not available</span>}
    </div>
  );
};