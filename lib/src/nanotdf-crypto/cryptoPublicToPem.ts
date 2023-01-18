/**
 *
 * Copyright (c) 2016 SafeBash
 * Cryptography consultant: Andrew Kozlik, Ph.D.
 *
 * @link https://github.com/safebash/opencrypto
 *
 */

/**
 * MIT License
 *
 * Copyright (c) 2016 SafeBash
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as base64 from '../encodings/base64.js';
import addNewLines from './helpers/addNewLines.js';

export default async function cryptoPublicToPem(publicKey: CryptoKey): Promise<string> {
  if (publicKey.type !== 'public') {
    throw new TypeError('Incorrect key type');
  }

  const exportedPublicKey = await crypto.subtle.exportKey('spki', publicKey);
  const b64 = base64.encodeArrayBuffer(exportedPublicKey);
  const pem = addNewLines(b64);
  return `-----BEGIN PUBLIC KEY-----\r\n${pem}-----END PUBLIC KEY-----`;
}
