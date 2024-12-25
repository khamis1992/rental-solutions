import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName } = await req.json()
    if (!fileName) {
      throw new Error('No file name provided')
    }
    console.log('Processing file:', fileName)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download file content
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(fileName)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    const content = await fileData.text()
    console.log('File content loaded')
    
    // Split content into lines and clean them
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    console.log(`Found ${lines.length} lines in file`)

    if (lines.length < 2) {
      throw new Error('File is empty or contains only headers')
    }

    // Parse and validate headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const requiredHeaders = [
      'serial_number',
      'violation_number',
      'violation_date',
      'license_plate',
      'fine_location',
      'violation_charge',
      'fine_amount',
      'violation_points'
    ]

    console.log('File headers:', headers)

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Process rows
    const fines = []
    const errors = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      try {
        console.log(`Processing row ${i}:`, lines[i])
        
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        
        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1} has incorrect number of columns (expected ${headers.length}, got ${values.length})`)
        }

        const rowData = headers.reduce((obj, header, index) => {
          obj[header] = values[index]
          return obj
        }, {} as Record<string, string>)

        const emptyFields = requiredHeaders.filter(field => !rowData[field]?.trim())
        if (emptyFields.length > 0) {
          throw new Error(`Missing required values for fields: ${emptyFields.join(', ')}`)
        }

        const date = new Date(rowData.violation_date)
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format. Expected YYYY-MM-DD, got: ${rowData.violation_date}`)
        }

        const amount = parseFloat(rowData.fine_amount)
        if (isNaN(amount)) {
          throw new Error(`Invalid amount: ${rowData.fine_amount}`)
        }

        const points = parseInt(rowData.violation_points)
        if (isNaN(points)) {
          throw new Error(`Invalid points: ${rowData.violation_points}`)
        }

        fines.push({
          serial_number: rowData.serial_number,
          violation_number: rowData.violation_number,
          violation_date: date.toISOString(),
          license_plate: rowData.license_plate,
          fine_location: rowData.fine_location,
          violation_charge: rowData.violation_charge,
          fine_amount: amount,
          violation_points: points,
          payment_status: 'pending',
          assignment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        console.log('Successfully processed row:', rowData)
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        errors.push({
          row: i + 1,
          error: error.message,
          data: lines[i]
        })
      }
    }

    console.log(`Processed ${lines.length - 1} rows:`)
    console.log(`- Valid records: ${fines.length}`)
    console.log(`- Errors: ${errors.length}`)

    if (fines.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid records found to import. Please check the file format and ensure all required fields are properly formatted.',
          validation_errors: errors
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Insert fines into database
    const { error: insertError } = await supabase
      .from('traffic_fines')
      .insert(fines)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // Log import results
    const { error: logError } = await supabase
      .from('traffic_fine_imports')
      .insert({
        file_name: fileName,
        total_fines: fines.length,
        unassigned_fines: fines.length,
        import_errors: errors.length > 0 ? errors : null,
        processed_by: null,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging import:', logError)
    }

    console.log('Import completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: fines.length,
        errors: errors.length > 0 ? errors : null 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})