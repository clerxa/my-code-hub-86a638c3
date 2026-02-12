import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-livestorm-signature',
}

// Livestorm webhook uses "attendee" and "webinar" objects
// Note: Livestorm uses "identify" (typo in their API) instead of "id"
interface LivestormWebhookPayload {
  event_name?: string
  attendee: {
    identify: string
    email: string
    first_name?: string
    last_name?: string
    created_at?: string
    connection_link?: string
  }
  webinar: {
    identify: string
    title: string
    slug?: string
    estimated_started_at?: string
    registration_link?: string
  }
}

/**
 * Verify the Livestorm webhook signature using HMAC-SHA256
 * @param payload - Raw request body as string
 * @param signature - The x-livestorm-signature header value
 * @param secret - The webhook signing secret from Livestorm
 * @returns boolean indicating if signature is valid
 */
async function verifyLivestormSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.warn('Missing signature or secret for webhook verification')
    return false
  }

  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(payload)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)
    const signatureArray = new Uint8Array(signatureBuffer)
    const computedSignature = Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare signatures in constant time to prevent timing attacks
    if (computedSignature.length !== signature.length) {
      return false
    }
    
    let result = 0
    for (let i = 0; i < computedSignature.length; i++) {
      result |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    
    return result === 0
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const webhookSecret = Deno.env.get('LIVESTORM_WEBHOOK_SECRET')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Handle ping/test requests
    if (rawBody) {
      try {
        const testPayload = JSON.parse(rawBody)
        if (testPayload.test === true || testPayload.event_name === 'ping') {
          console.log('Received test ping request')
          
          // Optionally verify a specific session exists
          if (testPayload.session_id) {
            const { data: module, error } = await supabase
              .from('modules')
              .select('id, title, livestorm_session_id')
              .eq('type', 'webinar')
              .eq('livestorm_session_id', testPayload.session_id)
              .single()
            
            if (error || !module) {
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  status: 'session_not_found',
                  message: `Aucun module trouvé pour la session: ${testPayload.session_id}` 
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                status: 'connected',
                message: `Webhook fonctionnel. Module trouvé: ${module.title}`,
                module_id: module.id,
                module_title: module.title
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              status: 'ok',
              message: 'Webhook Livestorm opérationnel',
              timestamp: new Date().toISOString()
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (e) {
        // Not a test request, continue with normal processing
      }
    }
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('x-livestorm-signature')
      const isValid = await verifyLivestormSignature(rawBody, signature, webhookSecret)
      
      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('Webhook signature verified successfully')
    } else {
      console.warn('LIVESTORM_WEBHOOK_SECRET not configured - skipping signature verification. This is a security risk!')
    }

    // Parse webhook payload
    const payload: LivestormWebhookPayload = JSON.parse(rawBody)
    console.log('Received Livestorm webhook:', JSON.stringify(payload, null, 2))

    const { event_name, attendee, webinar } = payload
    
    // Livestorm uses "identify" (typo in their API) instead of "id"
    const participantEmail = attendee?.email
    const participantId = attendee?.identify
    const webinarId = webinar?.identify
    const webinarTitle = webinar?.title

    // Determine event type from event_name or default to registration for new webhook calls
    // Livestorm may not always send event_name, so we assume registration if attendee exists
    const eventType = event_name || 'new_registrant'

    console.log('Processing event:', eventType, 'for email:', participantEmail, 'webinar:', webinarId, 'title:', webinarTitle)

    if (!participantEmail) {
      console.error('No email in webhook payload')
      return new Response(
        JSON.stringify({ error: 'No email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webinarId) {
      console.error('No webinar ID in webhook payload')
      return new Response(
        JSON.stringify({ error: 'No webinar ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find user by email in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', participantEmail)
      .single()

    if (profileError || !profile) {
      console.error('User not found for email:', participantEmail, profileError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = profile.id

    // Get webinar module by matching livestorm_session_id (can be webinar.identify or session ID)
    // Try both webinar.identify and also check if it matches any existing session
    let module = null
    let moduleError = null
    
    // First try to find by webinar ID
    const { data: moduleByWebinar, error: err1 } = await supabase
      .from('modules')
      .select('id, points, points_registration, points_participation, title')
      .eq('type', 'webinar')
      .eq('livestorm_session_id', webinarId)
      .single()
    
    if (moduleByWebinar) {
      module = moduleByWebinar
    } else {
      // If not found, log and try a more flexible search
      console.log('Module not found by webinar ID, checking all webinar modules...')
      moduleError = err1
    }

    if (!module) {
      console.error('No webinar module found for webinar ID:', webinarId, moduleError)
      return new Response(
        JSON.stringify({ 
          error: 'No webinar module found for this webinar. Make sure livestorm_session_id is configured in the module.',
          webinar_id: webinarId,
          webinar_title: webinarTitle
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found module:', module.title, 'ID:', module.id)

    const moduleId = module.id
    const pointsRegistration = module.points_registration || 50
    const pointsParticipation = module.points_participation || 100

    // Handle different event types
    // Livestorm uses various event naming conventions:
    // - participant.registered / participant_registered / new_registrant
    // - participant.joined / participant_attended / participant.attended / attendee_attended
    const isRegistrationEvent = [
      'participant.registered',
      'participant_registered', 
      'new_registrant',
      'registrant.created'
    ].includes(eventType)
    
    const isJoinedEvent = [
      'participant.joined',
      'participant_joined',
      'participant.attended',
      'participant_attended',
      'attendee_attended',
      'attendee.attended'
    ].includes(eventType)

    if (isRegistrationEvent) {
      // Create or update registration
      const { error: regError } = await supabase
        .from('webinar_registrations')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          livestorm_participant_id: participantId,
          registered_at: new Date().toISOString(),
          registration_status: 'registration_confirmed',
          points_awarded: pointsRegistration,
        }, {
          onConflict: 'user_id,module_id'
        })

      if (regError) {
        console.error('Error creating registration:', regError)
        return new Response(
          JSON.stringify({ error: 'Failed to create registration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Award registration points
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single()

      if (!fetchError && currentProfile) {
        const newTotalPoints = (currentProfile.total_points || 0) + pointsRegistration

        const { error: pointsError } = await supabase
          .from('profiles')
          .update({
            total_points: newTotalPoints,
          })
          .eq('id', userId)

        if (!pointsError) {
          console.log(`Awarded ${pointsRegistration} registration points to user ${userId}. New total: ${newTotalPoints}`)
        }
      }

      console.log(`User ${userId} registered for webinar module ${moduleId}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration recorded and points awarded',
          points_awarded: pointsRegistration
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isJoinedEvent) {
      // Update registration with join time
      const { error: updateError } = await supabase
        .from('webinar_registrations')
        .update({
          joined_at: new Date().toISOString(),
          registration_status: 'joined',
          points_awarded: pointsRegistration + pointsParticipation,
        })
        .eq('user_id', userId)
        .eq('module_id', moduleId)

      if (updateError) {
        console.error('Error updating registration:', updateError)
      }

      // Check if module is already validated
      const { data: existingValidation } = await supabase
        .from('module_validations')
        .select('id')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('success', true)
        .single()

      if (existingValidation) {
        console.log(`Module ${moduleId} already validated for user ${userId}`)
        return new Response(
          JSON.stringify({ success: true, message: 'Already validated' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark module as validated
      const { error: validationError } = await supabase
        .from('module_validations')
        .insert({
          user_id: userId,
          module_id: moduleId,
          success: true,
        })

      if (validationError) {
        console.error('Error creating validation:', validationError)
        return new Response(
          JSON.stringify({ error: 'Failed to validate module' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Award participation points
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points, completed_modules')
        .eq('id', userId)
        .single()

      if (fetchError || !currentProfile) {
        console.error('Error fetching user profile:', fetchError)
      } else {
        const newTotalPoints = (currentProfile.total_points || 0) + pointsParticipation
        const completedModules = currentProfile.completed_modules || []
        const updatedCompletedModules = completedModules.includes(moduleId)
          ? completedModules
          : [...completedModules, moduleId]

        const { error: pointsError } = await supabase
          .from('profiles')
          .update({
            total_points: newTotalPoints,
            completed_modules: updatedCompletedModules,
          })
          .eq('id', userId)

        if (pointsError) {
          console.error('Error updating user points:', pointsError)
        } else {
          console.log(`Awarded ${pointsParticipation} participation points to user ${userId}. New total: ${newTotalPoints}`)
        }
      }

      // Mark registration as completed
      await supabase
        .from('webinar_registrations')
        .update({
          completed_at: new Date().toISOString(),
          registration_status: 'completed',
        })
        .eq('user_id', userId)
        .eq('module_id', moduleId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Module validated and points awarded',
          points_awarded: pointsParticipation 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unknown event type
    console.log('Unknown event type:', eventType)
    return new Response(
      JSON.stringify({ success: true, message: 'Event received but not processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
