export function isBrowser() {
  return typeof window !== 'undefined'; // eslint-disable-line
}

export const isSafari = (): boolean =>
  /constructor/i.test(String(globalThis.HTMLElement)) ||
  // @ts-ignore
  globalThis?.safari?.pushNotification?.toString() === '[object SafariRemoteNotification]';

// @ts-ignore
export const isFirefox = (): boolean => typeof InstallTrigger !== 'undefined';

export const rstrip = (str: string, suffix = ' '): string => {
  while (str && suffix && str.endsWith(suffix)) {
    str = str.slice(0, -suffix.length);
  }
  return str;
};
