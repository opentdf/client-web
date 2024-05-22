/**
 *
 * Export to PEM format to binary buffer
 * - key    {CryptoKey}     default: "undefined" CryptoKey generated by WebCrypto API
 */
export async function exportCryptoKey(key: CryptoKey): Promise<Uint8Array> {
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyBuffer = new Uint8Array(exportedKey);
  const len = keyBuffer.byteLength;
  const xPoint = keyBuffer.slice(0, (1 + len) >>> 1); // drop `y`
  xPoint[0] = 0x2 | (keyBuffer[len - 1] & 0x01); // encode sign of `y` in first bit

  // Copy to Arraybuffer
  const compressedPubKeyBuf = new Uint8Array(new ArrayBuffer(xPoint.byteLength));
  compressedPubKeyBuf.set(new Uint8Array(xPoint));
  return compressedPubKeyBuf;
}

export async function importRawKey(c: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    c,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}