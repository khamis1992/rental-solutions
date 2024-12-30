import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { CaseBasicInfo } from "./case-form/CaseBasicInfo";
import { CaseFinancialInfo } from "./case-form/CaseFinancialInfo";
import { CasePrioritySelect } from "./case-form/CasePrioritySelect";

interface CreateLegalCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLegalCaseDialog({
  open,
  onOpenChange,
}: CreateLegalCaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      customer_id: "",
      case_type: "",
      amount_owed: "",
      description: "",
      priority: "medium",
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("legal_cases")
        .insert([{
          ...values,
          amount_owed: parseFloat(values.amount_owed),
          status: "pending_reminder",
        }]);

      if (error) throw error;

      toast.success("Legal case created successfully");
      queryClient.invalidateQueries({ queryKey: ["legal-cases"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating legal case:", error);
      toast.error("Failed to create legal case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Legal Case</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CaseBasicInfo form={form} />
            <CaseFinancialInfo form={form} />
            <CasePrioritySelect form={form} />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Create Case
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}