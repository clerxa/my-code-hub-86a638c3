import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateWebinarPayload {
  title: string
  description: string
  webinar_date: string
  duration: number
  theme: string[]
  points_registration: number
  points_participation: number
  parcours_id: string
  company_ids: string[]
  webinar_image_url?: string
  pedagogical_objectives?: string[]
  difficulty_level?: number
  estimated_time?: number
  // Optional: allow resolving the Livestorm owner via email if owner_id isn't configured yet
  owner_email?: string
}

const LIVESTORM_JSONAPI_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  'User-Agent': 'Lovable Cloud (FinCare)',
} as const

const truncate = (value: string, max = 800) => (value.length > max ? `${value.slice(0, max)}…` : value)
const isHtml = (body: string) => /<html[\s>]/i.test(body) || /<head[\s>]/i.test(body)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const normalizeLivestormUserId = (value: string) => {
  const trimmed = value.trim()
  // Livestorm user ids are commonly formatted as `usr_<uuid>`.
  // When admins paste only the UUID, Livestorm may respond with a generic HTML 500.
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

async function fetchLivestormText(url: string, init: RequestInit, token: string) {
  const candidates = buildLivestormAuthCandidates(token)
  if (candidates.length === 0) {
    throw new Error('LIVESTORM_API_TOKEN not configured')
  }

  let lastRes: Response | null = null
  let lastText = ''

  for (const authValue of candidates) {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: authValue,
      },
    })

    const text = await res.text()

    if (res.ok) {
      return { res, text }
    }

    lastRes = res
    lastText = text
  }

  return { res: lastRes!, text: lastText }
}

