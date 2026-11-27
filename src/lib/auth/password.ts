import { hash, verify } from "@node-rs/argon2";

// argon2id (the library default algorithm), OWASP-recommended parameters.
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const MIN_PASSWORD = 12;

export function hashPassword(pw: string): Promise<string> {
  return hash(pw, OPTS);
}

export async function verifyPassword(hashed: string, pw: string): Promise<boolean> {
  try {
    return await verify(hashed, pw);
  } catch {
    return false;
  }
}
