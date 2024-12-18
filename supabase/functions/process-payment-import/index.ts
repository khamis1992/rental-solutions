import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment import process...');
    const { fileName } = await req.json();
    console.log('Processing file:', fileName);

    if (!fileName) {
      throw new Error('fileName is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('imports')
      .download(fileName);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const text = await fileData.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(h => h.trim());
    console.log('CSV Headers:', headers);

    let successCount = 0;
    let errorCount = 0;
    let errors = [];

    await supabase
      .from('import_logs')
      .update({ status: 'processing' })
      .eq('file_name', fileName);

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;

      const values = rows[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        try {
          const customerName = values[headers.indexOf('Customer Name')];
          const amount = parseFloat(values[headers.indexOf('Amount')]);
          const paymentDate = values[headers.indexOf('Payment_Date')];
          const paymentMethod = values[headers.indexOf('Payment_Method')];
          const status = values[headers.indexOf('status')];
          const paymentNumber = values[headers.indexOf('Payment_Number')];

          if (!customerName) {
            throw new Error('Customer Name is missing');
          }

          // Get customer ID from name
          const { data: customerData, error: customerError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('full_name', customerName.trim())
            .single();

          if (customerError || !customerData) {
            throw new Error(`Customer "${customerName}" not found in the system`);
          }

          // Find active lease for customer
          const { data: activeLease, error: leaseError } = await supabase
            .from('leases')
            .select('id')
            .eq('customer_id', customerData.id)
            .in('status', ['active', 'pending_payment'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (leaseError || !activeLease) {
            throw new Error(`No active lease found for customer "${customerName}"`);
          }

          // Convert date from DD-MM-YYYY to ISO format
          const [day, month, year] = paymentDate.split('-');
          const isoDate = `${year}-${month}-${day}`;

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              lease_id: activeLease.id,
              amount,
              status,
              payment_date: new Date(isoDate).toISOString(),
              payment_method,
              transaction_id: paymentNumber,
            });

          if (paymentError) {
            throw paymentError;
          }

          successCount++;
          console.log(`Successfully imported payment for customer: ${customerName}`);

        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          errorCount++;
          errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }
    }

    await supabase
      .from('import_logs')
      .update({
        status: 'completed',
        records_processed: successCount,
        errors: errors.length > 0 ? errors : null
      })
      .eq('file_name', fileName);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import completed. Successfully processed ${successCount} payments with ${errorCount} errors.`,
        processed: successCount,
        errors: errorCount,
        errorDetails: errors
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Import process failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});