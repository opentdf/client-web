/* eslint-disable no-async-promise-executor */
import { EventEmitter } from 'events';
import axios from 'axios';
import crc32 from 'buffer-crc32';
import { v4 } from 'uuid';
import { pki } from 'node-forge';
import { SignJWT, importPKCS8 } from 'jose';
import { PlaintextStream } from './client/tdf-stream';

import {
  AttributeSet,
  Wrapped as KeyAccessWrapped,
  Remote as KeyAccessRemote,
  SplitKey,
  isRemote as isRemoteKeyAccess,
} from './models';
import { base64 } from '../../src/encodings';
import * as cryptoService from './crypto';
import { keyMerge, ZipWriter, ZipReader, base64ToBuffer } from './utils';
import { fromUrl } from './utils';
import { Binary } from './binary';
import {
  KasDecryptError,
  KasUpsertError,
  KeyAccessError,
  KeySyncError,
  ManifestIntegrityError,
  PolicyIntegrityError,
  TdfDecryptError,
  TdfPayloadExtractionError,
} from './errors';
import { htmlWrapperTemplate } from './templates';

// configurable
// TODO: remove dependencies from ciphers so that we can open-source instead of relying on other Virtru libs
import { AesGcmCipher } from './ciphers';

// TODO: input validation on manifest JSON
const DEFAULT_SEGMENT_SIZE = 1024 * 1024;

// TDF3
class TDF extends EventEmitter {
  constructor() {
    super();
    // default
    this.config = {};
    this.policy = {};

    this.mimeType = null;
    this.content = null;
    this.contentStream = null;

    this.manifest = null;
    this.payload = null;

    this.encryptionInformation = null;

    this.attributeSet = new AttributeSet();

    this.publicKey = '';
    this.privateKey = '';

    this.integrityAlgorithm = 'HS256';
    this.htmlTransferUrl = null;

    this.segmentIntegrityAlgorithm = this.integrityAlgorithm;

    this.segmentSizeDefault = DEFAULT_SEGMENT_SIZE;
  }

  // factory
  static create() {
    return new TDF();
  }

  static createCipher(type) {
    if (type === 'aes-256-gcm') {
      return new AesGcmCipher(cryptoService);
    }
    throw new Error(`Unsupported cipher [${type}]`);
  }

  static async generateKeyPair() {
    return await cryptoService.generateKeyPair();
  }

  static async generatePolicyUuid() {
    return v4();
  }

  /**
   *
   * @param {Buffer} payload - This is the payload. It must be a buffer.
   * @param {json} manifest - This is the manifest
   * @param {String} transferUrl
   * @return {Buffer}
   */
  static wrapHtml(payload, manifest, transferUrl) {
    const parsedUrl = new URL(transferUrl);
    const { origin } = parsedUrl;
    const exportManifest = typeof manifest === 'string' ? manifest : JSON.stringify(manifest);

    const fullHtmlString = htmlWrapperTemplate({
      transferUrl,
      transferBaseUrl: origin,
      manifest: base64.encode(exportManifest),
      payload: payload.toString('base64'),
    });

    return Buffer.from(fullHtmlString);
  }

