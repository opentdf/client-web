import { getRandomValues } from './singletons';

/**
 * Generate a random number of given length
 */
export default function generateRandomNumber(length: number): Uint8Array {
  const byteArray = new Uint8Array(length);
  getRandomValues(byteArray);
  return byteArray;
}
