import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // If the date is already in YYYY-MM-DD format or showing as 1970-01-01, we need to fix it
  if (dateStr.includes('1970-01-01')) {
    return null;
  }

  // Clean the input string and split by either '/' or '-'
  const cleanDateStr = dateStr.trim();
  const parts = cleanDateStr.split(/[-/]/);
  
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate the date parts
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.error(`Invalid date parts in: ${dateStr}`);
      return null;
    }

    // Validate month range
    if (month < 1 || month > 12) {
      console.error(`Invalid month in date: ${dateStr}`);
      return null;
    }

    // Validate day range for the specific month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      console.error(`Invalid day in date: ${dateStr}`);
      return null;
    }

    // Convert to YYYY-MM-DD format
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  console.error(`Invalid date format: ${dateStr}`);
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all agreements
    const { data: agreements, error: fetchError } = await supabase
      .from('leases')
      .select('*');

    if (fetchError) throw fetchError;

    let updatedCount = 0;
    let errorCount = 0;

    // Process each agreement
    for (const agreement of agreements) {
      try {
        const updates: any = {};
        
        // Process start_date
        if (agreement.start_date?.includes('1970')) {
          const correctedStartDate = parseDate(agreement.checkout_date);
          if (correctedStartDate) {
            updates.start_date = correctedStartDate;
          }
        }

        // Process end_date
        if (agreement.end_date?.includes('1970')) {
          const correctedEndDate = parseDate(agreement.checkin_date);
          if (correctedEndDate) {
            updates.end_date = correctedEndDate;
          }
        }

        // Only update if we have changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('leases')
            .update(updates)
            .eq('id', agreement.id);

          if (updateError) throw updateError;
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating agreement ${agreement.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} agreements. Encountered ${errorCount} errors.`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});