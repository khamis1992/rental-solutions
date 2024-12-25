import { supabase } from "@/integrations/supabase/client";
import { TrafficFine } from "@/types/traffic-fines";

export const fetchTrafficFines = async (agreementId: string): Promise<TrafficFine[]> => {
  const { data, error } = await supabase
    .from('traffic_fines')
    .select(`
      *,
      lease:leases(
        id,
        customer_id,
        customer:profiles(
          id,
          full_name
        ),
        vehicle:vehicles(
          make,
          model,
          year,
          license_plate
        )
      )
    `)
    .eq('lease_id', agreementId)
    .order('violation_date', { ascending: false });

  if (error) {
    console.error('Error fetching traffic fines:', error);
    throw error;
  }

  return data as TrafficFine[];
};

export const deleteAllTrafficFines = async (agreementId: string) => {
  console.log('Attempting to delete traffic fines for lease:', agreementId);
  
  if (!agreementId) {
    throw new Error('Agreement ID is required');
  }

  const { data, error } = await supabase
    .from('traffic_fines')
    .delete()
    .eq('lease_id', agreementId)
    .select();

  if (error) {
    console.error('Error deleting traffic fines:', error);
    throw error;
  }

  console.log('Successfully deleted traffic fines:', data);
  return data;
};