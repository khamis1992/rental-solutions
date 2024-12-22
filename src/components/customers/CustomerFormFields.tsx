import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CustomerDocumentUpload } from "./CustomerDocumentUpload";
import { ContractDocumentUpload } from "./ContractDocumentUpload";
import { UseFormReturn } from "react-hook-form";

interface CustomerFormFieldsProps {
  form: UseFormReturn<any>;
}

export const CustomerFormFields = ({ form }: CustomerFormFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="full_name"
        rules={{ required: "Full name is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone_number"
        rules={{ required: "Phone number is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="+1 234 567 890" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="address"
        rules={{ required: "Address is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input placeholder="123 Main St" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="driver_license"
        rules={{ required: "Driver license is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Driver License</FormLabel>
            <FormControl>
              <Input placeholder="DL12345678" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="id_document_url"
        render={({ field }) => (
          <CustomerDocumentUpload
            label="ID Document"
            fieldName="id_document_url"
            onUploadComplete={field.onChange}
          />
        )}
      />
      <FormField
        control={form.control}
        name="license_document_url"
        render={({ field }) => (
          <CustomerDocumentUpload
            label="Driver License Document"
            fieldName="license_document_url"
            onUploadComplete={field.onChange}
          />
        )}
      />
      <FormField
        control={form.control}
        name="contract_document_url"
        render={({ field }) => (
          <ContractDocumentUpload
            label="Contract Document"
            fieldName="contract_document_url"
            onUploadComplete={field.onChange}
          />
        )}
      />
    </>
  );
};