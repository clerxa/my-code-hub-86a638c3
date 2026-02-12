import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Payload {
  company_id: string
}

type WebinarRow = {
  id: number
  title: string
  webinar_date: string | null
  duration: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData.user) {
      throw new Error('Unauthorized')
    }

    const payload: Payload = await req.json()
    const companyId = payload.company_id
    if (!companyId) {
      throw new Error('Missing company_id')
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(companyId)) {
      return new Response(JSON.stringify({ success: true, webinars: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'contact_entreprise'])
      .maybeSingle()

    if (!roleData?.role) {
      throw new Error('Unauthorized')
    }

    if (roleData.role === 'contact_entreprise') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profile?.company_id || profile.company_id !== companyId) {
        throw new Error('Unauthorized')
      }
    }

    // 1) Find webinar modules linked to the company
    let moduleIds: number[] = []

    const { data: parcoursCompanies, error: pcError } = await supabase
      .from('parcours_companies')
      .select('parcours_id')
      .eq('company_id', companyId)

    if (pcError) {
      console.error('parcours_companies error', pcError)
      throw new Error('Failed to load company parcours')
    }

    const parcoursIds = (parcoursCompanies || []).map((pc) => pc.parcours_id)

    if (parcoursIds.length > 0) {
      const { data: parcoursModules, error: pmError } = await supabase
        .from('parcours_modules')
        .select('module_id')
        .in('parcours_id', parcoursIds)

      if (pmError) {
        console.error('parcours_modules error', pmError)
        throw new Error('Failed to load parcours modules')
      }

      moduleIds.push(...(parcoursModules || []).map((pm) => pm.module_id))
    }

    const { data: directWebinars, error: dwError } = await supabase
      .from('company_webinars')
      .select('module_id')
      .eq('company_id', companyId)

    if (dwError) {
      console.error('company_webinars error', dwError)
      throw new Error('Failed to load company webinars')
    }

    moduleIds.push(...(directWebinars || []).map((dw) => dw.module_id))
    moduleIds = [...new Set(moduleIds)].filter((id) => typeof id === 'number')

    if (moduleIds.length === 0) {
      return new Response(JSON.stringify({ success: true, webinars: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: webinars, error: webinarsError } = await supabase
      .from('modules')
      .select('id, title, webinar_date, duration')
      .eq('type', 'webinar')
      .in('id', moduleIds)
      .order('webinar_date', { ascending: false })

    if (webinarsError) {
      console.error('modules error', webinarsError)
      throw new Error('Failed to load webinars')
    }

    const safeWebinars: WebinarRow[] = (webinars || []) as unknown as WebinarRow[]

    // 2) Compute totals (service role bypasses RLS)
    const enriched = [] as Array<{
      id: number
      title: string
      webinar_date: string | null
      duration: string | null
      total_registrations: number
      internal_registrations: number
      external_registrations: number
      total_participants: number
    }>

    for (const w of safeWebinars) {
      const [{ count: internalCount }, { count: internalParticipantsCount }, { count: externalCount }, { count: externalParticipantsCount }] =
        await Promise.all([
          supabase.from('webinar_registrations').select('id', { count: 'exact', head: true }).eq('module_id', w.id),
          supabase
            .from('webinar_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('module_id', w.id)
            .in('registration_status', ['joined', 'completed']),
          supabase.from('webinar_external_registrations').select('id', { count: 'exact', head: true }).eq('module_id', w.id),
          supabase
            .from('webinar_external_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('module_id', w.id)
            .eq('registration_status', 'completed'),
        ])

      const internal = internalCount || 0
      const external = externalCount || 0
      const participants = (internalParticipantsCount || 0) + (externalParticipantsCount || 0)

      enriched.push({
        id: w.id,
        title: w.title,
        webinar_date: w.webinar_date,
        duration: w.duration,
        total_registrations: internal + external,
        internal_registrations: internal,
        external_registrations: external,
        total_participants: participants,
      })
    }

    return new Response(JSON.stringify({ success: true, webinars: enriched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('get-company-webinars error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
