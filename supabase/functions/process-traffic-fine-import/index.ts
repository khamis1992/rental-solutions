import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { downloadFile, parseCSVContent } from './fileUtils.ts'
import { processRows, insertFines } from './dataProcessor.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName } = await req.json()
    console.log('Processing file:', fileName)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download and parse file
    const fileContent = await downloadFile(supabase, fileName)
    const rows = parseCSVContent(fileContent)

    if (rows.length < 2) {
      throw new Error('File contains no data rows')
    }

    // Create import batch record
    const { data: batchData, error: batchError } = await supabase
      .from('traffic_fine_imports')
      .insert({
        file_name: fileName,
        processed_by: req.headers.get('x-user-id'),
      })
      .select()
      .single()

    if (batchError) {
      throw batchError
    }

    // Process and insert fines
    const fines = processRows(rows, batchData.id)
    const processed = await insertFines(supabase, fines)

    // Update batch record
    await supabase
      .from('traffic_fine_imports')
      .update({
        total_fines: processed,
        unassigned_fines: processed,
      })
      .eq('id', batchData.id)

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})