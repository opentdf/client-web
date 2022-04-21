import { TypedArray } from '../tdf/index';
import { subtle } from './singletons';

export default function digest(
  hashType: AlgorithmIdentifier,
  data: TypedArray | ArrayBuffer
): Promise<ArrayBuffer> {
  return subtle().digest(hashType, data);
}
