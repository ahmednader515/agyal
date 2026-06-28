export interface Env {
  TLDRAW_DURABLE_OBJECT: DurableObjectNamespace
  TLDRAW_BUCKET: R2Bucket
  TLDRAW_SYNC_SECRET: string
  ALLOWED_ORIGINS?: string
}
