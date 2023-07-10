import { webcrypto as crypto } from 'crypto';
import { ReadableStream } from 'stream/web';

import { FileClient } from './src/FileClient.js';
import { Binary } from './src/binary.js';
import { DecoratedReadableStream } from './src/client/DecoratedReadableStream.js';
import { NodeTdfStream } from './src/client/NodeTdfStream.js';
import {
  type DecryptParams,
  DecryptParamsBuilder,
  type DecryptSource,
  type EncryptParams,
  EncryptParamsBuilder,
} from './src/client/builders.js';
import { type SessionKeys, type ClientConfig, createSessionKeys } from './src/client/index.js';
import { type AnyTdfStream, registerModuleType } from './src/client/tdf-stream.js';
import {
  type CryptoService,
  type DecryptResult,
  type EncryptResult,
  type PemKeyPair,
} from './src/crypto/declarations.js';
import { TDF, Client, Errors } from './src/index.js';
import {
  type KeyInfo,
  SplitKey,
  type EncryptionInformation,
} from './src/models/encryption-information.js';
import { AuthProvider, AppIdAuthProvider, HttpRequest } from '../src/auth/auth.js';
import {
  NanoTDFClient,
  NanoTDFDatasetClient,
  AuthProviders,
  version,
  clientType,
} from '../src/index.js';
import { type AlgorithmName, type AlgorithmUrn } from './src/ciphers/algorithms.js';

if (globalThis) {
  globalThis.crypto ??= crypto as unknown as Crypto;
  //@ts-expect-error assignment to any type
  globalThis?.CryptoKey ??= crypto.CryptoKey;
  // @ts-expect-error transform type incompatible
  globalThis?.ReadableStream ??= ReadableStream;
}

registerModuleType(NodeTdfStream);

export {
  AnyTdfStream,
  AppIdAuthProvider,
  AuthProvider,
  AuthProviders,
  Binary,
  Client,
  ClientConfig,
  DecoratedReadableStream,
  DecryptParams,
  DecryptParamsBuilder,
  DecryptSource,
  EncryptionInformation,
  EncryptParams,
  EncryptParamsBuilder,
  Errors,
  FileClient,
  HttpRequest,
  KeyInfo,
  NanoTDFClient,
  NanoTDFDatasetClient,
  SessionKeys,
  SplitKey,
  TDF,
  clientType,
  createSessionKeys,
  version,
};

export type {
  AlgorithmName,
  AlgorithmUrn,
  CryptoService,
  DecryptResult,
  EncryptResult,
  PemKeyPair,
};

export default {
  TDF,
  Errors,
  Client,
  version,
  clientType,
  NanoTDFClient,
  NanoTDFDatasetClient,
  AuthProviders,
  FileClient,
  AuthProvider,
  AppIdAuthProvider,
  HttpRequest,
};
