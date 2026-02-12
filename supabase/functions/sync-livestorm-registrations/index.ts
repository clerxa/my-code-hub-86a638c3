import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIVESTORM_JSONAPI_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  'User-Agent': 'Lovable Cloud (FinCare)',
} as const

interface SyncPayload {
  module_id?: number
  event_id?: string
  session_id?: string
}

const truncate = (value: string, max = 800) => (value.length > max ? `${value.slice(0, max)}…` : value)
const isHtml = (body: string) => /<html[\s>]/i.test(body) || /<head[\s>]/i.test(body)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildLivestormAuthCandidates = (token: string) => {
  const t = token.trim()
  if (!t) return []

  // Livestorm API tokens (private apps) are passed as-is.
  // OAuth access tokens are typically `Bearer ...`.
  // We try both formats to avoid ambiguous 500 HTML responses from Livestorm.
  if (/^Bearer\s+/i.test(t)) {
    const raw = t.replace(/^Bearer\s+/i, '').trim()
    return raw ? [raw, t] : [t]
  }

  return [t, `Bearer ${t}`]
}

async function fetchLivestormJson<T>(url: string, token: string, opts?: { retries?: number }): Promise<T> {
  const retries = opts?.retries ?? 3
  const candidates = buildLivestormAuthCandidates(token)
  let lastError: Error | null = null

  for (const authValue of candidates) {
    let attempt = 0

    while (true) {
      attempt++

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authValue,
          ...LIVESTORM_JSONAPI_HEADERS,
        },
      })

      const text = await res.text()

      if (!res.ok) {
        const preview = truncate(text)
        const contentType = res.headers.get('content-type') || 'unknown'
        const retryAfterHeader = res.headers.get('retry-after')
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null

        console.error('Livestorm API error:', { url, status: res.status, contentType, preview })

        const shouldRetry = (res.status === 429 || res.status >= 500) && attempt <= retries
        if (shouldRetry) {
          const backoffMs = retryAfterMs ?? Math.min(8000, 500 * 2 ** (attempt - 1))
          console.warn(`Retrying Livestorm call (attempt ${attempt}/${retries}) in ${backoffMs}ms...`)
          await sleep(backoffMs)
          continue
        }

        lastError = isHtml(text)
          ? new Error(`Livestorm API error: ${res.status} (HTML).`)
          : new Error(`Livestorm API error: ${res.status} - ${preview}`)

        // Try next auth candidate (raw vs bearer)
        break
      }

      try {
        return JSON.parse(text) as T
      } catch {
        lastError = new Error('Réponse Livestorm invalide (JSON attendu)')
        break
      }
    }
  }

  throw lastError ?? new Error('Livestorm API error: unknown')
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
    const payload: SyncPayload = await req.json().catch(() => ({}))

    console.log('Sync request:', payload)

    // Get modules to sync
    let modulesQuery = supabase
      .from('modules')
      .select('id, title, points_registration, points_participation, livestorm_session_id')
      .eq('type', 'webinar')
      .not('livestorm_session_id', 'is', null)

    if (payload.module_id) {
      modulesQuery = modulesQuery.eq('id', payload.module_id)
    }

    const { data: modules, error: modulesError } = await modulesQuery

    if (modulesError) {
      throw new Error(`Erreur lors de la récupération des modules: ${modulesError.message}`)
    }

    if (!modules || modules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun module webinar avec livestorm_session_id trouvé',
          synced: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${modules.length} webinar module(s) to sync`)

    let totalSynced = 0
    let totalSkipped = 0
    let totalExternal = 0
    let totalErrors = 0
    const results: any[] = []

    for (const module of modules) {
      const sessionId = module.livestorm_session_id
      if (!sessionId) continue

      console.log(`Syncing module ${module.id}: ${module.title} (session: ${sessionId})`)

      try {
        // Fetch participants from Livestorm
        // The value stored in DB may be:
        // - a Session ID (preferred)
        // - an Event/Webinar ID
        // So we try multiple endpoints in order.
        let participants: any[] = []
        let fetchError: any = null

        const seen = new Set<string>()
        const pushUnique = (items: any[]) => {
          for (const item of items) {
            const key = item?.id || item?.attributes?.email
            if (!key) continue
            if (seen.has(key)) continue
            seen.add(key)
            participants.push(item)
          }
        }

        // 1) Session → people
        try {
          const sessionData = await fetchLivestormJson<any>(
            `https://api.livestorm.co/v1/sessions/${sessionId}/people`,
            livestormToken
          )
          pushUnique(Array.isArray(sessionData?.data) ? sessionData.data : [])
        } catch (e) {
          fetchError = e
          console.warn(`Could not fetch session people for ${sessionId}, trying event endpoints...`, e)
        }

        // 2) Event → people (all people for the event)
        if (participants.length === 0) {
          try {
            const eventPeople = await fetchLivestormJson<any>(
              `https://api.livestorm.co/v1/events/${sessionId}/people`,
              livestormToken
            )
            pushUnique(Array.isArray(eventPeople?.data) ? eventPeople.data : [])
            fetchError = null
          } catch (e) {
            fetchError = e
            console.warn(`Could not fetch event people for ${sessionId}, trying event sessions...`, e)
          }
        }

        // 3) Event → sessions → people (fallback)
        if (participants.length === 0) {
          try {
            const eventSessions = await fetchLivestormJson<any>(
              `https://api.livestorm.co/v1/events/${sessionId}/sessions`,
              livestormToken
            )
            const sessions = Array.isArray(eventSessions?.data) ? eventSessions.data : []

            for (const session of sessions) {
              const sid = session?.id
              if (!sid) continue
              try {
                const sessionPeople = await fetchLivestormJson<any>(
                  `https://api.livestorm.co/v1/sessions/${sid}/people`,
                  livestormToken
                )
                pushUnique(Array.isArray(sessionPeople?.data) ? sessionPeople.data : [])
              } catch (sessionError) {
                console.warn(`Could not fetch people for session ${sid}:`, sessionError)
              }
            }

            fetchError = null
          } catch (eventError) {
            fetchError = eventError
            console.error(`Could not fetch event sessions for ${sessionId}:`, eventError)
          }
        }

        // If we still have zero participants AND a fetch error, treat it as an error (so it shows up in the response)
        if (participants.length === 0 && fetchError) {
          throw fetchError
        }

        console.log(`Found ${participants.length} participants for module ${module.id}`)

        let moduleSynced = 0
        let moduleSkipped = 0
        let moduleExternal = 0

        for (const participant of participants) {
          const email = participant.attributes?.email?.toLowerCase()
          const registrantId = participant.id
          const status = participant.attributes?.status // registered, attended, etc.
          const firstName = participant.attributes?.first_name || participant.attributes?.fields?.first_name || null
          const lastName = participant.attributes?.last_name || participant.attributes?.fields?.last_name || null
          const companyName = participant.attributes?.company || participant.attributes?.fields?.company || null
          const registeredAt = participant.attributes?.registrant_detail?.created_at || participant.attributes?.created_at || null
          const attendanceDuration = participant.attributes?.attendance_duration || participant.attributes?.registrant_detail?.attendance_duration || 0

          if (!email) {
            moduleSkipped++
            continue
          }

          // Find user in profiles by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, total_points')
            .eq('email', email)
            .maybeSingle()

          const isAttended = status === 'attended' || status === 'completed'

          if (!profile) {
            // User not in profiles - store as external registration
            console.log(`No profile found for email: ${email}, storing as external`)
            
            // Check if external registration already exists
            const { data: existingExternal } = await supabase
              .from('webinar_external_registrations')
              .select('id, registration_status')
              .eq('module_id', module.id)
              .eq('email', email)
              .maybeSingle()

            const externalData = {
              module_id: module.id,
              livestorm_registrant_id: registrantId,
              email,
              first_name: firstName,
              last_name: lastName,
              company_name: companyName,
              registered_at: registeredAt ? new Date(registeredAt * 1000).toISOString() : new Date().toISOString(),
              joined_at: isAttended ? new Date().toISOString() : null,
              completed_at: isAttended ? new Date().toISOString() : null,
              attendance_duration_seconds: attendanceDuration,
              registration_status: isAttended ? 'completed' : 'registered',
              livestorm_session_id: sessionId,
              livestorm_data: participant.attributes || {},
            }

            if (existingExternal) {
              // Update existing external registration
              await supabase
                .from('webinar_external_registrations')
                .update({
                  ...externalData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingExternal.id)
            } else {
              // Insert new external registration
              await supabase
                .from('webinar_external_registrations')
                .insert(externalData)
            }

            moduleExternal++
            continue
          }

          const userId = profile.id
          const pointsRegistration = module.points_registration || 50
          const pointsParticipation = module.points_participation || 100

          // Check if registration already exists
          const { data: existingReg } = await supabase
            .from('webinar_registrations')
            .select('id, registration_status, points_awarded')
            .eq('user_id', userId)
            .eq('module_id', module.id)
            .maybeSingle()

          if (existingReg) {
            // Update if status changed
            if (isAttended && existingReg.registration_status !== 'completed' && existingReg.registration_status !== 'joined') {
              await supabase
                .from('webinar_registrations')
                .update({
                  registration_status: 'completed',
                  joined_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  points_awarded: pointsRegistration + pointsParticipation,
                })
                .eq('id', existingReg.id)

              // Award additional participation points if not already awarded
              if ((existingReg.points_awarded || 0) < pointsRegistration + pointsParticipation) {
                const additionalPoints = (pointsRegistration + pointsParticipation) - (existingReg.points_awarded || 0)
                await supabase
                  .from('profiles')
                  .update({ total_points: (profile.total_points || 0) + additionalPoints })
                  .eq('id', userId)
              }

              moduleSynced++
            } else {
              // Update registration status even if already registered (to catch "inscrit" status)
              if (!existingReg.registration_status || existingReg.registration_status === 'registration_pending') {
                await supabase
                  .from('webinar_registrations')
                  .update({
                    registration_status: 'registration_confirmed',
                  })
                  .eq('id', existingReg.id)
                moduleSynced++
              } else {
                moduleSkipped++
              }
            }
          } else {
            // Create new registration
            const pointsToAward = isAttended ? pointsRegistration + pointsParticipation : pointsRegistration

            await supabase.from('webinar_registrations').insert({
              user_id: userId,
              module_id: module.id,
              livestorm_participant_id: registrantId,
              registered_at: registeredAt ? new Date(registeredAt * 1000).toISOString() : new Date().toISOString(),
              joined_at: isAttended ? new Date().toISOString() : null,
              completed_at: isAttended ? new Date().toISOString() : null,
              registration_status: isAttended ? 'completed' : 'registration_confirmed',
              points_awarded: pointsToAward,
            })

            // Award points
            await supabase
              .from('profiles')
              .update({ total_points: (profile.total_points || 0) + pointsToAward })
              .eq('id', userId)

            // If attended, also validate the module
            if (isAttended) {
              const { data: existingValidation } = await supabase
                .from('module_validations')
                .select('id')
                .eq('user_id', userId)
                .eq('module_id', module.id)
                .maybeSingle()

              if (!existingValidation) {
                await supabase.from('module_validations').insert({
                  user_id: userId,
                  module_id: module.id,
                  success: true,
                })
              }
            }

            moduleSynced++
          }
        }

        results.push({
          module_id: module.id,
          title: module.title,
          participants_found: participants.length,
          synced: moduleSynced,
          skipped: moduleSkipped,
          external: moduleExternal,
        })

        totalSynced += moduleSynced
        totalSkipped += moduleSkipped
        totalExternal += moduleExternal
      } catch (moduleError: any) {
        console.error(`Error syncing module ${module.id}:`, moduleError)
        totalErrors++
        results.push({
          module_id: module.id,
          title: module.title,
          error: moduleError.message,
        })
      }
    }

    console.log(`Sync complete: ${totalSynced} synced, ${totalSkipped} skipped, ${totalExternal} external, ${totalErrors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronisation terminée: ${totalSynced} inscription(s) importée(s), ${totalExternal} contact(s) externe(s)`,
        synced: totalSynced,
        skipped: totalSkipped,
        external: totalExternal,
        errors: totalErrors,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in sync-livestorm-registrations:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
