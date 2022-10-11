import { TDF, Client } from './src/index';
import {
  NanoTDFClient,
  NanoTDFDatasetClient,
  AuthProviders,
  version,
  clientType,
} from '../src/index';
import { FileClient } from './src/FileClient';

import { type RequestInfo, type RequestInit } from 'node-fetch';
import { webcrypto as crypto } from 'node:crypto';

globalThis.crypto ??= crypto as unknown as Crypto;

const fetch = (url: RequestInfo, init?: RequestInit) =>
  import(/* webpackIgnore: true */ 'node-fetch').then(({ default: fetch }) => fetch(url, init));
globalThis.fetch ??= fetch as typeof globalThis.fetch;

export {
  TDF,
  Client,
  version,
  clientType,
  NanoTDFClient,
  NanoTDFDatasetClient,
  AuthProviders,
  FileClient,
};

export default {
  TDF,
  Client,
  version,
  clientType,
  NanoTDFClient,
  NanoTDFDatasetClient,
  AuthProviders,
  FileClient,
};
