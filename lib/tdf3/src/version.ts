import { inBrowser } from './utils/index.js';

export const version = '0.5.2';
export const clientType = inBrowser() ? 'tdf3-js-client' : 'tdf3-js-node';
