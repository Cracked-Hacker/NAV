// Website transport only. Canonical signup, password checks, duplicate handling,
// verification, and signup authorization remain owned by secure-signup.
const WEBSITE_ORIGIN = 'https://cracked-hacker.github.io';
const CANONICAL_AUTH_URL = 'https://ljvusfrnrlcurzwxnlya.supabase.co';
const MAX_BODY_BYTES = 8192;

function response(body: Record<string, unknown> | null, status: number, origin: string | null) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin',
      ...(origin === WEBSITE_ORIGIN ? {
        'Access-Control-Allow-Origin': WEBSITE_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
        'Access-Control-Max-Age': '600'
      } : {})
    }
  });
}

function publicKey() {
  const configured = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (configured) {
    try {
      const keys = JSON.parse(configured) as Record<string, unknown>;
      const key = keys.default ?? Object.values(keys).find(value => typeof value === 'string');
      if (typeof key === 'string' && key) return key;
    } catch { /* Use the established legacy anon key, never a service-role key. */ }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
}

export async function handleAccountEntry(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin !== WEBSITE_ORIGIN) return response({accepted:false}, 403, null);
  if (request.method === 'OPTIONS') return response(null, 204, origin);
  if (request.method !== 'POST') return response({accepted:false}, 405, origin);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return response({accepted:false,reason:'invalid_request'}, 415, origin);

  // Bound even chunked requests before parsing or forwarding passwords.
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({accepted:false,reason:'invalid_request'}, 400, origin);
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); return response({accepted:false,reason:'invalid_request'}, 413, origin); }
      chunks.push(value);
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk,offset); offset += chunk.byteLength; }
    body = JSON.parse(new TextDecoder().decode(buffer));
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('invalid');
  } catch { return response({accepted:false,reason:'invalid_request'}, 400, origin); }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const fullName = `${firstName} ${lastName}`.replace(/\s+/g,' ').trim();
  if (!firstName || !lastName || firstName.length > 60 || lastName.length > 60 || fullName.length > 120) return response({accepted:false,reason:'invalid_request'}, 400, origin);
  const key = publicKey();
  if (!key || Deno.env.get('SUPABASE_URL') !== CANONICAL_AUTH_URL) return response({accepted:false,reason:'temporarily_unavailable'}, 503, origin);

  try {
    const result = await fetch(`${CANONICAL_AUTH_URL}/functions/v1/secure-signup`, {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':key},
      signal:AbortSignal.timeout(18000),
      body:JSON.stringify({
        email:body.email,password:body.password,fullName,
        // Existing minimum-capability signup path; not a permanent persona and
        // never an entitlement, coach approval, relationship, or elevated role.
        accountIntent:'client',
        acceptedTerms:body.acceptedTerms === true,
        acceptedPrivacy:body.acceptedPrivacy === true,
        acceptedDisclaimer:body.acceptedDisclaimer === true,
        acceptedHealthData:body.acceptedHealthData === true
      })
    });
    if (!result.ok) return response({accepted:false,reason:'temporarily_unavailable'}, 503, origin);
    const outcome = await result.json();
    if (outcome.accepted === true) {
      // Never expose an upstream session or user-existence details. The person
      // explicitly logs in after the canonical email verification flow.
      return response({accepted:true,confirmationRequired:true}, 200, origin);
    }
    const reasons = ['weak_password','password_breached','password_check_unavailable','agreements_missing','invalid_request'];
    return response({accepted:false,reason:reasons.includes(outcome.reason) ? outcome.reason : 'temporarily_unavailable'}, 200, origin);
  } catch { return response({accepted:false,reason:'temporarily_unavailable'}, 503, origin); }
}

Deno.serve(handleAccountEntry);
