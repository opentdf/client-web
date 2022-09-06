import { inBrowser } from './utils/index';

export const version = process.env.PKG_VERSION;
export const clientType = inBrowser() ? 'tdf3-js-client' : 'tdf3-js-node';
