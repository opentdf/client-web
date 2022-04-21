/* eslint-disable @typescript-eslint/no-namespace */
import { webcrypto } from 'crypto';
import { getRandomValuesSingleton, subtleSingleton } from './nanotdf-crypto/singletons.js';

// Load global 'fetch' functions
import 'cross-fetch/dist/node-polyfill.js';

declare module 'crypto' {
  namespace webcrypto {
    const subtle: SubtleCrypto;
    const getRandomValues: typeof crypto.getRandomValues;
  }
}

function loadCrypto() {
  const { subtle, getRandomValues } = webcrypto;
  getRandomValuesSingleton._value = getRandomValues;
  subtleSingleton._value = subtle;
}

// Side effects time
loadCrypto();
