import { TypedArray } from '../tdf/index';
import getCryptoLib from './getCryptoLib';

export default function digest(
  hashType: AlgorithmIdentifier,
  data: TypedArray | ArrayBuffer
): Promise<ArrayBuffer> {
  const crypto = getCryptoLib();

  return crypto.digest(hashType, data);
}
