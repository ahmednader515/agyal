export interface WhiteboardTokenPayload {
  streamId: string
  userId: string
  mode: 'editor' | 'viewer'
  exp: number
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

export async function verifyWhiteboardToken(
  token: string,
  secret: string,
): Promise<WhiteboardTokenPayload | null> {
  if (!token || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = base64UrlDecode(signatureB64)

  const key = await importHmacKey(secret)
  const valid = await crypto.subtle.verify('HMAC', key, signature, data)
  if (!valid) return null

  let payload: WhiteboardTokenPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as WhiteboardTokenPayload
  } catch {
    return null
  }

  if (!payload.streamId || !payload.userId || !payload.mode) return null
  if (payload.mode !== 'editor' && payload.mode !== 'viewer') return null
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null

  return payload
}

export function getAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin')
  if (!origin) return '*'
  const allowed = (env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return allowed.includes(origin) ? origin : null
}

export function corsHeaders(origin: string | null): HeadersInit {
  if (!origin) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
