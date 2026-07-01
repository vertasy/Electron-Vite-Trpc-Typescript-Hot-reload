import { Transform, TransformCallback } from "stream";

function createKey(pin: string): Uint8Array {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }

  const key = new Uint8Array(32);

  for (let i = 0; i < key.length; i++) {
    key[i] = (pin.charCodeAt(i % pin.length) * (i + 1) + i * 17) & 0xff;
  }

  return key;
}

class XorTransform extends Transform {
  private readonly key: Uint8Array;
  private offset = 0;

  constructor(pin: string) {
    super();
    this.key = createKey(pin);
  }

  _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback) {
    const out = Buffer.allocUnsafe(chunk.length);

    for (let i = 0; i < chunk.length; i++) {
      out[i] = chunk[i] ^ this.key[(this.offset + i) % this.key.length];
    }

    this.offset += chunk.length;

    callback(null, out);
  }
}

export class EncryptTransform extends XorTransform {}

export class DecryptTransform extends XorTransform {}
