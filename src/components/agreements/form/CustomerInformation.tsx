import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { AgreementFormData } from "../hooks/useAgreementForm";
import { CustomerSelect } from "./CustomerSelect";
import { CustomerDocuments } from "../CustomerDocuments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface CustomerInformationProps {
  register: UseFormRegister<AgreementFormData>;
  errors: FieldErrors<AgreementFormData>;
  selectedCustomerId: string;
  onCustomerSelect: (id: string) => void;
  setValue: UseFormSetValue<AgreementFormData>;
}

export const CustomerInformation = ({ 
  register, 
  errors, 
  selectedCustomerId,
  onCustomerSelect,
  setValue 
}: CustomerInformationProps) => {
  // Fetch customer details when a customer is selected
  const { data: customerDetails } = useQuery({
    queryKey: ['customer-details', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedCustomerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(selectedCustomerId)
  });

  // Auto-fill form fields when customer details are loaded
  useEffect(() => {
    if (customerDetails) {
      setValue('nationality', customerDetails.nationality || '');
      setValue('drivingLicense', customerDetails.driver_license || '');
      setValue('phoneNumber', customerDetails.phone_number || '');
      setValue('email', customerDetails.email || '');
      setValue('address', customerDetails.address || '');
    }
  }, [customerDetails, setValue]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customer Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <CustomerSelect 
          register={register} 
          onCustomerSelect={onCustomerSelect}
        />
        
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            {...register("nationality", { required: "Nationality is required" })}
            placeholder="Enter nationality"
          />
          {errors.nationality && (
            <span className="text-sm text-red-500">{errors.nationality.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="drivingLicense">Driving License No.</Label>
          <Input
            {...register("drivingLicense", { required: "Driving license is required" })}
            placeholder="Enter driving license number"
          />
          {errors.drivingLicense && (
            <span className="text-sm text-red-500">{errors.drivingLicense.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone No.</Label>
          <Input
            {...register("phoneNumber", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Invalid phone number format"
              }
            })}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && (
            <span className="text-sm text-red-500">{errors.phoneNumber.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            placeholder="Enter email address"
          />
          {errors.email && (
            <span className="text-sm text-red-500">{errors.email.message}</span>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            {...register("address", { required: "Address is required" })}
            placeholder="Enter full address"
          />
          {errors.address && (
            <span className="text-sm text-red-500">{errors.address.message}</span>
          )}
        </div>
      </div>

      {selectedCustomerId && <CustomerDocuments customerId={selectedCustomerId} />}
    </div>
  );
};