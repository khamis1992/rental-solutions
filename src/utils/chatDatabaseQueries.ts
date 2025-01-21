import { supabase } from "@/integrations/supabase/client";

export const getDatabaseResponse = async (query: string): Promise<string | null> => {
  const lowercaseQuery = query.toLowerCase();
  
  // Vehicle-related queries
  if (lowercaseQuery.includes('how many') && 
      (lowercaseQuery.includes('vehicle') || lowercaseQuery.includes('car'))) {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('status', { count: 'exact' });
      
    if (error) throw error;
    
    const counts = {
      total: vehicles?.length || 0,
      available: vehicles?.filter(v => v.status === 'available').length || 0,
      rented: vehicles?.filter(v => v.status === 'rented').length || 0,
      maintenance: vehicles?.filter(v => v.status === 'maintenance').length || 0
    };
    
    return `Currently, we have ${counts.total} vehicles in our fleet:
    - ${counts.available} available for rent
    - ${counts.rented} currently rented
    - ${counts.maintenance} under maintenance`;
  }
  
  // Customer-related queries
  if ((lowercaseQuery.includes('how many') && lowercaseQuery.includes('customer')) || 
      lowercaseQuery.includes('customer count')) {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'customer');
      
    if (error) throw error;
    
    return `We currently have ${count} registered customers in our system.`;
  }
  
  // Agreement-related queries
  if (lowercaseQuery.includes('active') && 
      (lowercaseQuery.includes('rental') || lowercaseQuery.includes('agreement'))) {
    const { data, error } = await supabase
      .from('leases')
      .select('*', { count: 'exact' })
      .eq('status', 'active');
      
    if (error) throw error;
    
    return `There are currently ${data?.length || 0} active rental agreements.`;
  }

  // Payment-related queries
  if (lowercaseQuery.includes('payment') || lowercaseQuery.includes('revenue')) {
    const { data: payments, error } = await supabase
      .from('unified_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (payments && payments.length > 0) {
      const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      return `Recent payment activity: ${payments.length} payments processed, totaling ${totalAmount} QAR.`;
    }
  }

  // Traffic fines queries
  if (lowercaseQuery.includes('traffic') || lowercaseQuery.includes('fine')) {
    const { data: fines, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (fines) {
      const pendingFines = fines.filter(f => f.payment_status === 'pending').length;
      const totalFines = fines.length;
      return `There are ${pendingFines} pending traffic fines out of ${totalFines} total fines recorded.`;
    }
  }

  // Maintenance queries
  if (lowercaseQuery.includes('maintenance') || lowercaseQuery.includes('repair')) {
    const { data: maintenance, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('status', 'in_progress');

    if (error) throw error;

    return `There are currently ${maintenance?.length || 0} vehicles under maintenance.`;
  }

  // If no matching query pattern is found, return a helpful message
  return "I can provide information about our vehicles, customers, agreements, payments, traffic fines, and maintenance. Please ask specific questions about these topics.";
};