import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify HubSpot webhook signature (v2)
async function verifyHubSpotSignature(req: Request, body: string): Promise<boolean> {
  const appSecret = Deno.env.get('HUBSPOT_APP_SECRET')
  if (!appSecret) {
    console.warn('HUBSPOT_APP_SECRET not configured, skipping signature verification')
    return true // Allow if not configured (backwards compatible)
  }

  const signature = req.headers.get('x-hubspot-signature') || req.headers.get('x-hubspot-signature-v3')
  if (!signature) {
    console.error('Missing HubSpot signature header')
    return false
  }

  // HubSpot v2 signature: SHA-256 hash of appSecret + requestBody
  const encoder = new TextEncoder()
  const data = encoder.encode(appSecret + body)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return signature === expectedSignature
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read body as text for signature verification
    const bodyText = await req.text()

    // Verify HubSpot signature
    const isValid = await verifyHubSpotSignature(req, bodyText)
    if (!isValid) {
      console.error('Invalid HubSpot webhook signature')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Parse the webhook payload from HubSpot
    const payload = JSON.parse(bodyText)
    console.log('Received HubSpot webhook:', JSON.stringify(payload, null, 2))

    // HubSpot can send array of events or single event
    const events = Array.isArray(payload) ? payload : [payload]
    
    for (const event of events) {
      // Extract meeting details from HubSpot webhook
      // HubSpot meeting webhooks can have different structures
      const meetingData = extractMeetingData(event)
      
      if (!meetingData.email) {
        console.log('No email found in event, skipping:', event)
        continue
      }

      console.log('Processing meeting for email:', meetingData.email)

      // Find the user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, company_id, first_name, last_name')
        .eq('email', meetingData.email.toLowerCase())
        .maybeSingle()

      // Determine booking source from the meeting title or properties
      const bookingSource = determineBookingSource(meetingData)

      // Try to find the most recent referrer for this user
      let referrerPath: string | null = null
      let referrerLabel: string | null = null
      
      const { data: referrerData } = await supabase
        .from('booking_referrers')
        .select('id, referrer_path, referrer_label')
        .eq('user_email', meetingData.email.toLowerCase())
        .is('matched_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (referrerData) {
        referrerPath = referrerData.referrer_path
        referrerLabel = referrerData.referrer_label
        console.log('Found referrer for user:', referrerPath, '->', referrerLabel)
      }

      // Upsert the appointment record (avoid duplicates for same meeting + time slot)
      const { data: insertedAppointment, error: insertError } = await supabase
        .from('hubspot_appointments')
        .upsert({
          hubspot_meeting_id: meetingData.meetingId,
          hubspot_contact_id: meetingData.contactId,
          user_id: profile?.id || null,
          user_email: meetingData.email.toLowerCase(),
          user_name: meetingData.name || (profile ? `${profile.first_name} ${profile.last_name}` : null),
          meeting_title: meetingData.title,
          meeting_start_time: meetingData.startTime,
          meeting_end_time: meetingData.endTime,
          meeting_link: meetingData.meetingLink,
          host_name: meetingData.hostName,
          booking_source: bookingSource,
          company_id: profile?.company_id || null,
          raw_payload: event,
          referrer_path: referrerPath,
          referrer_label: referrerLabel,
        }, {
          onConflict: 'idx_hubspot_appointments_unique_slot',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error inserting appointment:', insertError)
      } else {
        console.log('Successfully recorded appointment for:', meetingData.email)
        
        // Mark the referrer as matched
        if (referrerData && insertedAppointment) {
          await supabase
            .from('booking_referrers')
            .update({ 
              matched_at: new Date().toISOString(),
              appointment_id: insertedAppointment.id
            })
            .eq('id', referrerData.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper to extract value from HubSpot property format
// HubSpot properties can be: string, { value: string, versions: [...] }, or undefined
function getPropertyValue(prop: any): string | null {
  if (!prop) return null
  if (typeof prop === 'string') return prop
  if (typeof prop === 'object' && prop.value !== undefined) return String(prop.value)
  return null
}

// Extract meeting data from various HubSpot webhook formats
function extractMeetingData(event: any) {
  // HubSpot meetings webhook format can vary
  // Common structures include direct properties or nested in objectProperties
  
  const properties = event.properties || event.objectProperties || event || {}
  
  // Try multiple paths for email - handle both string and object formats
  const email = 
    getPropertyValue(properties.hs_meeting_contact_email) ||
    getPropertyValue(properties.email) ||
    getPropertyValue(event.email) ||
    getPropertyValue(event.properties?.email) ||
    extractEmailFromContacts(event)

  // Try multiple paths for meeting details
  // HubSpot stores the actual scheduled meeting time in engagements_last_meeting_booked or hs_latest_meeting_activity
  const startTime = getPropertyValue(properties.engagements_last_meeting_booked) ||
                    getPropertyValue(properties.hs_latest_meeting_activity) ||
                    getPropertyValue(properties.hs_meeting_start_time) || 
                    getPropertyValue(properties.hs_timestamp) || 
                    getPropertyValue(event.startTime)
  const endTime = getPropertyValue(properties.hs_meeting_end_time) || 
                  getPropertyValue(event.endTime)
  const title = getPropertyValue(properties.hs_meeting_title) || 
                getPropertyValue(properties.title) || 
                getPropertyValue(event.title) ||
                getPropertyValue(properties.recent_conversion_event_name) ||
                'Rendez-vous'
  const meetingLink = getPropertyValue(properties.hs_meeting_location) || 
                      getPropertyValue(properties.hs_meeting_external_url) || 
                      getPropertyValue(event.meetingLink)

  // Extract name from various sources
  const firstName = getPropertyValue(properties.hs_meeting_contact_firstname) || 
                    getPropertyValue(properties.firstname) ||
                    getPropertyValue(event.firstName)
  const lastName = getPropertyValue(properties.hs_meeting_contact_lastname) || 
                   getPropertyValue(properties.lastname) ||
                   getPropertyValue(event.lastName)
  
  const name = firstName ? `${firstName} ${lastName || ''}`.trim() : null

  // Extract host/organizer name - check associated-owner first (primary HubSpot format)
  const associatedOwner = event['associated-owner'] || event.associatedOwner || {}
  
  const hostFirstName = associatedOwner['first-name'] || associatedOwner.firstName ||
                        getPropertyValue(properties.hs_meeting_organizer_firstname) ||
                        getPropertyValue(properties.hs_organizer_firstname) ||
                        getPropertyValue(event.organizerFirstName)
  const hostLastName = associatedOwner['last-name'] || associatedOwner.lastName ||
                       getPropertyValue(properties.hs_meeting_organizer_lastname) ||
                       getPropertyValue(properties.hs_organizer_lastname) ||
                       getPropertyValue(event.organizerLastName)
  const hostEmail = associatedOwner.email ||
                    getPropertyValue(properties.hs_meeting_organizer_email) ||
                    getPropertyValue(properties.hs_organizer_email) ||
                    getPropertyValue(event.organizerEmail)
  
  const hostName = hostFirstName 
    ? `${hostFirstName} ${hostLastName || ''}`.trim() 
    : (hostEmail ? hostEmail.split('@')[0] : null)

  return {
    meetingId: event.objectId?.toString() || event.id?.toString() || event.vid?.toString() || 
               getPropertyValue(properties.hs_object_id),
    contactId: event.contactId?.toString() || event['canonical-vid']?.toString() ||
               getPropertyValue(properties.hs_contact_id),
    email: email,
    name: name,
    hostName: hostName,
    title: title,
    startTime: startTime ? parseHubSpotDate(startTime) : null,
    endTime: endTime ? parseHubSpotDate(endTime) : null,
    meetingLink: meetingLink,
  }
}

// Parse HubSpot date which can be timestamp in ms or ISO string
function parseHubSpotDate(value: string): string | null {
  try {
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      // HubSpot timestamps are in milliseconds
      return new Date(numValue).toISOString()
    }
    // Try parsing as ISO string
    return new Date(value).toISOString()
  } catch {
    return null
  }
}

// Try to extract email from nested contacts array
function extractEmailFromContacts(event: any): string | null {
  if (event.associations?.contacts?.length > 0) {
    return getPropertyValue(event.associations.contacts[0].email)
  }
  if (event.contacts?.length > 0) {
    return getPropertyValue(event.contacts[0].email)
  }
  return null
}

// Determine the source of the booking based on meeting properties
function determineBookingSource(meetingData: any): string {
  const title = (meetingData.title || '').toLowerCase()
  
  // Check if it's a tax declaration help meeting
  // Look for keywords related to fiscal/tax assistance
  if (title.includes('fiscal') || title.includes('déclaration') || 
      title.includes('impot') || title.includes('impôt') || 
      title.includes('tax') || title.includes('aide-fiscale') ||
      title.includes('aide fiscale') || title.includes('permanence-fiscale')) {
    return 'tax_declaration_help'
  }
  
  // Check for expert booking by rank indicators (handle both "rang 1" and "rang-1")
  if (title.includes('rang 1') || title.includes('rang-1') || title.includes('premium')) {
    return 'expert_booking_rang_1'
  }
  if (title.includes('rang 2') || title.includes('rang-2') || title.includes('gold')) {
    return 'expert_booking_rang_2'
  }
  if (title.includes('rang 3') || title.includes('rang-3') || title.includes('silver')) {
    return 'expert_booking_rang_3'
  }
  if (title.includes('rang 4') || title.includes('rang-4') || title.includes('bronze')) {
    return 'expert_booking_rang_4'
  }
  
  // Default to general expert booking
  return 'expert_booking'
}