  static unwrapHtml(htmlPayload) {
    const html = htmlPayload.toString();
    const payloadRe = /<input id=['"]?data-input['"]?[^>]*value=['"]?([a-zA-Z0-9+/=]+)['"]?/;
    try {
      const base64Payload = payloadRe.exec(html)[1];
      return base64ToBuffer(base64Payload);
    } catch (e) {
      throw new TdfPayloadExtractionError('There was a problem extracting the TDF3 payload', e);
    }
  }

  // return a PEM-encoded string from the provided KAS server
  static async getPublicKeyFromKeyAccessServer(url) {
    const httpsRegex = /^https:/;
    if (
      url.startsWith('http://localhost') ||
      /^http:\/\/[a-zA-Z.-]*[.]?svc\.cluster\.local($|\/)/.test(url) ||
      url.startsWith('http://127.0.0.1') ||
      httpsRegex.test(url)
    ) {
      const kasPublicKeyRequest = await axios.get(`${url}/kas_public_key`);
      return TDF.extractPemFromKeyString(kasPublicKeyRequest.data);
    }

    throw Error('Public key must be requested over a secure channel');
  }

  static extractPemFromKeyString(keyString) {
    let pem = keyString;

    // Skip the public key extraction if we find that the KAS url provides a
    // PEM-encoded key instead of certificate
    if (keyString.includes('CERTIFICATE')) {
      const cert = pki.certificateFromPem(keyString);
      pem = pki.publicKeyToPem(cert.publicKey);
    }

    return pem;
  }

  // Extracts the TDF's manifest
  static async getManifestFromRemoteTDF(url) {
    const zipReader = new ZipReader(fromUrl(url));

    const centralDirectory = await zipReader.getCentralDirectory();
    return await zipReader.getManifest(centralDirectory, '0.manifest.json');
  }

  // Extracts the TDF's manifest and thus the policy from a remote TDF
  // DEPRECATED
  static async getPolicyFromRemoteTDF(url) {
    const manifest = await this.getManifestFromRemoteTDF(url);
    return base64.decode(manifest.encryptionInformation.policy);
  }

  setProtocol() {
    console.error('protocol is ignored; use client.encrypt instead');
    return this;
  }

  setHtmlTransferUrl(url) {
    this.htmlTransferUrl = url;
    return this;
  }

  // AuthProvider is a class that can be used to build a custom request body and headers
  // The builder must accept an object of the following (ob.body, ob.headers, ob.method, ob.url)
  // and mutate it in place.
  setAuthProvider(authProvider) {
    this.authProvider = authProvider;
    return this;
  }

  setEncryption(opts) {
    switch (opts.type) {
      case 'split':
      default:
        this.encryptionInformation = new SplitKey(TDF.createCipher(opts.cipher || 'aes-256-gcm'));
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
  addKeyAccess({ type, url, publicKey, attributeUrl, metadata = '' }) {
    // TODO - run down metadata parameter. Clean it out if it isn't used this way anymore.

    /** Internal function to keep it DRY */
    function createKeyAccess(type, kasUrl, pubKey, metadata) {
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
    function loadKeyAccess(encryptionInformation, keyAccess) {
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
        createKeyAccess(type, url, TDF.extractPemFromKeyString(publicKey), metadata)
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
          createKeyAccess(type, kasUrl, TDF.extractPemFromKeyString(pubKey), metadata)
        );
        return this;
      }
    }
    // All failed. Raise an error.
    throw new KeyAccessError('TDF.addKeyAccess: No source for kasUrl or pubKey');
  }

  setPolicy(policy) {
    this.validatePolicyObject(policy);
    this.policy = policy;
    return this;
  }

  setPublicKey(publicKey) {
    this.publicKey = publicKey;
    return this;
  }

  setPrivateKey(privateKey) {
    this.privateKey = privateKey;
    return this;
  }

  setDefaultSegmentSize(segmentSizeDefault) {
    this.segmentSizeDefault = segmentSizeDefault;
    return this;
  }

  setIntegrityAlgorithm(integrityAlgorithm, segmentIntegrityAlgorithm) {
    this.integrityAlgorithm = integrityAlgorithm.toUpperCase();
    this.segmentIntegrityAlgorithm = (
      segmentIntegrityAlgorithm || integrityAlgorithm
    ).toUpperCase();
    return this;
  }

  // this must be binary!
  addContent(content, mimeType) {
    this.content = content;
    this.mimeType = mimeType;
    return this;
  }

  addContentStream(contentStream, mimeType) {
    this.contentStream = (contentStream instanceof ReadableStream)
      ? contentStream
      : PlaintextStream.convertToWebStream(contentStream);
    this.mimeType = mimeType;
    return this;
  }

  validatePolicyObject(policy) {
    const missingFields = [];

    if (!policy.uuid) missingFields.push('uuid');
    if (!policy.body) missingFields.push('body', 'body.dissem');
    if (policy.body && !policy.body.dissem) missingFields.push('body.dissem');

    if (missingFields.length) {
      throw new PolicyIntegrityError(
        `The given policy object requires the following properties: ${missingFields}`
      );
    }
  }

  async _generateManifest(keyInfo) {
    // (maybe) Fields are quoted to avoid renaming
    const payload = {
      type: 'reference',
      url: '0.payload',
      protocol: 'zip',
      isEncrypted: true,
      schemaVersion: '3.0.0',
      ...(this.mimeType && { mimeType: this.mimeType }),
    };
    const encryptionInformationStr = await this.encryptionInformation.write(this.policy, keyInfo);

    return {
      payload,
      // generate the manifest first, then insert integrity information into it
      encryptionInformation: encryptionInformationStr,
    };
  }

  async getSignature(unwrappedKeyBinary, payloadBinary, algorithmType) {
    switch (algorithmType.toLowerCase()) {
      case 'hs256':
      default:
        // simple hmac is the default
        return await cryptoService.hmac(
          unwrappedKeyBinary.asBuffer().toString('hex'),
          payloadBinary.asBuffer()
        );
      case 'gmac':
        // use the auth tag baked into the encrypted payload
        return payloadBinary.asBuffer().slice(-16).toString('hex');
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

  buildRequest(method, url, body) {
    return {
      headers: {},
      params: {},
      method: method,
      url: url,
      body: body,
    };
  }

  // Provide an upsert of key information via each KAS
  // ignoreType if true skips the key access type check when syncing
  async upsert(unsavedManifest, ignoreType = false) {
    const { keyAccess, policy } = unsavedManifest.encryptionInformation;
    return Promise.all(
      keyAccess.map(async (keyAccessObject) => {
        // We only care about remote key access objects for the policy sync portion
        const isRemote = isRemoteKeyAccess(keyAccessObject);
        if (!ignoreType && !isRemote) {
          return;
        }

        const url = `${keyAccessObject.url}/v2/upsert`;

        //TODO I dont' think we need a body at all for KAS requests
        // Do we need ANY of this if it's already embedded in the EO in the Bearer OIDC token?
        const body = {
          keyAccess: keyAccessObject,
          policy: unsavedManifest.encryptionInformation.policy,
        };

        const httpReq = this.buildRequest('post', url, body);
        if (this.authProvider) {
          const authHeader = await this.authProvider.authorization();
          httpReq.headers.Authorization = authHeader;
        }

        const pkKeyLike = await importPKCS8(this.privateKey, 'RS256');

        // Create a PoP token by signing the body so KAS knows we actually have a private key
        // Expires in 60 seconds
        httpReq.body.clientPayloadSignature = await new SignJWT(httpReq.body)
          .setProtectedHeader({ alg: 'RS256' })
          .setIssuedAt()
          .setExpirationTime('1m')
          .sign(pkKeyLike);

        try {
          await axios.post(url, httpReq.body, { headers: httpReq.headers });

          // Remove additional properties which were needed to sync, but not that we want to save to
          // the manifest
          delete keyAccessObject.wrappedKey;
          delete keyAccessObject.encryptedMetadata;
          delete keyAccessObject.policyBinding;

          if (isRemote) {
            // Decode the policy and extract only the required info to save -- the uuid
            const decodedPolicy = JSON.parse(base64.decode(policy));
            const newEncodedPolicy = base64.encode(JSON.stringify({ uuid: decodedPolicy.uuid }));
            unsavedManifest.encryptionInformation.policy = newEncodedPolicy;
          }
        } catch (e) {
          throw new KasUpsertError('Unable to perform upsert operation on the KAS', e);
        }
      })
    );
  }

  async writeStream(byteLimit, isRcaSource) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const segmentInfos = [];
    if (!byteLimit) {
      byteLimit = Number.MAX_SAFE_INTEGER;
    }

    const entryInfos = [
      {
        filename: '0.payload',
      },
      {
        filename: '0.manifest.json',
      },
    ];

    let currentBuffer = Buffer.alloc(0);

    let totalByteCount = 0;
    let crcCounter = 0;
    let fileByteCount = 0;
    let aggregateHash = '';

    const zipWriter = new ZipWriter();
    const keyInfo = await this.encryptionInformation.generateKey();
    const kv = await this.encryptionInformation.generateKey();

    const kek = await this.encryptionInformation.encrypt(
      keyInfo.unwrappedKeyBinary,
      kv.unwrappedKeyBinary,
      kv.unwrappedKeyIvBinary
    );

    this.manifest = await this._generateManifest(isRcaSource ? kv : keyInfo);

    // For all remote key access objects, sync its policy
    const upsertResponse = await this.upsert(this.manifest);

    // determine default segment size by writing empty buffer
    const { segmentSizeDefault } = this;
    const encryptedBlargh = await this.encryptionInformation.encrypt(
      Binary.fromBuffer(Buffer.alloc(segmentSizeDefault)),
      keyInfo.unwrappedKeyBinary
    );
    const payloadBuffer = encryptedBlargh.payload.asBuffer();
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
      start(controller){
        controller.enqueue(getHeader(entryInfos[0].filename));
        _countChunk(getHeader(entryInfos[0].filename));
        crcCounter = 0;
        fileByteCount = 0;
      },

      async pull(controller) {
        let isDone;

        while (currentBuffer.length < segmentSizeDefault && !isDone) {
          const { value, done } = await sourceReader.read();
          isDone = done;
          if (value) {
            currentBuffer = Buffer.concat([currentBuffer, value]);
          }
        }

        while (currentBuffer.length >= segmentSizeDefault && controller.desiredSize > 0) {
          const segment = currentBuffer.slice(0, segmentSizeDefault);
          const encryptedSegment = await _encryptAndCountSegment(segment);
          controller.enqueue(encryptedSegment);

          currentBuffer = currentBuffer.slice(segmentSizeDefault);
        }

        const isFinalChunkLeft = isDone && currentBuffer.length

        if (isFinalChunkLeft) {
          const encryptedSegment = await _encryptAndCountSegment(currentBuffer);
          controller.enqueue(encryptedSegment);
          currentBuffer = Buffer.alloc(0);
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

          const { manifest } = self;

          // hash the concat of all hashes
          const payloadSigStr = await self.getSignature(
            keyInfo.unwrappedKeyBinary,
            Binary.fromString(aggregateHash),
            self.integrityAlgorithm
          );
          manifest.encryptionInformation.integrityInformation.rootSignature.sig =
            base64.encode(payloadSigStr);
          manifest.encryptionInformation.integrityInformation.rootSignature.alg =
            self.integrityAlgorithm;

          manifest.encryptionInformation.integrityInformation.segmentSizeDefault = segmentSizeDefault;
          manifest.encryptionInformation.integrityInformation.encryptedSegmentSizeDefault =
            encryptedSegmentSizeDefault;
          manifest.encryptionInformation.integrityInformation.segmentHashAlg =
            self.segmentIntegrityAlgorithm;
          manifest.encryptionInformation.integrityInformation.segments = segmentInfos;

          manifest.encryptionInformation.method.isStreamable = true;

          // write the manifest
          const manifestBuffer = Buffer.from(JSON.stringify(manifest));
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
              entryInfo.fileByteCount,
              entryInfo.filename,
              entryInfo.offset,
              entryInfo.crcCounter,
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
          )
          controller.enqueue(finalChunk);
          _countChunk(finalChunk);

          controller.close();
        }
      },
    }

    const plaintextStream = new PlaintextStream(segmentSizeDefault, underlingSource);

    if (upsertResponse) {
      plaintextStream.upsertResponse = upsertResponse;
      plaintextStream.tdfSize = totalByteCount;
      plaintextStream.KEK = kek.payload.asBuffer().toString('base64');
      plaintextStream.algorithm = this.manifest.encryptionInformation.method.algorithm;
    }

    return plaintextStream;

    // nested helper fn's
    function getHeader(filename) {
      return zipWriter.getLocalFileHeader(filename, 0, 0, 0);
    }

    function _countChunk(chunk) {
      totalByteCount += chunk.length;
      if (totalByteCount > byteLimit) {
        throw new Error(`Safe byte limit (${byteLimit}) exceeded`);
      }
      crcCounter = crc32.unsigned(chunk, crcCounter);
      fileByteCount += chunk.length;
    }

    async function _encryptAndCountSegment(chunk) {
      // Don't pass in an IV here. The encrypt function will generate one for you, ensuring that each segment has a unique IV.
      const encryptedResult = await self.encryptionInformation.encrypt(
        Binary.fromBuffer(chunk),
        keyInfo.unwrappedKeyBinary
      );
      const payloadBuffer = encryptedResult.payload.asBuffer();
      const payloadSigStr = await self.getSignature(
        keyInfo.unwrappedKeyBinary,
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
      const result = encryptedResult.payload.asBuffer();
      _countChunk(result);

      return result;
    }
  }

  // load the TDF as a stream in memory, for further use in reading and key syncing
  async loadTDFStream(chunker) {
    const zipReader = new ZipReader(chunker);
    const centralDirectory = await zipReader.getCentralDirectory();

    this.manifest = await zipReader.getManifest(centralDirectory, '0.manifest.json');
    return { zipReader, centralDirectory };
  }

  async unwrapKey(manifest) {
    const { keyAccess } = manifest.encryptionInformation;
    let responseMetadata;

    // Get key access information to know the KAS URLS
    // TODO: logic that runs on multiple KAS's

    const rewrappedKeys = await Promise.all(
      keyAccess.map(async (keySplitInfo) => {
        const url = `${keySplitInfo.url}/v2/rewrap`;

        const requestBodyStr = JSON.stringify({
          algorithm: 'RS256',
          keyAccess: keySplitInfo,
          clientPublicKey: this.publicKey,
          policy: manifest.encryptionInformation.policy,
        });

        const jwtPayload = { requestBody: requestBodyStr };
        const pkKeyLike = await importPKCS8(this.privateKey, 'RS256');
        const signedRequestToken = await new SignJWT(jwtPayload)
          .setProtectedHeader({ alg: 'RS256' })
          .setIssuedAt()
          .setExpirationTime('1m')
          .sign(pkKeyLike);

        const requestBody = {
          signedRequestToken,
        };

        // Create a PoP token by signing the body so KAS knows we actually have a private key
        // Expires in 60 seconds
        let httpReq = this.buildRequest('post', url, requestBody);

        if (this.authProvider) {
          const authHeader = await this.authProvider.authorization();
          httpReq.headers.Authorization = authHeader;
        }

        try {
          // The response from KAS on a rewrap
          const {
            data: { entityWrappedKey, metadata },
          } = await axios.post(url, httpReq.body, { headers: httpReq.headers });
          responseMetadata = metadata;
          const key = Binary.fromString(base64.decode(entityWrappedKey));
          const decryptedKeyBinary = await cryptoService.decryptWithPrivateKey(
            key,
            this.privateKey
          );
          this.emit('rewrap', metadata);
          return decryptedKeyBinary.asBuffer();
        } catch (e) {
          throw new KasDecryptError('Unable to decrypt the response from KAS', e);
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

  /**
   * readStream
   *
   * @param {Object} chunker - A function object for getting data in a series of typed array objects
   * @param {Stream} outputStream - The writable stream we should put the new bits into
   * @param {Object} rcaParams - Optional field to specify if file is stored on S3
   */
  async readStream(chunker, rcaParams) {
    const { zipReader, centralDirectory } = await this.loadTDFStream(chunker);

    const { segments } = this.manifest.encryptionInformation.integrityInformation;
    let { reconstructedKeyBinary, metadata } = await this.unwrapKey(this.manifest);
    if (rcaParams) {
      const { wk, al } = rcaParams;
      this.encryptionInformation = new SplitKey(TDF.createCipher(al.toLowerCase()));
      const kekPayload = Binary.fromBuffer(Buffer.from(wk, 'base64'));
      const decodedReconstructedKeyBinary = await this.encryptionInformation.decrypt(
        kekPayload.asBuffer(),
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

    // use the wrapped key to decrypt the payload
    const cipher = TDF.createCipher(
      this.manifest.encryptionInformation.method.algorithm.toLowerCase()
    );

    const encryptedSegmentSizeDefault =
      parseInt(
        this.manifest.encryptionInformation.integrityInformation.encryptedSegmentSizeDefault
      ) || DEFAULT_SEGMENT_SIZE;

    // TODO: Don't await on each segment serially, instead use event-driven approach to prevent deadlock.
    // See: https://github.com/jherwitz/tdf3-js/blob/3ec3c8a3b8c5cecb6f6976b540d5ecde21183c8c/src/tdf.js#L739
    let encryptedOffset = 0;

    const that = this;
    const outputStream = new PlaintextStream(this.segmentSizeDefault, {
      async pull(controller) {
        while (segments.length && controller.desiredSize >= 0) {
          const segment = segments.shift();
          const encryptedSegmentSize = segment.encryptedSegmentSize || encryptedSegmentSizeDefault;
          const encryptedChunk = await zipReader.getPayloadSegment(
            centralDirectory,
            '0.payload',
            encryptedOffset,
            encryptedSegmentSize
          );
          encryptedOffset += encryptedSegmentSize;

          // use the segment alg type if provided, otherwise use the root sig alg
          const segmentIntegrityAlgorithmType =
            that.manifest.encryptionInformation.integrityInformation.segmentHashAlg;
          const segmentHashStr = await that.getSignature(
            reconstructedKeyBinary,
            Binary.fromBuffer(encryptedChunk),
            segmentIntegrityAlgorithmType || integrityAlgorithmType
          );

          if (segment.hash !== base64.encode(segmentHashStr)) {
            throw new ManifestIntegrityError('Failed integrity check on segment hash');
          }

          let decryptedSegment;

          try {
            decryptedSegment = await cipher.decrypt(encryptedChunk, reconstructedKeyBinary);
          } catch (e) {
            throw new TdfDecryptError(
              'Error decrypting payload. This suggests the key used to decrypt the payload is not correct.',
              e
            );
          }

          controller.enqueue(decryptedSegment.payload.asBuffer());
        }

        if (segments.length === 0) {
          controller.close();
        }
      }
    });

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

export default TDF;
