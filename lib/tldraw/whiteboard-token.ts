import { SignJWT, jwtVerify } from "jose";

export type WhiteboardTokenMode = "editor" | "viewer";

export interface WhiteboardTokenPayload {
  streamId: string;
  userId: string;
  mode: WhiteboardTokenMode;
}

function getSecret(): Uint8Array | null {
  const raw = process.env.TLDRAW_SYNC_SECRET?.trim();
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

export async function signWhiteboardToken(payload: WhiteboardTokenPayload): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyWhiteboardToken(token: string): Promise<WhiteboardTokenPayload | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const streamId = String(payload.streamId ?? "");
    const userId = String(payload.userId ?? "");
    const mode = payload.mode as WhiteboardTokenMode;
    if (!streamId || !userId || (mode !== "editor" && mode !== "viewer")) return null;
    return { streamId, userId, mode };
  } catch {
    return null;
  }
}

export function getTldrawSyncUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_TLDRAW_SYNC_URL?.trim()?.replace(/\/$/, "");
  return url || null;
}
