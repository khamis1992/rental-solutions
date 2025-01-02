import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "../utils/retryUtils";

export const getOrCreateCustomer = async () => {
  try {
    const { data: existingCustomer } = await retryOperation(async () => 
      await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'customer')
        .limit(1)
        .single()
    );
      
    if (existingCustomer) {
      console.log('Using existing customer:', existingCustomer.id);
      return existingCustomer;
    }
    
    const newCustomerId = crypto.randomUUID();
    const { data: newCustomer, error } = await retryOperation(async () =>
      await supabase
        .from('profiles')
        .insert({
          id: newCustomerId,
          full_name: "Default Customer",
          role: 'customer'
        })
        .select()
        .single()
    );
      
    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }

    console.log('Created new customer:', newCustomer.id);
    return newCustomer;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
};

export const getAvailableVehicle = async () => {
  try {
    const { data: existingVehicle } = await retryOperation(async () =>
      await supabase
        .from('vehicles')
        .select('id')
        .limit(1)
        .single()
    );

    if (existingVehicle) {
      return existingVehicle;
    }

    const { data: newVehicle } = await retryOperation(async () =>
      await supabase
        .from('vehicles')
        .insert({
          make: 'Default',
          model: 'Model',
          year: 2024,
          license_plate: 'TEMP-' + Date.now(),
          vin: 'TEMP-' + Date.now(),
          status: 'available'
        })
        .select()
        .single()
    );

    return newVehicle;
  } catch (error) {
    console.error('Error in getAvailableVehicle:', error);
    throw error;
  }
};