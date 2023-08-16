import { EventEmitter } from 'events';
import axios from 'axios';
import { unsigned } from './utils/buffer-crc32.js';
import { v4 } from 'uuid';
import { exportSPKI, importPKCS8, importX509 } from 'jose';
import { DecoratedReadableStream } from './client/DecoratedReadableStream.js';
import { EntityObject } from '../../src/tdf/EntityObject.js';
import { validateSecureUrl } from '../../src/utils.js';

import {
  AttributeSet,
  isRemote as isRemoteKeyAccess,
  KeyAccessType,
  KeyInfo,
  Manifest,
  Policy,
  Remote as KeyAccessRemote,
  SplitKey,
  UpsertResponse,
  Wrapped as KeyAccessWrapped,
} from './models/index.js';
import { base64, hex } from '../../src/encodings/index.js';
import {
  type Chunker,
  ZipReader,
  ZipWriter,
  base64ToBuffer,
  fromUrl,
  isAppIdProviderCheck,
  keyMerge,
} from './utils/index.js';
import { Binary } from './binary.js';
import {
  IllegalArgumentError,
  KasDecryptError,
  KasUpsertError,
  KeyAccessError,
  KeySyncError,
  ManifestIntegrityError,
  PolicyIntegrityError,
  TdfDecryptError,
  TdfPayloadExtractionError,
} from './errors.js';
import { htmlWrapperTemplate } from './templates/index.js';

// configurable
// TODO: remove dependencies from ciphers so that we can open-source instead of relying on other Virtru libs
import { AesGcmCipher } from './ciphers/index.js';
import {
  AuthProvider,
  AppIdAuthProvider,
  HttpRequest,
  type HttpMethod,
  reqSignature,
} from '../../src/auth/auth.js';
import PolicyObject from '../../src/tdf/PolicyObject.js';
import { type CryptoService, type DecryptResult } from './crypto/declarations.js';
import { CentralDirectory } from './utils/zip-reader.js';

// TODO: input validation on manifest JSON
const DEFAULT_SEGMENT_SIZE = 1024 * 1024;

/**
 * Configuration for TDF3
 */
export type EncryptionOptions = {
  /**
   * Defaults to `split`, the currently only implmented key wrap algorithm.
   */
  type?: string;
  // Defaults to AES-256-GCM for the encryption.
  cipher?: string;
};

export type RcaParams = {
  pu: string;
  wu: string;
  wk: string;
  al: string;
};

export type RcaLink = string;

export type Metadata = {
  connectOptions?: {
    testUrl: string;
  };
  policyObject?: PolicyObject;
};

export type AddKeyAccess = {
  type: KeyAccessType;
  url?: string;
  publicKey: string;
  attributeUrl?: string;
  metadata?: Metadata;
};

type Segment = {
  hash: string;
  segmentSize: number | undefined;
  encryptedSegmentSize: number | undefined;
};

type EntryInfo = {
  filename: string;
  offset?: number;
  crcCounter?: number;
  fileByteCount?: number;
};

type Chunk = {
  hash: string;
  encryptedOffset: number;
  encryptedSegmentSize?: number;
  decryptedChunk?: null | DecryptResult;
  _resolve?: (value: unknown) => void;
};

type TDFConfiguration = {
  allowedKases?: string[];
  cryptoService: CryptoService;
};

export class TDF extends EventEmitter {
  policy?: Policy;
  mimeType?: string;
  contentStream?: ReadableStream<Uint8Array>;
  manifest?: Manifest;
  entity?: EntityObject;
  encryptionInformation?: SplitKey;
  htmlTransferUrl?: string;
  authProvider?: AuthProvider | AppIdAuthProvider;
  integrityAlgorithm: string;
  segmentIntegrityAlgorithm: string;
  publicKey: string;
  privateKey: string;
  attributeSet: AttributeSet;
  segmentSizeDefault: number;
  chunkMap: Map<string, Chunk>;
  cryptoService: CryptoService;
  allowedKases: string[];

  constructor(configuration: TDFConfiguration) {
    super();

    if (configuration.allowedKases) {
      this.allowedKases = [...configuration.allowedKases];
      this.allowedKases.forEach(validateSecureUrl);
    }
    this.attributeSet = new AttributeSet();
    this.cryptoService = configuration.cryptoService;
    this.publicKey = '';
    this.privateKey = '';
    this.integrityAlgorithm = 'HS256';
    this.segmentIntegrityAlgorithm = this.integrityAlgorithm;
    this.segmentSizeDefault = DEFAULT_SEGMENT_SIZE;
  }

  // factory
  static create(configuration: TDFConfiguration) {
    return new TDF(configuration);
  }

  createCipher(type: string) {
    if (type === 'aes-256-gcm') {
      return new AesGcmCipher(this.cryptoService);
    }
    throw new Error(`Unsupported cipher [${type}]`);
  }

  async generatePolicyUuid() {
    return v4();
  }

