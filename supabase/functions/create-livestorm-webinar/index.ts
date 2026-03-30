import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIVESTORM_API = 'https://api.livestorm.co/v1'

const LIVESTORM_JSONAPI_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
} as const

const truncate = (value: string, max = 800) => (value.length > max ? `${value.slice(0, max)}…` : value)
const isHtml = (body: string) => /<html[\s>]/i.test(body) || /<head[\s>]/i.test(body)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const normalizeLivestormUserId = (value: string) => {
  const trimmed = value.trim()
  if (UUID_RE.test(trimmed)) return `usr_${trimmed}`
  return trimmed
}

const buildLivestormAuthCandidates = (token: string) => {
  const t = token.trim()
  if (!t) return []
  if (/^Bearer\s+/i.test(t)) {
    const raw = t.replace(/^Bearer\s+/i, '').trim()
    return raw ? [raw, t] : [t]
  }
  return [t, `Bearer ${t}`]
}

async function fetchLivestorm(url: string, init: RequestInit, token: string) {
  const candidates = buildLivestormAuthCandidates(token)
  if (candidates.length === 0) throw new Error('LIVESTORM_API_KEY not configured')

  let lastRes: Response | null = null
  let lastText = ''

  for (const authValue of candidates) {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: authValue },
    })
    const text = await res.text()
    if (res.ok) return { res, text }
    lastRes = res
    lastText = text
  }
  return { res: lastRes!, text: lastText }
}

async function resolveOwnerId(token: string, supabase: any): Promise<string> {
  // Try settings table first
  const { data: ownerSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'livestorm_owner_id')
    .maybeSingle()

  if (ownerSetting?.value) {
    return normalizeLivestormUserId(ownerSetting.value as string)
  }

  // Resolve from email in settings
  const { data: emailSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'livestorm_owner_email')
    .maybeSingle()

  if (emailSetting?.value) {
    const email = (emailSetting.value as string).trim().toLowerCase()
    const { res, text } = await fetchLivestorm(
      `${LIVESTORM_API}/users`,
      { method: 'GET', headers: { ...LIVESTORM_JSONAPI_HEADERS } },
      token
    )
    if (res.ok) {
      const json = JSON.parse(text)
      const match = (json?.data || []).find(
        (u: any) => (u?.attributes?.email || '').toLowerCase() === email
      )
      if (match?.id) {
        const normalized = normalizeLivestormUserId(match.id)
        await supabase.from('settings').upsert(
          { key: 'livestorm_owner_id', value: normalized, metadata: { email, resolved_at: new Date().toISOString() } },
          { onConflict: 'key' }
        )
        return normalized
      }
    }
  }

  // Fallback: get first team member via /people
  const { res, text } = await fetchLivestorm(
    `${LIVESTORM_API}/people?filter[role]=team_member&page[size]=1`,
    { method: 'GET', headers: { ...LIVESTORM_JSONAPI_HEADERS } },
    token
  )
  if (res.ok) {
    const json = JSON.parse(text)
    if (json.data?.length > 0) return json.data[0].id
  }

  throw new Error("Owner Livestorm non trouvé. Configurez livestorm_owner_id ou livestorm_owner_email dans les settings.")
}

// ==========================================
// MODE 1: Create event from existing module
// Payload: { module_id, sessions: [{ id?, session_date }] }
// ==========================================
// MODE 2: Legacy full creation (backward compat)
// ==========================================

interface SessionInput {
  id?: string          // local webinar_sessions.id if exists
  session_date: string // ISO datetime
}

interface CreateFromModulePayload {
  module_id: number
  sessions: SessionInput[]
  owner_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const livestormToken = (Deno.env.get('LIVESTORM_API_KEY') ?? Deno.env.get('LIVESTORM_API_TOKEN') ?? '').trim()

