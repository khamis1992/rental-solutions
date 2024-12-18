import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LeaseStatus = Database["public"]["Enums"]["lease_status"];

const normalizeStatus = (status: string): LeaseStatus => {
  if (!status) return 'pending_payment';
  const statusMap: Record<string, LeaseStatus> = {
    'open': 'active',
    'active': 'active',
    'closed': 'closed',
    'cancelled': 'closed',
    'pending': 'pending_payment',
    'pending_payment': 'pending_payment',
    'pending_deposit': 'pending_deposit'
  };
  return statusMap[status.toLowerCase().trim()] || 'pending_payment';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying operation. Attempts remaining: ${retries}`);
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs * 2);
  }
};

const convertDateFormat = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Split the date string by '/'
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    // Parse the parts as numbers and validate them
    let [day, month, year] = parts.map(part => parseInt(part.trim(), 10));
    
    // Validate month (1-12)
    if (month < 1 || month > 12) return null;
    
    // Validate day (1-31, could be more specific per month)
    if (day < 1 || day > 31) return null;
    
    // Validate year (reasonable range)
    if (year < 2000 || year > 2100) return null;
    
    // Format with leading zeros
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    return `${year}-${formattedMonth}-${formattedDay}`;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

export const getOrCreateCustomer = async () => {
  try {
    // First try to get an existing customer
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
    
    // Create a new customer with a generated UUID
    const newCustomerId = crypto.randomUUID();
    const { data: newCustomer, error } = await retryOperation(async () =>
      await supabase
        .from('profiles')
        .insert({
          id: newCustomerId,
          full_name: `Default Customer`,
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
    // First try to get an existing available vehicle
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

    // If no vehicle exists, create a default one
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

export const createAgreement = async (agreement: Record<string, string>, customerId: string, vehicleId: string) => {
  try {
    // Log raw dates from CSV
    console.log('Raw CSV data for dates:', {
      checkoutDate: agreement['Check-out Date'],
      checkinDate: agreement['Check-in Date'],
      returnDate: agreement['Return Date']
    });

    // Convert dates to PostgreSQL format
    const startDate = convertDateFormat(agreement['Check-out Date']);
    const endDate = convertDateFormat(agreement['Check-in Date']);
    const returnDate = convertDateFormat(agreement['Return Date']);

    // Log converted dates
    console.log('Converted dates:', {
      startDate,
      endDate,
      returnDate
    });

    const agreementData = {
      agreement_number: agreement['Agreement Number'] || `AGR${Date.now()}`,
      license_no: agreement['License No'] || 'UNKNOWN',
      license_number: agreement['License Number'] || 'UNKNOWN',
      start_date: startDate,
      end_date: endDate,
      return_date: returnDate,
      status: normalizeStatus(agreement['STATUS']),
      customer_id: customerId,
      vehicle_id: vehicleId,
      total_amount: 0,
      initial_mileage: 0
    };

    console.log('Creating agreement with data:', agreementData);

    const { error } = await retryOperation(async () =>
      await supabase
        .from('leases')
        .upsert(agreementData, {
          onConflict: 'agreement_number',
          ignoreDuplicates: true // Skip duplicates instead of updating them
        })
    );

    if (error) {
      if (error.code === '23505') { // Duplicate key error
        console.log('Skipping duplicate agreement:', agreementData.agreement_number);
        return;
      }
      console.error('Error creating agreement:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createAgreement:', error);
    throw error;
  }
};