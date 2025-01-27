import { supabase } from "@/integrations/supabase/client";
import { analyzeMarketPricing } from "./deepseekAnalysis";

interface AverageRent {
  model: string;
  averageRent: number;
  count: number;
}

interface ProfitMargin {
  vehicleId: string;
  vehicle: string;
  revenue: number;
  costs: number;
  profitMargin: number;
}

interface PricingSuggestion {
  vehicleId: string;
  currentPrice: number;
  suggestedPrice: number;
  profitMargin: number;
  reason: string;
}

export const calculateAverageRentByModel = async (): Promise<AverageRent[]> => {
  const { data, error } = await supabase
    .from('leases')
    .select(`
      rent_amount,
      vehicle:vehicles (
        make,
        model,
        year
      )
    `)
    .eq('status', 'active');

  if (error) throw error;

  const rentsByModel: { [key: string]: number[] } = {};
  const countByModel: { [key: string]: number } = {};

  data.forEach((lease) => {
    if (!lease.vehicle) return;
    const key = `${lease.vehicle.make} ${lease.vehicle.model} ${lease.vehicle.year}`;
    if (!rentsByModel[key]) {
      rentsByModel[key] = [];
      countByModel[key] = 0;
    }
    rentsByModel[key].push(lease.rent_amount || 0);
    countByModel[key]++;
  });

  return Object.entries(rentsByModel).map(([model, rents]) => ({
    model,
    averageRent: rents.reduce((a, b) => a + b, 0) / rents.length,
    count: countByModel[model]
  }));
};

export const calculateProfitMargins = async (): Promise<ProfitMargin[]> => {
  // First get active leases with their vehicles
  const { data: leases, error: leaseError } = await supabase
    .from('leases')
    .select(`
      id,
      rent_amount,
      vehicle_id,
      vehicle:vehicles (
        make,
        model,
        year
      )
    `)
    .eq('status', 'active');

  if (leaseError) throw leaseError;

  // Then get maintenance costs for each vehicle
  const profitMargins = await Promise.all(
    leases.map(async (lease) => {
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('cost')
        .eq('vehicle_id', lease.vehicle_id);

      if (maintenanceError) throw maintenanceError;

      const maintenanceCosts = maintenanceData?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
      const monthlyRevenue = lease.rent_amount || 0;
      const profitMargin = monthlyRevenue > 0 
        ? ((monthlyRevenue - maintenanceCosts) / monthlyRevenue) * 100 
        : 0;

      return {
        vehicleId: lease.vehicle_id,
        vehicle: lease.vehicle ? `${lease.vehicle.make} ${lease.vehicle.model} ${lease.vehicle.year}` : 'Unknown',
        revenue: monthlyRevenue,
        costs: maintenanceCosts,
        profitMargin
      };
    })
  );

  return profitMargins;
};

export const generatePricingSuggestions = async (): Promise<PricingSuggestion[]> => {
  const averageRents = await calculateAverageRentByModel();
  const margins = await calculateProfitMargins();
  
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      leases (
        rent_amount,
        status
      )
    `)
    .eq('status', 'available');

  if (error) throw error;

  const suggestions = await Promise.all(vehicles.map(async vehicle => {
    const currentLease = vehicle.leases?.find(l => l.status === 'active');
    const currentPrice = currentLease?.rent_amount || 0;
    const modelKey = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
    const averageForModel = averageRents.find(a => a.model === modelKey)?.averageRent || 0;
    const margin = margins.find(m => m.vehicleId === vehicle.id)?.profitMargin || 0;

    // Get AI analysis for pricing
    const aiAnalysis = await analyzeMarketPricing({
      vehicle,
      currentPrice,
      averageForModel,
      margin,
      marketData: {
        averageRents,
        margins
      }
    });

    let suggestedPrice = averageForModel;
    let reason = '';

    // Apply demand factor
    const demandFactor = 1.1; // 10% increase for high demand
    suggestedPrice *= demandFactor;

    // Adjust based on AI analysis if available
    if (aiAnalysis) {
      try {
        const analysis = JSON.parse(aiAnalysis);
        if (analysis.suggestedPrice) {
          suggestedPrice = analysis.suggestedPrice;
          reason = analysis.reason || '';
        }
      } catch (e) {
        console.error('Error parsing AI analysis:', e);
      }
    }

    // If no AI reason, use default logic
    if (!reason) {
      if (margin < 20) {
        suggestedPrice *= 1.15; // Increase price by 15% if profit margin is low
        reason = 'Low profit margin';
      } else if (currentPrice < averageForModel * 0.85) {
        reason = 'Underpriced compared to similar vehicles';
      } else if (currentPrice > averageForModel * 1.15) {
        reason = 'Overpriced compared to similar vehicles';
      } else {
        reason = 'Price is within market range';
      }
    }

    return {
      vehicleId: vehicle.id,
      currentPrice,
      suggestedPrice: Math.round(suggestedPrice),
      profitMargin: margin,
      reason
    };
  }));

  return suggestions;
};