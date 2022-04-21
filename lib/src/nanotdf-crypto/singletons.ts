/* eslint @typescript-eslint/ban-ts-comment: "off" */

export class Lazy<T> {
  _value: T | undefined;
  constructor(public init: () => T) {}
  public get value(): T {
    return (this._value ??= this.init());
  }
}

function findSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined') {
    let crypto = window.crypto;
    if (!crypto) {
      // @ts-ignore: Swap in incompatible crypto lib
      crypto = window.msCrypto;
    }
    let subtleCrypto = crypto.subtle;
    if (!subtleCrypto) {
      // @ts-ignore: Swap in incompatible crypto lib
      subtleCrypto = crypto.webkitSubtle;
    }
    return subtleCrypto;
  }
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore: Swap in incompatible crypto lib
    return globalThis.crypto.subtle;
  }
  // @ts-ignore: Giving up
  return crypto;
}

export const subtleSingleton = new Lazy(findSubtle);

export function subtle(): SubtleCrypto {
  return subtleSingleton.value;
}

function findGetRandomValues() {
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore: Swap in incompatible crypto lib
    return (a) => globalThis.crypto.getRandomValues(a);
  }
  // @ts-ignore: Giving up
  return (a) => globalThis.crypto.getRandomValues(a);
}

export const getRandomValuesSingleton = new Lazy(findGetRandomValues);

export function getRandomValues<T>(array: T) {
  return getRandomValuesSingleton.value(array);
}
