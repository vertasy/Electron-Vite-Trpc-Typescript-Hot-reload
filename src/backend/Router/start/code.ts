import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync
} from "crypto";
import { getDb } from "../../Database/getDatabasePath";
import { metadataTable } from "../../Database/schema/metadata";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const SECRET = "bro-if-u-saw-that-dont-panic"; // Store this securely
const KEY = scryptSync(SECRET, "salt", 32);

export function encryptPin(pin: string): string {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }

  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", KEY, iv);

  const encrypted = Buffer.concat([cipher.update(pin, "utf8"), cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPin(encryptedPin: string): string {
  const [ivHex, encryptedHex] = encryptedPin.split(":");

  const decipher = createDecipheriv(
    "aes-256-cbc",
    KEY,
    Buffer.from(ivHex, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

export default async function setupCode(code: string) {
  try {
    const encryptedPin = encryptPin(code);
    const db = await getDb();
    const rec = await db.select().from(metadataTable).limit(1).all();
    if (rec[0].hashedCode !== null) return false;
    await db
      .update(metadataTable)
      .set({ hashedCode: encryptedPin })
      .where(eq(metadataTable.id, "1"));
    return true;
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}

export async function checkCode(code: string) {
  try {
    const db = await getDb();
    const metadata = await db.select().from(metadataTable).limit(1).all();
    const decryptedPin = decryptPin(metadata[0].hashedCode!);
    return decryptedPin === code;
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}
