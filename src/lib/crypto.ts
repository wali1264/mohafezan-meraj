import CryptoJS from 'crypto-js';

// In a real production system, this secret would be securely distributed
// or the system would use asymmetric cryptography (public/private keys).
// For this offline demo, we use a shared symmetric key.
const SECRET_KEY = "SUPER_SECRET_OFFLINE_KEY";

export function signData(data: string): string {
  return CryptoJS.HmacSHA256(data, SECRET_KEY).toString(CryptoJS.enc.Hex);
}

export function generateSecuredPayload(userId: string): string {
  const timestamp = Date.now();
  const data = `${userId}|${timestamp}`;
  const sig = signData(data);
  return JSON.stringify({ id: userId, ts: timestamp, sig });
}

export function verifySecuredPayload(payloadStr: string): { valid: boolean; error?: string; id?: string; ts?: number } {
  try {
    const parsed = JSON.parse(payloadStr);
    const { id, ts, sig } = parsed;

    if (!id || !ts || !sig) {
      return { valid: false, error: "Invalid QR format" };
    }

    const data = `${id}|${ts}`;
    const expectedSig = signData(data);

    if (sig !== expectedSig) {
      return { valid: false, error: "Digital signature mismatch (Fake QR)" };
    }

    // Dynamic QR Check: Reject if older than 60 seconds (60000 ms)
    const now = Date.now();
    if (now - ts > 60000) {
      return { valid: false, error: "QR code expired (Generated more than 60s ago)" };
    }

    return { valid: true, id, ts };
  } catch (err) {
    return { valid: false, error: "Failed to parse QR code" };
  }
}
