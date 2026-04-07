import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Vercel Queues HMAC-SHA256 signature.
 * The signature is computed over the raw request body using QUEUE_SIGNING_KEY.
 *
 * Returns true if the signature is valid, false otherwise.
 * In development (no signing key configured), allows all requests.
 */
export function verifyQueueSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const signingKey = process.env.QUEUE_SIGNING_KEY;

  // In development without a signing key, skip verification
  if (!signingKey) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", signingKey)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) {
    return false;
  }

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}