  /**
   *
   * @param {Buffer} payload - This is the payload. It must be a buffer.
   * @param {json} manifest - This is the manifest
   * @param {String} transferUrl
   * @return {Buffer}
   */
  static wrapHtml(
    payload: Uint8Array,
    manifest: Manifest | string,
    transferUrl: string
  ): Uint8Array {
    const { origin } = new URL(transferUrl);
    const exportManifest: string =
      typeof manifest === 'string' ? manifest : JSON.stringify(manifest);

    const fullHtmlString = htmlWrapperTemplate({
      transferUrl,
      transferBaseUrl: origin,
      manifest: base64.encode(exportManifest),
      payload: base64.encodeArrayBuffer(payload.buffer),
    });

    return new TextEncoder().encode(fullHtmlString);
  }

  static unwrapHtml(htmlPayload: ArrayBuffer | Uint8Array | Binary | string) {
    let html;
    if (htmlPayload instanceof ArrayBuffer || ArrayBuffer.isView(htmlPayload)) {
      html = new TextDecoder().decode(htmlPayload);
    } else {
      html = htmlPayload.toString();
    }
    const payloadRe = /<input id=['"]?data-input['"]?[^>]*value=['"]?([a-zA-Z0-9+/=]+)['"]?/;
    const reResult = payloadRe.exec(html);
    if (reResult === null) {
      throw new TdfPayloadExtractionError('Payload is missing');
    }
    const base64Payload = reResult[1];
    try {
      return base64ToBuffer(base64Payload);
    } catch (e) {
      throw new TdfPayloadExtractionError('There was a problem extracting the TDF3 payload', e);
    }
  }

  // return a PEM-encoded string from the provided KAS server
  static async getPublicKeyFromKeyAccessServer(url: string): Promise<string> {
    validateSecureUrl(url);
    const kasPublicKeyRequest: { data: string } = await axios.get(`${url}/kas_public_key`);
    return TDF.extractPemFromKeyString(kasPublicKeyRequest.data);
  }

  static async extractPemFromKeyString(keyString: string): Promise<string> {
    let pem: string = keyString;

    // Skip the public key extraction if we find that the KAS url provides a
    // PEM-encoded key instead of certificate
    if (keyString.includes('CERTIFICATE')) {
      const cert = await importX509(keyString, 'RS256', { extractable: true });
      pem = await exportSPKI(cert);
    }

    return pem;
  }

  // Extracts the TDF's manifest
  static async getManifestFromRemoteTDF(url: string): Promise<Manifest> {
    const zipReader = new ZipReader(await fromUrl(url));

    const centralDirectory = await zipReader.getCentralDirectory();
    return await zipReader.getManifest(centralDirectory, '0.manifest.json');
  }

  // Extracts the TDF's manifest and thus the policy from a remote TDF
  // DEPRECATED
  static async getPolicyFromRemoteTDF(url: string): Promise<string> {
    const manifest = await this.getManifestFromRemoteTDF(url);
    return base64.decode(manifest.encryptionInformation.policy);
  }

  setProtocol(): TDF {
    console.error('protocol is ignored; use client.encrypt instead');
    return this;
  }

  setHtmlTransferUrl(url: string): TDF {
    this.htmlTransferUrl = url;
    return this;
  }

  // AuthProvider is a class that can be used to build a custom request body and headers
  // The builder must accept an object of the following (ob.body, ob.headers, ob.method, ob.url)
  // and mutate it in place.
  setAuthProvider(authProvider?: AuthProvider | AppIdAuthProvider): TDF {
    if (!authProvider) {
      throw new Error('Missing authProvider in setAuthProvider');
    }
    this.authProvider = authProvider;
    return this;
  }

  /**
   * Initialize encryption cypher
   * @param opts
   * @returns
   */
  setEncryption(opts: EncryptionOptions) {
    switch (opts.type) {
      case 'split':
      default:
        this.encryptionInformation = new SplitKey(this.createCipher(opts.cipher ?? 'aes-256-gcm'));
        break;
    }
    return this;
  }

  /**
   * Build a key access object and add it to the list. Can specify either
   * a (url, publicKey) pair (legacy, deprecated) or an attribute URL (future).
   * If all are missing then it attempts to use the default attribute. If that
   * is missing it throws an error.
   * @param  {Object} options
   * @param  {String} options.type - enum representing how the object key is treated
   * @param  {String} options.attributeUrl - URL of the attribute to use for pubKey and kasUrl. Omit to use default.
   * @param  {String} options.url - directly set the KAS URL
   * @param  {String} options.publicKey - directly set the (KAS) public key
   * @param  {String? Object?} options.metadata - Metadata. Appears to be dead code.
   * @return {<TDF>}- this instance
   */
  async addKeyAccess({ type, url, publicKey, attributeUrl, metadata }: AddKeyAccess) {
    // TODO - run down metadata parameter. Clean it out if it isn't used this way anymore.

    /** Internal function to keep it DRY */
    function createKeyAccess(
      type: KeyAccessType,
      kasUrl: string,
      pubKey: string,
      metadata?: Metadata
    ) {
      switch (type) {
        case 'wrapped':
          return new KeyAccessWrapped(kasUrl, pubKey, metadata);
        case 'remote':
          return new KeyAccessRemote(kasUrl, pubKey, metadata);
        default:
          throw new KeyAccessError(`TDF.addKeyAccess: Key access type ${type} is unknown`);
      }
    }

    /** Another internal function to keep it dry */
    function loadKeyAccess(
      encryptionInformation: SplitKey | undefined,
      keyAccess: KeyAccessWrapped | KeyAccessRemote
    ) {
      if (!encryptionInformation) {
        throw new KeyAccessError('TDF.addKeyAccess: Encryption Information not set');
      }
      encryptionInformation.keyAccess.push(keyAccess);
    }

    // If an attributeUrl is provided try to load with that first.
    if (attributeUrl) {
      const attr = this.attributeSet.get(attributeUrl);
      if (attr && attr.kasUrl && attr.pubKey) {
        loadKeyAccess(
          this.encryptionInformation,
          createKeyAccess(type, attr.kasUrl, attr.pubKey, metadata)
        );
        return this;
      }
    }

    // if url and pulicKey are specified load the key access object with them
    if (url && publicKey) {
      loadKeyAccess(
        this.encryptionInformation,
        createKeyAccess(type, url, await TDF.extractPemFromKeyString(publicKey), metadata)
      );
      return this;
    }

    // Assume the default attribute is the source for kasUrl and pubKey
    const defaultAttr = this.attributeSet.getDefault();
    if (defaultAttr) {
      const { pubKey, kasUrl } = defaultAttr;
      if (pubKey && kasUrl) {
        loadKeyAccess(
          this.encryptionInformation,
          createKeyAccess(type, kasUrl, await TDF.extractPemFromKeyString(pubKey), metadata)
        );
        return this;
      }
    }
    // All failed. Raise an error.
    throw new KeyAccessError('TDF.addKeyAccess: No source for kasUrl or pubKey');
  }

  setAllowedKases(kases: string[]) {
    this.allowedKases = [...kases];
    this.allowedKases.forEach(validateSecureUrl);
    return this;
  }

  setPolicy(policy: Policy) {
    this.validatePolicyObject(policy);
    this.policy = policy;
    return this;
  }

  setPublicKey(publicKey: string) {
    this.publicKey = publicKey;
    return this;
  }

  /**
   * Add an entity object. This contains attributes with public key info that
   * is used to make splits and wrap object keys.
   * @param  {Object} entity - EntityObject
   * @return {<TDF>}- this instance
   */
  setEntity(entity: EntityObject) {
    this.entity = entity;
    // Harvest the attributes from this entity object
    // Don't wait for this promise to resolve.
    this.entity.attributes.forEach((attr) => this.attributeSet.addJwtAttribute(attr));

    return this;
  }

  setPrivateKey(privateKey: string) {
    this.privateKey = privateKey;
    return this;
  }

  setDefaultSegmentSize(segmentSizeDefault: number) {
    this.segmentSizeDefault = segmentSizeDefault;
    return this;
  }

  setIntegrityAlgorithm(integrityAlgorithm: string, segmentIntegrityAlgorithm: string) {
    this.integrityAlgorithm = integrityAlgorithm.toUpperCase();
    this.segmentIntegrityAlgorithm = (
      segmentIntegrityAlgorithm || integrityAlgorithm
    ).toUpperCase();
    return this;
  }

  addContentStream(contentStream: ReadableStream<Uint8Array>, mimeType?: string) {
    this.contentStream = contentStream;
    this.mimeType = mimeType;
    return this;
  }

  validatePolicyObject(policy: Policy) {
    const missingFields: string[] = [];

    if (!policy.uuid) missingFields.push('uuid');
    if (!policy.body) missingFields.push('body', 'body.dissem');
    if (policy.body && !policy.body.dissem) missingFields.push('body.dissem');

    if (missingFields.length) {
      throw new PolicyIntegrityError(
        `The given policy object requires the following properties: ${missingFields}`
      );
    }
  }

  async _generateManifest(keyInfo: KeyInfo): Promise<Manifest> {
    // (maybe) Fields are quoted to avoid renaming
    const payload = {
      type: 'reference',
      url: '0.payload',
      protocol: 'zip',
      isEncrypted: true,
      schemaVersion: '3.0.0',
      ...(this.mimeType && { mimeType: this.mimeType }),
    };

    if (!this.policy) {
      throw new Error(`No policy provided`);
    }
    const encryptionInformationStr = await this.encryptionInformation?.write(this.policy, keyInfo);

    if (!encryptionInformationStr) {
      throw new Error(`Missing encryption information`);
    }

    return {
      payload,
      // generate the manifest first, then insert integrity information into it
      encryptionInformation: encryptionInformationStr,
    };
  }

  async getSignature(unwrappedKeyBinary: Binary, payloadBinary: Binary, algorithmType: string) {
    switch (algorithmType.toLowerCase()) {
      case 'gmac':
        // use the auth tag baked into the encrypted payload
        return hex.encodeArrayBuffer(new Uint8Array(payloadBinary.asByteArray()).slice(-16).buffer);
      case 'hs256':
        // simple hmac is the default
        return await this.cryptoService.hmac(
          hex.encodeArrayBuffer(new Uint8Array(unwrappedKeyBinary.asByteArray()).buffer),
          new TextDecoder().decode(new Uint8Array(payloadBinary.asByteArray()).buffer)
        );
      default:
        throw new IllegalArgumentError(`Unsupported signature alg [${algorithmType}]`);
    }
  }

  // Allows explicit key syncing using an already-loaded manifest
  async sync() {
    if (this.manifest) {
      await this.upsert(this.manifest, true);
    } else {
      throw new KeySyncError(
        'Key syncing requires a loaded TDF manifest. Please use "loadTDFStream" first to load a manifest.'
      );
    }
  }

  buildRequest(method: HttpMethod, url: string, body?: unknown): HttpRequest {
    return {
      headers: {},
      method: method,
      url: url,
      body,
    };
  }

  // Provide an upsert of key information via each KAS
  // ignoreType if true skips the key access type check when syncing
  async upsert(unsavedManifest: Manifest, ignoreType = false): Promise<UpsertResponse> {
    const { keyAccess, policy } = unsavedManifest.encryptionInformation;
    const isAppIdProvider = this.authProvider && isAppIdProviderCheck(this.authProvider);
    return Promise.all(
      keyAccess.map(async (keyAccessObject) => {
        if (this.authProvider === undefined) {
          throw new Error('Upsert cannot be done without auth provider');
        }
        // We only care about remote key access objects for the policy sync portion
        const isRemote = isRemoteKeyAccess(keyAccessObject);
        if (!ignoreType && !isRemote) {
          return;
        }

        if (!this.allowedKases.includes(keyAccessObject.url)) {
          throw new KasUpsertError(`Unexpected KAS url: [${keyAccessObject.url}]`);
        }

        const url = `${keyAccessObject.url}/${isAppIdProvider ? '' : 'v2/'}upsert`;

        //TODO I dont' think we need a body at all for KAS requests
        // Do we need ANY of this if it's already embedded in the EO in the Bearer OIDC token?
        const body: Record<string, unknown> = {
          keyAccess: keyAccessObject,
          policy: unsavedManifest.encryptionInformation.policy,
          entity: isAppIdProviderCheck(this.authProvider) ? this.entity : undefined,
          authToken: undefined,
          clientPayloadSignature: undefined,
        };

        const pkKeyLike = (await importPKCS8(this.privateKey, 'RS256')) as CryptoKey;
        if (isAppIdProviderCheck(this.authProvider)) {
          body.authToken = await reqSignature({}, pkKeyLike);
        } else {
          body.clientPayloadSignature = await reqSignature(body, pkKeyLike);
        }
        const httpReq = await this.authProvider.withCreds(this.buildRequest('POST', url, body));

        try {
          const response = await axios.post(httpReq.url, httpReq.body, {
            headers: httpReq.headers,
          });

          // Remove additional properties which were needed to sync, but not that we want to save to
          // the manifest
          delete keyAccessObject.wrappedKey;
          delete keyAccessObject.encryptedMetadata;
          delete keyAccessObject.policyBinding;

          if (isRemote) {
            // Decode the policy and extract only the required info to save -- the uuid
            const decodedPolicy = JSON.parse(base64.decode(policy));
            unsavedManifest.encryptionInformation.policy = base64.encode(
              JSON.stringify({ uuid: decodedPolicy.uuid })
            );
          }
          return response.data;
        } catch (e) {
          throw new KasUpsertError(
            `Unable to perform upsert operation on the KAS: [${e.name}: ${e.message}], response: [${e?.response?.body}]`,
            e
          );
        }
      })
    );
  }

  async writeStream(
    byteLimit: number,
    isRcaSource: boolean,
    payloadKey?: Binary,
    progressHandler?: (bytesProcessed: number) => void
  ): Promise<DecoratedReadableStream> {
    if (!this.contentStream) {
      throw new IllegalArgumentError('No input stream defined');
    }
    if (!this.encryptionInformation) {
      throw new IllegalArgumentError('No encryption type specified');
    }
    const encryptionInformation = this.encryptionInformation;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const segmentInfos: Segment[] = [];
    if (!byteLimit) {
      byteLimit = Number.MAX_SAFE_INTEGER;
    }

    const entryInfos: EntryInfo[] = [
      {
        filename: '0.payload',
      },
      {
        filename: '0.manifest.json',
      },
    ];

    let currentBuffer = new Uint8Array();

    let totalByteCount = 0;
    let bytesProcessed = 0;
    let crcCounter = 0;
    let fileByteCount = 0;
    let aggregateHash = '';

    const zipWriter = new ZipWriter();

    if (!this.encryptionInformation) {
      throw new Error('Missing encryptionInformation');
    }
    const keyInfo = await this.encryptionInformation.generateKey();
    const kv = await this.encryptionInformation.generateKey();

    if (!keyInfo || !kv) {
      throw new Error('Missing generated keys');
    }

    const kek = await this.encryptionInformation.encrypt(
      keyInfo.unwrappedKeyBinary,
      kv.unwrappedKeyBinary,
      kv.unwrappedKeyIvBinary
    );

    const manifest = await this._generateManifest(isRcaSource && !payloadKey ? kv : keyInfo);
    this.manifest = manifest;

    // For all remote key access objects, sync its policy
    if (!this.manifest) {
      throw new Error('Please use "loadTDFStream" first to load a manifest.');
    }
    const upsertResponse = await this.upsert(this.manifest);

    // determine default segment size by writing empty buffer
    const { segmentSizeDefault } = this;
    const encryptedBlargh = await this.encryptionInformation.encrypt(
      Binary.fromArrayBuffer(new ArrayBuffer(segmentSizeDefault)),
      keyInfo.unwrappedKeyBinary
    );
    const payloadBuffer = new Uint8Array(encryptedBlargh.payload.asByteArray());
    const encryptedSegmentSizeDefault = payloadBuffer.length;

    // start writing the content
    entryInfos[0].filename = '0.payload';
    entryInfos[0].offset = totalByteCount;
    const sourceReader = this.contentStream.getReader();

    /*
    TODO: Code duplication should be addressed
    - RCA operations require that the write stream has already finished executing it's .on('end') handler before being returned,
      thus both handlers are wrapped in a encompassing promise when we have an RCA source. We should investigate
      if this causes O(n) promises to be loaded into memory.
    - LFS operations can have the write stream returned immediately after both .on('end') and .on('data') handlers
      have been defined, thus not requiring the handlers to be wrapped in a promise.
    */
    const underlingSource = {
      start: (controller: ReadableStreamDefaultController) => {
        controller.enqueue(getHeader(entryInfos[0].filename));
        _countChunk(getHeader(entryInfos[0].filename));
        crcCounter = 0;
        fileByteCount = 0;
      },

      pull: async (controller: ReadableStreamDefaultController) => {
        let isDone;

        while (currentBuffer.length < segmentSizeDefault && !isDone) {
          const { value, done } = await sourceReader.read();
          isDone = done;
          if (value) {
            const temp = new Uint8Array(currentBuffer.length + value.byteLength);
            temp.set(currentBuffer);
            temp.set(new Uint8Array(value), currentBuffer.length);
            currentBuffer = temp;
          }
        }

        while (
          currentBuffer.length >= segmentSizeDefault &&
          !!controller.desiredSize &&
          controller.desiredSize > 0
        ) {
          const segment = currentBuffer.slice(0, segmentSizeDefault);
          const encryptedSegment = await _encryptAndCountSegment(segment);
          controller.enqueue(encryptedSegment);

          currentBuffer = currentBuffer.slice(segmentSizeDefault);
        }

        const isFinalChunkLeft = isDone && currentBuffer.length;

        if (isFinalChunkLeft) {
          const encryptedSegment = await _encryptAndCountSegment(currentBuffer);
          controller.enqueue(encryptedSegment);
          currentBuffer = new Uint8Array();
        }

        if (isDone && currentBuffer.length === 0) {
          entryInfos[0].crcCounter = crcCounter;
          entryInfos[0].fileByteCount = fileByteCount;
          const payloadDataDescriptor = zipWriter.writeDataDescriptor(crcCounter, fileByteCount);

          controller.enqueue(payloadDataDescriptor);
          _countChunk(payloadDataDescriptor);

          // prepare the manifest
          entryInfos[1].filename = '0.manifest.json';
          entryInfos[1].offset = totalByteCount;
          controller.enqueue(getHeader(entryInfos[1].filename));
          _countChunk(getHeader(entryInfos[1].filename));
          crcCounter = 0;
          fileByteCount = 0;

          // hash the concat of all hashes
          const payloadSigStr = await self.getSignature(
            payloadKey || keyInfo.unwrappedKeyBinary,
            Binary.fromString(aggregateHash),
            self.integrityAlgorithm
          );
          manifest.encryptionInformation.integrityInformation.rootSignature.sig =
            base64.encode(payloadSigStr);
          manifest.encryptionInformation.integrityInformation.rootSignature.alg =
            self.integrityAlgorithm;

          manifest.encryptionInformation.integrityInformation.segmentSizeDefault =
            segmentSizeDefault;
          manifest.encryptionInformation.integrityInformation.encryptedSegmentSizeDefault =
            encryptedSegmentSizeDefault;
          manifest.encryptionInformation.integrityInformation.segmentHashAlg =
            self.segmentIntegrityAlgorithm;
          manifest.encryptionInformation.integrityInformation.segments = segmentInfos;

          manifest.encryptionInformation.method.isStreamable = true;

          // write the manifest
          const manifestBuffer = new TextEncoder().encode(JSON.stringify(manifest));
          controller.enqueue(manifestBuffer);
          _countChunk(manifestBuffer);
          entryInfos[1].crcCounter = crcCounter;
          entryInfos[1].fileByteCount = fileByteCount;
          const manifestDataDescriptor = zipWriter.writeDataDescriptor(crcCounter, fileByteCount);
          controller.enqueue(manifestDataDescriptor);
          _countChunk(manifestDataDescriptor);

          // write the central directory out
          const centralDirectoryByteCount = totalByteCount;
          for (let i = 0; i < entryInfos.length; i++) {
            const entryInfo = entryInfos[i];
            const result = zipWriter.writeCentralDirectoryRecord(
              entryInfo.fileByteCount || 0,
              entryInfo.filename,
              entryInfo.offset || 0,
              entryInfo.crcCounter || 0,
              2175008768
            );
            controller.enqueue(result);
            _countChunk(result);
          }
          const endOfCentralDirectoryByteCount = totalByteCount - centralDirectoryByteCount;
          const finalChunk = zipWriter.writeEndOfCentralDirectoryRecord(
            entryInfos.length,
            endOfCentralDirectoryByteCount,
            centralDirectoryByteCount
          );
          controller.enqueue(finalChunk);
          _countChunk(finalChunk);

          controller.close();
        }
      },
    };

    const plaintextStream = new DecoratedReadableStream(underlingSource);

    if (upsertResponse) {
      plaintextStream.upsertResponse = upsertResponse;
      plaintextStream.tdfSize = totalByteCount;
      plaintextStream.KEK = payloadKey ? null : btoa(kek.payload.asString());
      plaintextStream.algorithm = manifest.encryptionInformation.method.algorithm;
    }

    return plaintextStream;

    // nested helper fn's
    function getHeader(filename: string) {
      return zipWriter.getLocalFileHeader(filename, 0, 0, 0);
    }

    function _countChunk(chunk: string | Uint8Array) {
      if (typeof chunk === 'string') {
        chunk = new TextEncoder().encode(chunk);
      }
      totalByteCount += chunk.length;
      if (totalByteCount > byteLimit) {
        throw new Error(`Safe byte limit (${byteLimit}) exceeded`);
      }
      //new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      crcCounter = unsigned(chunk as Uint8Array, crcCounter);
      fileByteCount += chunk.length;
    }

    async function _encryptAndCountSegment(chunk: Uint8Array) {
      bytesProcessed += chunk.length;
      if (progressHandler) {
        progressHandler(bytesProcessed);
      }
      // Don't pass in an IV here. The encrypt function will generate one for you, ensuring that each segment has a unique IV.
      const encryptedResult = await encryptionInformation.encrypt(
        Binary.fromArrayBuffer(chunk.buffer),
        payloadKey || keyInfo.unwrappedKeyBinary
      );
      const payloadBuffer = new Uint8Array(encryptedResult.payload.asByteArray());
      const payloadSigStr = await self.getSignature(
        payloadKey || keyInfo.unwrappedKeyBinary,
        encryptedResult.payload,
        self.segmentIntegrityAlgorithm
      );

      // combined string of all hashes for root signature
      aggregateHash += payloadSigStr;

      segmentInfos.push({
        hash: base64.encode(payloadSigStr),
        segmentSize: chunk.length === segmentSizeDefault ? undefined : chunk.length,
        encryptedSegmentSize:
          payloadBuffer.length === encryptedSegmentSizeDefault ? undefined : payloadBuffer.length,
      });
      const result = new Uint8Array(encryptedResult.payload.asByteArray());
      _countChunk(result);

      return result;
    }
  }

  // load the TDF as a stream in memory, for further use in reading and key syncing
  async loadTDFStream(chunker: Chunker) {
    const zipReader = new ZipReader(chunker);
    const centralDirectory = await zipReader.getCentralDirectory();

    this.manifest = await zipReader.getManifest(centralDirectory, '0.manifest.json');
    return { zipReader, centralDirectory };
  }

  async unwrapKey(manifest: Manifest) {
    const { keyAccess } = manifest.encryptionInformation;
    let responseMetadata;
    const isAppIdProvider = this.authProvider && isAppIdProviderCheck(this.authProvider);
    // Get key access information to know the KAS URLS
    // TODO: logic that runs on multiple KAS's

    const rewrappedKeys = await Promise.all(
      keyAccess.map(async (keySplitInfo) => {
        if (this.authProvider === undefined) {
          throw new Error('Upsert can be done without auth provider');
        }
        if (!this.allowedKases.includes(keySplitInfo.url)) {
          throw new KasUpsertError(`Unexpected KAS url: [${keySplitInfo.url}]`);
        }
        const url = `${keySplitInfo.url}/${isAppIdProvider ? '' : 'v2'}/rewrap`;

        const requestBodyStr = JSON.stringify({
          algorithm: 'RS256',
          keyAccess: keySplitInfo,
          policy: manifest.encryptionInformation.policy,
          clientPublicKey: this.publicKey,
        });

        const jwtPayload = { requestBody: requestBodyStr };
        const pkKeyLike = await importPKCS8(this.privateKey, 'RS256');
        const signedRequestToken = await reqSignature(isAppIdProvider ? {} : jwtPayload, pkKeyLike);

        let requestBody;
        if (isAppIdProvider) {
          requestBody = {
            keyAccess: keySplitInfo,
            policy: manifest.encryptionInformation.policy,
            entity: {
              ...this.entity,
              publicKey: this.publicKey,
            },
            authToken: signedRequestToken,
          };
        } else {
          requestBody = {
            signedRequestToken,
          };
        }

        // Create a PoP token by signing the body so KAS knows we actually have a private key
        // Expires in 60 seconds
        const httpReq = await this.authProvider.withCreds(
          this.buildRequest('POST', url, requestBody)
        );

        try {
          // The response from KAS on a rewrap
          const {
            data: { entityWrappedKey, metadata },
          } = await axios.post(httpReq.url, httpReq.body, { headers: httpReq.headers });
          responseMetadata = metadata;
          const key = Binary.fromString(base64.decode(entityWrappedKey));
          const decryptedKeyBinary = await this.cryptoService.decryptWithPrivateKey(
            key,
            this.privateKey
          );
          this.emit('rewrap', metadata);
          return new Uint8Array(decryptedKeyBinary.asByteArray());
        } catch (e) {
          throw new KasDecryptError(
            `Unable to decrypt the response from KAS: [${e.name}: ${e.message}], response: [${e?.response?.body}]`,
            e
          );
        }
      })
    );

    // Merge the unwrapped keys from each KAS
    const reconstructedKey = keyMerge(rewrappedKeys);
    const reconstructedKeyBinary = Binary.fromArrayBuffer(reconstructedKey);

    return {
      reconstructedKeyBinary,
      metadata: responseMetadata,
    };
  }

  async decryptChunk(
    encryptedChunk: Uint8Array,
    reconstructedKeyBinary: Binary,
    hash: string
  ): Promise<DecryptResult> {
    if (!this.manifest) {
      throw new Error('Missing manifest information');
    }
    const integrityAlgorithmType =
      this.manifest.encryptionInformation.integrityInformation.rootSignature.alg;
    const segmentIntegrityAlgorithmType =
      this.manifest.encryptionInformation.integrityInformation.segmentHashAlg;
    const cipher = this.createCipher(
      this.manifest.encryptionInformation.method.algorithm.toLowerCase()
    );

    const segmentHashStr = await this.getSignature(
      reconstructedKeyBinary,
      Binary.fromArrayBuffer(encryptedChunk.buffer),
      segmentIntegrityAlgorithmType || integrityAlgorithmType
    );
    if (hash !== base64.encode(segmentHashStr)) {
      throw new ManifestIntegrityError('Failed integrity check on segment hash');
    }
    return await cipher.decrypt(encryptedChunk.buffer, reconstructedKeyBinary);
  }

  async updateChunkQueue(
    chunkMap: Chunk[],
    centralDirectory: CentralDirectory[],
    zipReader: ZipReader,
    reconstructedKeyBinary: Binary
  ) {
    const requestsInParallelCount = 100;
    let requests = [];
    const maxLength = 3;

    for (let i = 0; i < chunkMap.length; i += requestsInParallelCount) {
      if (requests.length === maxLength) {
        await Promise.all(requests);
        requests = [];
      }
      requests.push(
        (async () => {
          try {
            const slice = chunkMap.slice(i, i + requestsInParallelCount);
            const bufferSize = slice.reduce(
              (currentVal, { encryptedSegmentSize }) =>
                currentVal + (encryptedSegmentSize as number),
              0
            );
            let buffer: Uint8Array | null = await zipReader.getPayloadSegment(
              centralDirectory,
              '0.payload',
              slice[0].encryptedOffset,
              bufferSize
            );
            for (const index in slice) {
              const { encryptedOffset, encryptedSegmentSize } = slice[index];

              const offset =
                slice[0].encryptedOffset === 0
                  ? encryptedOffset
                  : encryptedOffset % slice[0].encryptedOffset;
              const encryptedChunk = (buffer as Uint8Array).subarray(
                offset,
                offset + (encryptedSegmentSize as number)
              );
              slice[index].decryptedChunk = await this.decryptChunk(
                encryptedChunk,
                reconstructedKeyBinary,
                slice[index]['hash']
              );
              if (slice[index]._resolve) {
                (slice[index]._resolve as (value: unknown) => void)(null);
              }
            }
            buffer = null;
          } catch (e) {
            throw new TdfDecryptError(
              'Error decrypting payload. This suggests the key used to decrypt the payload is not correct.',
              e
            );
          }
        })()
      );
    }
  }

  /**
   * readStream
   *
   * @param {Object} chunker - A function object for getting data in a series of typed array objects
   * @param {Stream} outputStream - The writable stream we should put the new bits into
   * @param {Object} rcaParams - Optional field to specify if file is stored on S3
   */
  async readStream(
    chunker: Chunker,
    rcaParams?: RcaParams,
    progressHandler?: (bytesProcessed: number) => void,
    fileStreamServiceWorker?: string
  ) {
    const { zipReader, centralDirectory } = await this.loadTDFStream(chunker);
    if (!this.manifest) {
      throw new Error('Missing manifest data');
    }

    const { segments } = this.manifest.encryptionInformation.integrityInformation;
    const unwrapResult = await this.unwrapKey(this.manifest);
    let { reconstructedKeyBinary } = unwrapResult;
    const { metadata } = unwrapResult;

    const defaultSegmentSize =
      this.manifest?.encryptionInformation?.integrityInformation?.encryptedSegmentSizeDefault;
    const encryptedSegmentSizeDefault = defaultSegmentSize || DEFAULT_SEGMENT_SIZE;

    if (rcaParams && rcaParams.wk) {
      const { wk, al } = rcaParams;
      this.encryptionInformation = new SplitKey(this.createCipher(al.toLowerCase()));

      const decodedReconstructedKeyBinary = await this.encryptionInformation.decrypt(
        Uint8Array.from(atob(wk).split(''), (char) => char.charCodeAt(0)),
        reconstructedKeyBinary
      );
      reconstructedKeyBinary = decodedReconstructedKeyBinary.payload;
    }

    // check the combined string of hashes
    const integrityAlgorithmType =
      this.manifest.encryptionInformation.integrityInformation.rootSignature.alg;
    const payloadSigStr = await this.getSignature(
      reconstructedKeyBinary,
      Binary.fromString(segments.map((segment) => base64.decode(segment.hash)).join('')),
      integrityAlgorithmType
    );

    if (
      this.manifest.encryptionInformation.integrityInformation.rootSignature.sig !==
      base64.encode(payloadSigStr)
    ) {
      throw new ManifestIntegrityError('Failed integrity check on root signature');
    }

    let mapOfRequestsOffset = 0;
    this.chunkMap = new Map(
      segments.map(({ hash, encryptedSegmentSize = encryptedSegmentSizeDefault }) => {
        const result = {
          hash,
          encryptedOffset: mapOfRequestsOffset,
          encryptedSegmentSize,
        } as Chunk;
        mapOfRequestsOffset += encryptedSegmentSize || encryptedSegmentSizeDefault;
        return [hash, result];
      })
    );

    this.updateChunkQueue(
      Array.from(this.chunkMap.values()),
      centralDirectory,
      zipReader,
      reconstructedKeyBinary
    ).catch((e) => {
      throw new Error(e);
    });

    let progress = 0;
    const underlyingSource = {
      pull: async (controller: ReadableStreamDefaultController) => {
        if (this.chunkMap.size === 0) {
          controller.close();
          return;
        }

        const [hash, chunk] = this.chunkMap.entries().next().value;
        if (!chunk.decryptedChunk) {
          await new Promise((resolve) => {
            chunk._resolve = resolve;
          });
        }
        const decryptedSegment = chunk.decryptedChunk;

        controller.enqueue(new Uint8Array(decryptedSegment.payload.asByteArray()));
        progress += chunk.encryptedSegmentSize;
        if (progressHandler) {
          progressHandler(progress);
        }

        chunk.decryptedChunk = null;
        this.chunkMap.delete(hash);
      },
      ...(fileStreamServiceWorker && { fileStreamServiceWorker }),
    };

    const outputStream = new DecoratedReadableStream(underlyingSource);

    if (rcaParams && rcaParams.wu) {
      const res = await axios.head(rcaParams.wu);

      const length = parseInt(res?.headers?.['content-length'] as string, 10);

      if (length) {
        outputStream.fileSize = length;
      } else {
        console.log('Unable to retrieve total fileSize');
      }
    }

    outputStream.manifest = this.manifest;
    if (outputStream.emit) {
      outputStream.emit('manifest', this.manifest);
    }
    outputStream.metadata = metadata;

    // If the output stream can emit events, then emit the rewrap response.
    if (outputStream.emit) {
      outputStream.emit('rewrap', metadata);
    }
    return outputStream;
  }
}
