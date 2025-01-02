import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all vehicles with their sensor data
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        mileage,
        vehicle_sensor_data (*)
      `)
      .order('created_at', { ascending: false })

    if (vehiclesError) throw vehiclesError

    // Analyze each vehicle's data using Perplexity API
    for (const vehicle of vehicles) {
      const sensorData = vehicle.vehicle_sensor_data
      if (!sensorData?.length) continue

      const latestData = sensorData[0]
      
      // Prepare the context for Perplexity API
      const context = {
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
        },
        sensorData: {
          oilLife: latestData.oil_life_remaining,
          brakePadWear: latestData.brake_pad_wear,
          batteryHealth: latestData.battery_health,
          engineTemp: latestData.engine_temperature,
          tirePressure: latestData.tire_pressure,
        }
      }

      // Call Perplexity API for analysis
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a vehicle maintenance expert AI. Analyze the vehicle sensor data and provide maintenance predictions. Be precise and specific.'
            },
            {
              role: 'user',
              content: `Analyze this vehicle's maintenance needs based on its sensor data: ${JSON.stringify(context)}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      })

      if (!perplexityResponse.ok) {
        console.error('Perplexity API error:', await perplexityResponse.text())
        continue
      }

      const analysis = await perplexityResponse.json()
      
      // Process predictions based on both sensor data and AI analysis
      const predictions = []

      // Add AI-enhanced predictions
      if (analysis.choices?.[0]) {
        const aiAnalysis = analysis.choices[0].message.content
        
        // Parse AI recommendations and combine with sensor data
        const combinedAnalysis = {
          ai_model: 'llama-3.1-sonar-large-128k-online',
          ai_analysis_details: {
            raw_analysis: aiAnalysis,
            confidence_score: 0.85,
            analysis_timestamp: new Date().toISOString()
          }
        }

        // Oil change prediction
        if (latestData.oil_life_remaining < 30) {
          predictions.push({
            vehicle_id: vehicle.id,
            prediction_type: 'oil_change',
            predicted_date: new Date(Date.now() + (latestData.oil_life_remaining * 24 * 60 * 60 * 1000)),
            confidence_score: 0.9,
            predicted_issues: ['Low oil life'],
            recommended_services: ['Oil change', 'Oil filter replacement'],
            estimated_cost: 150,
            priority: latestData.oil_life_remaining < 15 ? 'high' : 'medium',
            ...combinedAnalysis
          })
        }

        // Brake service prediction
        if (latestData.brake_pad_wear > 70) {
          predictions.push({
            vehicle_id: vehicle.id,
            prediction_type: 'brake_service',
            predicted_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
            confidence_score: 0.85,
            predicted_issues: ['Brake pad wear exceeding 70%'],
            recommended_services: ['Brake pad replacement', 'Brake system inspection'],
            estimated_cost: 300,
            priority: latestData.brake_pad_wear > 85 ? 'high' : 'medium',
            ...combinedAnalysis
          })
        }

        // Battery health prediction
        if (latestData.battery_health < 60) {
          predictions.push({
            vehicle_id: vehicle.id,
            prediction_type: 'battery_replacement',
            predicted_date: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)),
            confidence_score: 0.8,
            predicted_issues: ['Low battery health'],
            recommended_services: ['Battery replacement', 'Electrical system check'],
            estimated_cost: 200,
            priority: latestData.battery_health < 40 ? 'high' : 'medium',
            ...combinedAnalysis
          })
        }
      }

      // Store predictions in the database
      if (predictions.length > 0) {
        const { error: predictionsError } = await supabase
          .from('maintenance_predictions')
          .insert(predictions)

        if (predictionsError) {
          console.error('Error storing predictions:', predictionsError)
          continue
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Maintenance analysis completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})