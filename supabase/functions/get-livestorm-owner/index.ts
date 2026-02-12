import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIVESTORM_JSONAPI_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  'User-Agent': 'Lovable Cloud (FinCare)',
} as const;

const truncate = (value: string, max = 800) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

const isHtml = (body: string) => /<html[\s>]/i.test(body) || /<head[\s>]/i.test(body);

const buildLivestormAuthCandidates = (token: string) => {
  const t = token.trim();
  if (!t) return [];

  if (/^Bearer\s+/i.test(t)) {
    const raw = t.replace(/^Bearer\s+/i, '').trim();
    return raw ? [raw, t] : [t];
  }

  return [t, `Bearer ${t}`];
};

async function fetchLivestormJson<T>(url: string, token: string): Promise<T> {
  const candidates = buildLivestormAuthCandidates(token);

  if (candidates.length === 0) {
    throw new Error('LIVESTORM_API_TOKEN not configured');
  }

  let lastError: Error | null = null;

  for (const authValue of candidates) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authValue,
        ...LIVESTORM_JSONAPI_HEADERS,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      // Livestorm sometimes responds with an HTML error page; avoid returning huge HTML in the error payload.
      const preview = truncate(text);
      const contentType = res.headers.get('content-type') || 'unknown';

      console.error('Livestorm API error:', {
        url,
        status: res.status,
        contentType,
        preview,
      });

      lastError = isHtml(text)
        ? new Error(
            `Livestorm API error: ${res.status} (HTML). Vérifiez le token (scopes) ou réessayez plus tard.`
          )
        : new Error(`Livestorm API error: ${res.status} - ${preview}`);

      continue;
    }

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.error('Failed to parse Livestorm JSON:', { url, preview: truncate(text) });
      lastError = new Error('Réponse Livestorm invalide (JSON attendu)');
      continue;
    }
  }

  throw lastError ?? new Error('Livestorm API error');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const livestormToken = (Deno.env.get('LIVESTORM_API_TOKEN') ?? '').trim();

    if (!livestormToken) {
      throw new Error('LIVESTORM_API_TOKEN not configured');
    }

    // Optional: resolve by email (POST body { email } or query ?email=...)
    let requestedEmail: string | null = null;

    try {
      const url = new URL(req.url);
      requestedEmail = url.searchParams.get('email');
    } catch {
      // ignore
    }

    if (!requestedEmail && req.method !== 'GET') {
      try {
        const body = await req.json();
        if (body && typeof body.email === 'string') {
          requestedEmail = body.email;
        }
      } catch {
        // no body
      }
    }

    console.log(
      'Fetching current Livestorm user (token owner)...',
      requestedEmail ? { requestedEmail } : ''
    );

    // 1) Primary: resolve via email (if provided)
    let owner: any | null = null;

    if (requestedEmail?.trim()) {
      const email = requestedEmail.trim();
      console.log('Resolving Livestorm user by email:', email);

      // Some Livestorm accounts/tokens seem to trigger a 500 when using filter[email].
      // We try the filtered endpoint first, then fallback to a full /users list + local match.
      try {
        const usersByEmail = await fetchLivestormJson<any>(
          `https://api.livestorm.co/v1/users?filter[email]=${encodeURIComponent(email)}`,
          livestormToken
        );

        const list: any[] = Array.isArray(usersByEmail?.data) ? usersByEmail.data : [];
        owner = list[0] || null;
      } catch (e) {
        console.warn('Email lookup via filter[email] failed, trying /v1/users list fallback:', e);
        try {
          const users = await fetchLivestormJson<any>('https://api.livestorm.co/v1/users', livestormToken);
          const list: any[] = Array.isArray(users?.data) ? users.data : [];
          owner =
            list.find((u) => (u?.attributes?.email || '').toLowerCase() === email.toLowerCase()) || null;
        } catch (fallbackErr) {
          console.warn('Email lookup via /v1/users list also failed; will fallback to token owner discovery.', fallbackErr);
          owner = null;
        }
      }
    }

    // 2) Fallback to token owner discovery
    if (!owner) {
      try {
        const me = await fetchLivestormJson<any>('https://api.livestorm.co/v1/me', livestormToken);
        owner = me?.data ?? null;
      } catch (e) {
        console.warn('Failed to fetch /v1/me, trying /v1/users fallback:', e);

        try {
          const users = await fetchLivestormJson<any>('https://api.livestorm.co/v1/users', livestormToken);
          const list: any[] = Array.isArray(users?.data) ? users.data : [];

          owner =
            list.find((u) => u?.attributes?.role === 'owner') ||
            list.find((u) => u?.attributes?.role === 'admin') ||
            list[0] ||
            null;
        } catch (fallbackErr) {
          console.error('Failed to fetch /v1/users fallback:', fallbackErr);
          throw fallbackErr;
        }
      }
    }

    if (!owner?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Aucun owner n'a pu être récupéré via l'API. Utilisez la saisie manuelle de l'Owner ID.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ownerId = owner.id;
    const ownerEmail = owner.attributes?.email ?? null;

    console.log('Owner candidate:', ownerId, ownerEmail);

    // Store owner id in settings table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'livestorm_owner_id',
          value: ownerId,
          metadata: { email: ownerEmail },
        },
        {
          onConflict: 'key',
        }
      );

    if (upsertError) {
      console.error('Error storing owner in settings:', upsertError);
      // Continue: owner retrieval still succeeded.
    } else {
      console.log('Owner stored in settings table');
    }

    return new Response(
      JSON.stringify({
        success: true,
        owners: [owner].map((o: any) => ({
          id: o.id,
          email: o.attributes?.email,
          role: o.attributes?.role,
          first_name: o.attributes?.first_name,
          last_name: o.attributes?.last_name,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error in get-livestorm-owner:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Return 200 to keep the admin UI resilient; it will display manual input on failure.
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

