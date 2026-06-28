import { handleUnfurlRequest } from 'cloudflare-workers-unfurl'
import { AutoRouter, error, IRequest } from 'itty-router'
import { handleAssetDownload, handleAssetUpload } from './assetUploads'
import { corsHeaders, getAllowedOrigin, verifyWhiteboardToken } from './auth'
import type { Env } from './env.d.ts'

export { TldrawDurableObject } from './TldrawDurableObject'

function extractToken(request: IRequest): string | null {
  return (
    (request.query.token as string | undefined) ??
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ??
    null
  )
}

async function validateToken(request: IRequest, env: Env, roomId?: string) {
  const token = extractToken(request)
  if (!token) return { ok: false as const, response: error(401, 'Missing token') }

  const payload = await verifyWhiteboardToken(token, env.TLDRAW_SYNC_SECRET)
  if (!payload) return { ok: false as const, response: error(403, 'Invalid token') }
  if (roomId && payload.streamId !== roomId) {
    return { ok: false as const, response: error(403, 'Room mismatch') }
  }
  return { ok: true as const, payload }
}

async function requireEditorToken(request: IRequest, env: Env) {
  const auth = await validateToken(request, env)
  if (!auth.ok) return auth
  if (auth.payload.mode !== 'editor') {
    return { ok: false as const, response: error(403, 'View-only users cannot upload assets') }
  }
  return auth
}

const router = AutoRouter<IRequest, [env: Env, ctx: ExecutionContext]>({
  catch: (e) => {
    console.error(e)
    return error(e)
  },
})
  .options('*', (request, env) => {
    const origin = getAllowedOrigin(request, env)
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  })
  .get('/api/connect/:roomId', async (request, env) => {
    const auth = await validateToken(request, env, request.params.roomId)
    if (!auth.ok) return auth.response

    const id = env.TLDRAW_DURABLE_OBJECT.idFromName(request.params.roomId)
    const room = env.TLDRAW_DURABLE_OBJECT.get(id)
    return room.fetch(request.url, { headers: request.headers, body: request.body })
  })
  .post('/api/uploads/:uploadId', async (request, env) => {
    const auth = await requireEditorToken(request, env)
    if (!auth.ok) return auth.response
    return handleAssetUpload(request, env)
  })
  .get('/api/uploads/:uploadId', (request, env, ctx) => handleAssetDownload(request, env, ctx))
  .get('/api/unfurl', handleUnfurlRequest)
  .all('*', () => new Response('Not found', { status: 404 }))

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const origin = getAllowedOrigin(request, env)
    return router.fetch(request, env, ctx).then((response) => {
      if (!response) return response
      // Never wrap WebSocket upgrade responses — reconstructing them drops webSocket.
      if (response.status === 101 || response.webSocket) return response
      if (!origin) return response
      const headers = new Headers(response.headers)
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        headers.set(key, value)
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    })
  },
}
