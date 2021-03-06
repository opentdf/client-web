/**
 * Exposes the released version number of the `@opentdf/client` package
 */
export const version = typeof process === 'undefined' ? 'main' : process.env.PKG_VERSION;

/**
 * A string name used to label requests as coming from this library client.
 */
export const clientType = 'client-web';
