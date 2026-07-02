import "dotenv/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { FinalizeHandler, FinalizeHandlerArguments, FinalizeHandlerOutput, MetadataBearer } from "@smithy/types";

type AwsHttpRequest = {
  headers?: Record<string, string | undefined>;
};

const stripR2ChecksumHeadersMiddleware =
  <Input extends object, Output extends MetadataBearer>(next: FinalizeHandler<Input, Output>) =>
  async (args: FinalizeHandlerArguments<Input>): Promise<FinalizeHandlerOutput<Output>> => {
    const request = args.request as AwsHttpRequest;
    if (request.headers) {
      delete request.headers["x-amz-checksum-crc32"];
      delete request.headers["x-amz-checksum-crc32c"];
      delete request.headers["x-amz-checksum-sha1"];
      delete request.headers["x-amz-checksum-sha256"];
      delete request.headers["x-amz-sdk-checksum-algorithm"];
      delete request.headers["x-amz-trailer"];
      delete request.headers["x-amz-decoded-content-length"];
    }
    return next(args);
  };

function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID?.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    bucket: process.env.R2_BUCKET_NAME?.trim(),
    publicUrl: process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, ""),
  };
}

function getClient(): S3Client | null {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    // Cloudflare R2 rejects the default request checksums added by
    // @aws-sdk/client-s3 v3.729+ (aws-chunked/CRC32 trailers) with a 401
    // "Unauthorized" signature error. Only send checksums when required.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  client.middlewareStack.addRelativeTo(
    stripR2ChecksumHeadersMiddleware,
    {
      name: "stripR2ChecksumHeadersMiddleware",
      relation: "before",
      toMiddleware: "awsAuthMiddleware",
    },
  );

  return client;
}

/**
 * رفع ملف إلى R2 وإرجاع الرابط العام (إن وُجد R2_PUBLIC_URL)
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; url: string | null }> {
  const { bucket, publicUrl } = getR2Config();
  const client = getClient();
  if (!client || !bucket) {
    throw new Error("R2 غير مضبوط: تأكد من R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME في .env");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.byteLength,
    })
  );

  const url = publicUrl ? `${publicUrl}/${key}` : null;
  return { key, url };
}

export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getR2Config();
  return !!(accountId && accessKeyId && secretAccessKey && bucket);
}

/** يُرجع قائمة بأسماء المتغيرات الناقصة في .env */
export function getMissingR2EnvVars(): string[] {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = getR2Config();
  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("R2_BUCKET_NAME");
  if (!publicUrl) missing.push("R2_PUBLIC_URL (لظهور رابط الصورة بعد الرفع)");
  return missing;
}