async function fetchLivestormOwnerIdByEmail(email: string, token: string): Promise<string> {
  const emailNormalized = email.trim().toLowerCase()

  const tryRequest = async (url: string) => {
    return await fetchLivestormText(
      url,
      {
        method: 'GET',
        headers: {
          ...LIVESTORM_JSONAPI_HEADERS,
        },
      },
      token
    )
  }

  // 1) Try server-side filtering
  try {
    const url = `https://api.livestorm.co/v1/users?filter[email]=${encodeURIComponent(email)}`
    const { res, text } = await tryRequest(url)

    if (res.ok) {
      const json = JSON.parse(text)
      const list: any[] = Array.isArray(json?.data) ? json.data : []
      const first = list[0]
      const ownerId = first?.id
      if (ownerId) return ownerId
      throw new Error("Aucun utilisateur Livestorm trouvé avec cet email")
    }

    // If Livestorm returns HTML 500 here, we'll fallback to unfiltered /users
    console.warn('Livestorm filtered /users failed, will fallback.', {
      status: res.status,
      contentType: res.headers.get('content-type') || 'unknown',
      preview: truncate(text),
    })
  } catch (e) {
    console.warn('Livestorm filtered /users lookup threw, will fallback.', e)
  }

  // 2) Fallback: fetch /users and match locally
  const url2 = `https://api.livestorm.co/v1/users`
  const { res: res2, text: text2 } = await tryRequest(url2)

  if (!res2.ok) {
    const contentType = res2.headers.get('content-type') || 'unknown'
    const preview = truncate(text2)
    console.error('Livestorm /users error:', { status: res2.status, contentType, preview })

    if (isHtml(text2)) {
      throw new Error(
        `Livestorm API error: ${res2.status} (HTML). Vérifiez le token (scopes admin:read) ou réessayez plus tard.`
      )
    }
    throw new Error(`Livestorm API error: ${res2.status} - ${preview}`)
  }

  let json2: any
  try {
    json2 = JSON.parse(text2)
  } catch {
    throw new Error('Réponse Livestorm invalide (JSON attendu)')
  }

  const list2: any[] = Array.isArray(json2?.data) ? json2.data : []
  const match = list2.find((u) => (u?.attributes?.email || '').toLowerCase() === emailNormalized)
  const ownerId2 = match?.id

  if (!ownerId2) {
    throw new Error("Aucun utilisateur Livestorm trouvé avec cet email")
  }

  return ownerId2
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const livestormToken = (Deno.env.get('LIVESTORM_API_TOKEN') ?? '').trim()

    if (!livestormToken) {
      throw new Error('LIVESTORM_API_TOKEN not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload: CreateWebinarPayload = await req.json()

    console.log('Creating Livestorm webinar:', payload.title)

    // Fetch owner_id from settings table (or resolve it from email)
    const { data: ownerIdSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'livestorm_owner_id')
      .maybeSingle()

    let ownerId: string | null = (ownerIdSetting?.value as string | null) ?? null

    if (!ownerId) {
      const ownerEmailFromPayload = (payload?.owner_email || '').trim() || null

      const { data: ownerEmailSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'livestorm_owner_email')
        .maybeSingle()

      const ownerEmail: string | null =
        ownerEmailFromPayload || ((ownerEmailSetting?.value as string | null) ?? null)

      if (ownerEmail) {
        console.log('Resolving Livestorm owner_id from email:', ownerEmail)
        ownerId = await fetchLivestormOwnerIdByEmail(ownerEmail, livestormToken)

        // Cache it for next time
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'livestorm_owner_id',
              value: ownerId,
              metadata: { email: ownerEmail, resolved_from: 'email', saved_at: new Date().toISOString() },
            },
            { onConflict: 'key' }
          )
      }
    }

    if (!ownerId) {
      throw new Error(
        "Owner Livestorm non configuré. Renseignez l'Owner ID (ou l'email) dans le back-office, puis réessayez."
      )
    }

    const rawOwnerId = ownerId
    ownerId = normalizeLivestormUserId(ownerId)

    if (ownerId !== rawOwnerId) {
      console.log('Normalized Livestorm owner_id:', { from: rawOwnerId, to: ownerId })
      // Persist the normalized value so future runs are consistent.
      await supabase
        .from('settings')
        .upsert(
          {
            key: 'livestorm_owner_id',
            value: ownerId,
            metadata: { normalized: true, from: rawOwnerId, saved_at: new Date().toISOString() },
          },
          { onConflict: 'key' }
        )
    }

    console.log('Using Livestorm owner_id:', ownerId)

    // 1. Create event in Livestorm
    const livestormResponse = await fetch('https://api.livestorm.co/v1/events', {
      method: 'POST',
      headers: {
        Authorization: livestormToken,
        ...LIVESTORM_JSONAPI_HEADERS,
      },
      body: JSON.stringify({
        data: {
          type: 'events',
          attributes: {
            title: payload.title,
            slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            owner_id: ownerId,
            fields: [
              {
                id: 'first_name',
                required: true,
              },
              {
                id: 'last_name',
                required: true,
              },
              {
                id: 'email',
                required: true,
              },
            ],
          },
        },
      }),
    })

    if (!livestormResponse.ok) {
      const text = await livestormResponse.text()
      const contentType = livestormResponse.headers.get('content-type') || 'unknown'
      const preview = truncate(text)

      console.error('Livestorm API error:', {
        status: livestormResponse.status,
        contentType,
        preview,
      })

      if (isHtml(text)) {
        throw new Error(
          `Livestorm API error: ${livestormResponse.status} (HTML). Vérifiez le token (scopes) ou réessayez plus tard.`
        )
      }

      throw new Error(`Livestorm API error: ${livestormResponse.status} - ${preview}`)
    }

    const livestormData = await livestormResponse.json()
    console.log('Livestorm event created:', livestormData)

    const eventId = livestormData.data.id
    const eventSlug = livestormData.data.attributes?.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Create session for the event
    const sessionResponse = await fetch('https://api.livestorm.co/v1/sessions', {
      method: 'POST',
      headers: {
        Authorization: livestormToken,
        ...LIVESTORM_JSONAPI_HEADERS,
      },
      body: JSON.stringify({
        data: {
          type: 'sessions',
          attributes: {
            estimated_started_at: payload.webinar_date,
          },
          relationships: {
            event: {
              data: {
                type: 'events',
                id: eventId,
              },
            },
          },
        },
      }),
    })

    if (!sessionResponse.ok) {
      const text = await sessionResponse.text()
      const preview = truncate(text)
      console.error('Livestorm session API error:', sessionResponse.status, preview)
      // Continue even if session creation fails
    }

    const sessionData = sessionResponse.ok ? await sessionResponse.json() : null
    const sessionId = sessionData?.data?.id

    const registrationUrl = sessionId 
      ? `https://app.livestorm.co/${eventSlug}/${sessionId}`
      : `https://app.livestorm.co/${eventSlug}`

    // Create embed code
    const embedCode = `<iframe src="${registrationUrl}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`

    // 2. Get next order_num for modules
    const { data: lastModule } = await supabase
      .from('modules')
      .select('order_num')
      .order('order_num', { ascending: false })
      .limit(1)
      .single()

    const nextOrderNum = (lastModule?.order_num || 0) + 1

    // 3. Create module in FinCare database
    const { data: newModule, error: moduleError } = await supabase
      .from('modules')
      .insert({
        type: 'webinar',
        title: payload.title,
        description: payload.description,
        webinar_date: payload.webinar_date,
        duration: `${payload.duration} min`,
        estimated_time: payload.estimated_time || payload.duration,
        webinar_registration_url: registrationUrl,
        webinar_image_url: payload.webinar_image_url,
        embed_code: embedCode,
        theme: payload.theme,
        pedagogical_objectives: payload.pedagogical_objectives || [],
        difficulty_level: payload.difficulty_level || 1,
        points_registration: payload.points_registration,
        points_participation: payload.points_participation,
        points: payload.points_registration + payload.points_participation,
        order_num: nextOrderNum,
      })
      .select()
      .single()

    if (moduleError) {
      console.error('Error creating module:', moduleError)
      throw new Error(`Failed to create module: ${moduleError.message}`)
    }

    console.log('Module created:', newModule.id)

    // 4. Add module to parcours
    const { data: existingModules } = await supabase
      .from('parcours_modules')
      .select('order_num')
      .eq('parcours_id', payload.parcours_id)
      .order('order_num', { ascending: false })
      .limit(1)
      .single()

    const nextParcoursOrder = (existingModules?.order_num || 0) + 1

    const { error: parcoursModuleError } = await supabase
      .from('parcours_modules')
      .insert({
        parcours_id: payload.parcours_id,
        module_id: newModule.id,
        order_num: nextParcoursOrder,
      })

    if (parcoursModuleError) {
      console.error('Error adding module to parcours:', parcoursModuleError)
      throw new Error(`Failed to add module to parcours: ${parcoursModuleError.message}`)
    }

    // 5. Ensure parcours is assigned to companies
    for (const companyId of payload.company_ids) {
      // Check if assignment exists
      const { data: existingAssignment } = await supabase
        .from('parcours_companies')
        .select('id')
        .eq('parcours_id', payload.parcours_id)
        .eq('company_id', companyId)
        .single()

      if (!existingAssignment) {
        await supabase
          .from('parcours_companies')
          .insert({
            parcours_id: payload.parcours_id,
            company_id: companyId,
          })
      }
    }

    console.log('Webinar creation complete')

    return new Response(
      JSON.stringify({
        success: true,
        module: newModule,
        livestorm_event_id: eventId,
        registration_url: registrationUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-livestorm-webinar:', error)

    // Return 200 so the admin UI can handle/display the error without crashing
    // (supabase.functions.invoke throws on non-2xx).
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
