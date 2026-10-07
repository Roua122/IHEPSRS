import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(secret: string): Buffer {
  const normalized = secret
    .toUpperCase()
    .replace(/=+$/u, "")
    .replace(/\s+/gu, "");

  if (!normalized || !/^[A-Z2-7]+$/u.test(normalized)) {
    throw new Error("TOTP secret must be valid Base32");
  }

  let bits = "";
  for (const character of normalized) {
    const value = BASE32_ALPHABET.indexOf(character);
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function computeCode(secret: string, timestampMs: number): string {
  const key = decodeBase32(secret);
  const counter = Math.floor(timestampMs / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

@Injectable()
export class TotpService {
  verify(secret: string, code: string, at = Date.now()): boolean {
    if (!/^\d{6}$/u.test(code)) {
      return false;
    }

    const supplied = Buffer.from(code);
    for (const offset of [-30_000, 0, 30_000]) {
      const expected = Buffer.from(computeCode(secret, at + offset));
      if (
        expected.length === supplied.length &&
        timingSafeEqual(expected, supplied)
      ) {
        return true;
      }
    }

    return false;
  }

  codeForTesting(secret: string, at = Date.now()): string {
    return computeCode(secret, at);
  }
}
