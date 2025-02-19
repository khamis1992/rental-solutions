
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UseFormSetValue } from "react-hook-form";
import { AgreementFormData } from "../hooks/useAgreementForm";
import { Template } from "@/types/agreement.types";
import { useEffect, useRef } from "react";

interface AgreementTemplateSelectProps {
  setValue: UseFormSetValue<AgreementFormData>;
}

export const AgreementTemplateSelect = ({ setValue }: AgreementTemplateSelectProps) => {
  const hasInitialized = useRef(false);
  
  const { data: templates } = useQuery({
    queryKey: ["agreement-templates"],
    queryFn: async () => {
      console.log("Fetching templates...");
      const { data, error } = await supabase
        .from("agreement_templates")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching templates:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No templates found in database");
        return [];
      }

      console.log("Fetched templates:", data);
      return data;
    },
  });

  useEffect(() => {
    if (!hasInitialized.current && templates && templates.length > 0) {
      // Find the standard rental agreement template
      const standardTemplate = templates.find(t => t.name.toLowerCase().includes('standard rental'));
      if (standardTemplate) {
        handleTemplateSelect(standardTemplate.id);
        hasInitialized.current = true;
      }
    }
  }, [templates, setValue]);

  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates?.find((t) => t.id === templateId);
    if (!selectedTemplate) {
      console.log("No template found with ID:", templateId);
      return;
    }

    console.log("Setting template values:", selectedTemplate);

    // Set the template ID
    setValue("templateId", templateId);

    // Parse duration from agreement_duration string
    let durationMonths = 12; // Default value
    try {
      const durationStr = selectedTemplate.agreement_duration;
      if (durationStr.includes("months") || durationStr.includes("month")) {
        const match = durationStr.match(/(\d+)/);
        if (match) {
          const months = parseInt(match[1]);
          if (!isNaN(months)) {
            durationMonths = months;
          }
        }
      }
    } catch (error) {
      console.error("Error parsing duration:", error);
    }

    // Only set values if they exist in the template
    setValue("agreementType", selectedTemplate.agreement_type);
    if (selectedTemplate.rent_amount) {
      setValue("rentAmount", selectedTemplate.rent_amount);
    }
    if (selectedTemplate.final_price) {
      setValue("finalPrice", selectedTemplate.final_price);
    }
    setValue("agreementDuration", durationMonths);
    if (selectedTemplate.daily_late_fee) {
      setValue("dailyLateFee", selectedTemplate.daily_late_fee);
    }

    console.log("Applied template values:", selectedTemplate);
  };

  // Return null to hide the component while maintaining functionality
  return null;
};