    if (!livestormToken) {
      throw new Error('LIVESTORM_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload = await req.json()

    // Determine mode based on payload
    const moduleId = payload.module_id
    if (!moduleId) throw new Error('module_id is required')

    const sessions: SessionInput[] = payload.sessions || []

    // Fetch the module
    const { data: module, error: moduleErr } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (moduleErr || !module) {
      throw new Error(`Module ${moduleId} not found`)
    }

    // Check if already linked to Livestorm
    if (module.livestorm_event_id) {
      throw new Error(`Ce module est déjà lié à un événement Livestorm (${module.livestorm_event_id}). Supprimez d'abord le lien existant.`)
    }

    console.log(`Creating Livestorm event for module "${module.title}" (ID: ${moduleId})`)

    // Resolve owner
    const ownerId = payload.owner_id
      ? normalizeLivestormUserId(payload.owner_id)
      : await resolveOwnerId(livestormToken, supabase)

    console.log('Using Livestorm owner_id:', ownerId)

    // Build slug
    const slug = module.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)

    const estimatedDuration = module.estimated_time || 60

    // Create event in Livestorm
    const eventPayload = {
      data: {
        type: 'events',
        attributes: {
          title: module.title,
          slug: `${slug}-${Date.now()}`,
          owner_id: ownerId,
          status: 'published',
          estimated_duration: estimatedDuration,
          description: module.description || '',
          light_registration_page_enabled: true,
          chat_enabled: true,
          questions_enabled: true,
          fields: [
            { id: 'first_name', required: true },
            { id: 'last_name', required: true },
            { id: 'email', required: true },
          ],
        },
      },
    }

    console.log('Livestorm event payload:', JSON.stringify(eventPayload))

    const { res: eventRes, text: eventText } = await fetchLivestorm(
      `${LIVESTORM_API}/events`,
      { method: 'POST', headers: { ...LIVESTORM_JSONAPI_HEADERS }, body: JSON.stringify(eventPayload) },
      livestormToken
    )

    if (!eventRes.ok) {
      const preview = truncate(eventText)
      console.error('Livestorm event creation failed:', { status: eventRes.status, preview })
      if (isHtml(eventText)) {
        throw new Error(`Livestorm API error: ${eventRes.status} (HTML). Vérifiez le token ou réessayez.`)
      }
      throw new Error(`Livestorm API error: ${eventRes.status} - ${preview}`)
    }

    const eventData = JSON.parse(eventText)
    const livestormEventId = eventData.data.id
    const registrationLink = eventData.data.attributes?.registration_link || null

    console.log(`Event created: ${livestormEventId}, registration: ${registrationLink}`)

    // Create sessions
    const createdSessions: Array<{
      livestorm_session_id: string
      session_date: string
      registration_url: string
      local_session_id?: string
    }> = []

    // If no sessions provided, use the module's webinar_date
    const sessionsToCreate = sessions.length > 0
      ? sessions
      : module.webinar_date
        ? [{ session_date: module.webinar_date }]
        : []

    for (const session of sessionsToCreate) {
      const d = new Date(session.session_date)
      if (isNaN(d.getTime())) {
        console.warn('Invalid session date, skipping:', session.session_date)
        continue
      }

      const sessionPayload = {
        data: {
          type: 'sessions',
          attributes: {
            timezone: 'Europe/Paris',
            estimated_duration_in_minutes: estimatedDuration,
            date: {
              year: d.getUTCFullYear(),
              month: d.getUTCMonth() + 1,
              day: d.getUTCDate(),
              hour: d.getUTCHours(),
              minute: d.getUTCMinutes(),
            },
          },
        },
      }

      console.log(`Creating session for ${session.session_date}`)

      const { res: sessionRes, text: sessionText } = await fetchLivestorm(
        `${LIVESTORM_API}/events/${livestormEventId}/sessions`,
        { method: 'POST', headers: { ...LIVESTORM_JSONAPI_HEADERS }, body: JSON.stringify(sessionPayload) },
        livestormToken
      )

      if (!sessionRes.ok) {
        console.error(`Session creation failed:`, { status: sessionRes.status, preview: truncate(sessionText) })
        continue
      }

      const sessionData = JSON.parse(sessionText)
      const lsSessionId = sessionData.data.id
      const sessionRegUrl =
        sessionData.data.attributes?.room_link ||
        sessionData.data.attributes?.registration_link ||
        registrationLink

      createdSessions.push({
        livestorm_session_id: lsSessionId,
        session_date: session.session_date,
        registration_url: sessionRegUrl || registrationLink || '',
        local_session_id: session.id,
      })
    }

    // Update module with Livestorm info
    const embedCode = `<iframe src="${registrationLink}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`

    const { error: updateErr } = await supabase
      .from('modules')
      .update({
        livestorm_event_id: livestormEventId,
        webinar_registration_url: registrationLink,
        embed_code: embedCode,
      })
      .eq('id', moduleId)

    if (updateErr) {
      console.error('Module update error:', updateErr)
    }

    // Update/create local webinar_sessions with Livestorm IDs
    for (const cs of createdSessions) {
      if (cs.local_session_id) {
        await supabase
          .from('webinar_sessions')
          .update({
            livestorm_session_id: cs.livestorm_session_id,
            registration_url: cs.registration_url,
          })
          .eq('id', cs.local_session_id)
      } else {
        await supabase.from('webinar_sessions').insert({
          module_id: moduleId,
          session_date: cs.session_date,
          livestorm_session_id: cs.livestorm_session_id,
          registration_url: cs.registration_url,
        })
      }
    }

    console.log(`Done: ${createdSessions.length}/${sessionsToCreate.length} sessions created`)

    return new Response(
      JSON.stringify({
        success: true,
        livestorm_event_id: livestormEventId,
        registration_link: registrationLink,
        sessions_created: createdSessions.length,
        sessions_total: sessionsToCreate.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in create-livestorm-webinar:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
