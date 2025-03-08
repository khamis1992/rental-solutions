
import { Database } from "@/integrations/supabase/types";

export type VehicleStatus = Database['public']['Enums']['vehicle_status'];

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  license_plate: string;
  vin: string;
  status: VehicleStatus;
  mileage: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  location: string | null;
  insurance_company: string | null;
}

export interface VehicleTableItem extends Vehicle {
  selected?: boolean;
}

export interface VehicleFilterParams {
  status?: VehicleStatus;
  make?: string;
  model?: string;
  year?: number;
  searchQuery?: string;
}
