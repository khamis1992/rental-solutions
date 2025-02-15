
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LeadFormData } from "@/types/sales.types";
import { useQueryClient } from "@tanstack/react-query";

export const CreateLeadDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<LeadFormData>();

  const onSubmit = async (data: LeadFormData) => {
    try {
      // First create a basic profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: data.full_name,
          phone_number: data.phone_number,
          email: data.email,
          role: 'customer',
          status: 'pending_review'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then create the sales lead
      const { error: leadError } = await supabase
        .from('sales_leads')
        .insert({
          customer_id: profile.id,
          full_name: data.full_name,
          phone_number: data.phone_number,
          email: data.email,
          preferred_vehicle_type: data.preferred_vehicle_type,
          preferred_agreement_type: data.preferred_agreement_type,
          budget_range_min: data.budget_range_min,
          budget_range_max: data.budget_range_max,
          notes: data.notes,
          status: 'new',
          onboarding_progress: {
            customer_conversion: false,
            agreement_creation: false,
            initial_payment: false
          }
        });

      if (leadError) throw leadError;

      toast.success("Lead created successfully");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast.error(error.message || "Failed to create lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...form.register("full_name", { required: true })}
              placeholder="Enter customer's full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              {...form.register("phone_number", { required: true })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_vehicle_type">Preferred Vehicle Type</Label>
            <Select onValueChange={(value) => form.setValue("preferred_vehicle_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_range_min">Minimum Budget</Label>
              <Input
                id="budget_range_min"
                type="number"
                {...form.register("budget_range_min", { valueAsNumber: true })}
                placeholder="Min budget"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_range_max">Maximum Budget</Label>
              <Input
                id="budget_range_max"
                type="number"
                {...form.register("budget_range_max", { valueAsNumber: true })}
                placeholder="Max budget"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Enter any additional notes"
            />
          </div>

          <Button type="submit" className="w-full">
            Create Lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
