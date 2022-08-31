import { v4 } from 'uuid';
import axios from 'axios';
import {
  ZipReader,
  inBrowser,
  fromBuffer,
  fromDataSource,
  streamToBuffer,
  Chunker,
} from '../utils';
import { base64 } from '../../../src/encodings';
import TDF from '../tdf';
import { PlaintextStream } from './tdf-stream';
import { OIDCClientCredentialsProvider } from '../../../src/auth/oidc-clientcredentials-provider';
import { OIDCRefreshTokenProvider } from '../../../src/auth/oidc-refreshtoken-provider';
import { OIDCExternalJwtProvider } from '../../../src/auth/oidc-externaljwt-provider';
import { PemKeyPair } from '../crypto/declarations';
import { AuthProvider } from '../../../src/auth/auth';
import { EncryptParams, DecryptParams } from './builders';

import {
  DEFAULT_SEGMENT_SIZE,
  DecryptParamsBuilder,
  EncryptParamsBuilder,
  DecryptSource,
} from './builders';
import { Policy } from '../models';

const GLOBAL_BYTE_LIMIT = 64 * 1000 * 1000 * 1000; // 64 GB, see WS-9363.
const HTML_BYTE_LIMIT = 100 * 1000 * 1000; // 100 MB, see WS-9476.

// No default config for now. Delegate to Virtru wrapper for endpoints.
const defaultClientConfig = { oidcOrigin: '' };

// @ts-ignore Declared but its value is never read.
const uploadBinaryToS3 = async function (
  stream: ReadableStream,
  uploadUrl: string,
  fileSize: number
) {
  try {
    const body: Buffer | ReadableStream = inBrowser() ? await streamToBuffer(stream) : stream;

    await axios.put(uploadUrl, body, {
      headers: {
        'Content-Length': fileSize,
        'content-type': 'application/zip',
        'cache-control': 'no-store',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const getFirstTwoBytes = async (chunker: Chunker) => new TextDecoder().decode(await chunker(0, 2));

const makeChunkable = async (source: DecryptSource) => {
  if (!source) {
    throw new Error('Invalid source');
  }
  // dump stream to buffer
  // we don't support streams anyways (see zipreader.js)
  let initialChunker: Chunker;
  let buf = null;
  if (source.type === 'stream') {
    buf = await streamToBuffer(source.location);
    initialChunker = fromBuffer(buf);
  } else if (source.type === 'buffer') {
    buf = source.location;
    initialChunker = fromBuffer(buf);
  } else {
    initialChunker = await fromDataSource(source);
  }

  const magic: string = await getFirstTwoBytes(initialChunker);
  // Pull first two bytes from source.
  if (magic === 'PK') {
    return initialChunker;
  }
  // Unwrap if it's html.
  // If NOT zip (html), convert/dump to buffer, unwrap, and continue.
  const htmlBuf = buf || (await initialChunker());
  const zipBuf = TDF.unwrapHtml(htmlBuf);
  return fromBuffer(zipBuf);
};

interface ClientConfig {
  keypair?: PemKeyPair;
  organizationName?: string;
  clientId?: string;
  kasEndpoint?: string;
  keyRewrapEndpoint?: string;
  keyUpsertEndpoint?: string;
  clientSecret?: string;
  oidcRefreshToken?: string;
  kasPublicKey?: string;
  oidcOrigin?: string;
  externalJwt?: string;
  authProvider?: AuthProvider;
  readerUrl?: string;
}

export class Client {
  clientConfig: ClientConfig;
  /**
   * An abstraction for protecting and accessing data using TDF3 services.
   * @param {Object} config - configuration parameters
   * @param {Object} [config.keypair] - keypair generated for signing. Optional, will be generated by sdk if not passed
   * @param {String} [config.clientId]
   * @param {String} [config.kasEndpoint] - Key Access Server url
   * @param {String} [config.clientSecret] - Should be added ONLY for Node build
   * @param {String} [config.oidcRefreshToken] - After logging in to browser OIDC interface user
   * receives fresh token that needed by SDK for auth needs
   * @param {String} [config.externalJwt] - JWT from external authority (eg Google)
   * @param {String} [config.oidcOrigin] - Endpoint of authentication service
   */
  constructor(config: ClientConfig) {
    const clientConfig = { ...defaultClientConfig, ...config };

    const pubKey = clientConfig?.keypair?.publicKey;

    if (!clientConfig.clientId) {
      throw new Error('Client ID must be provided to constructor');
    }

    if (!clientConfig.kasEndpoint) {
      if (!clientConfig.keyRewrapEndpoint) {
        throw new Error('KAS definition not found');
      } else {
        clientConfig.kasEndpoint = clientConfig.keyRewrapEndpoint.replace(/\/rewrap$/, '');
      }
    } else {
      if (!clientConfig.keyRewrapEndpoint) {
        clientConfig.keyRewrapEndpoint = `${clientConfig.kasEndpoint}/v2/rewrap`;
      }
      if (!clientConfig.keyUpsertEndpoint) {
        clientConfig.keyUpsertEndpoint = `${clientConfig.kasEndpoint}/v2/upsert`;
      }
    }

    if (inBrowser()) {
      //If you're in a browser and passing client secrets, you're Doing It Wrong.
      if (clientConfig.clientSecret) {
        throw new Error('Client credentials not supported in a browser context');
      }
      //Are we exchanging a refreshToken for a bearer token (normal AuthCode browser auth flow)?
      //If this is a browser context, we expect the caller to handle the initial
      //browser-based OIDC login and authentication process against the OIDC endpoint using their chosen method,
      //and provide us with a valid refresh token/clientId obtained from that process.
      if (clientConfig.oidcRefreshToken) {
        clientConfig.authProvider = new OIDCRefreshTokenProvider({
          clientPubKey: pubKey,
          clientId: clientConfig.clientId,
          externalRefreshToken: clientConfig.oidcRefreshToken,
          oidcOrigin: clientConfig.oidcOrigin,
        });
      } else if (clientConfig.externalJwt) {
        //Are we exchanging a JWT previously issued by a trusted external entity (e.g. Google) for a bearer token?
        clientConfig.authProvider = new OIDCExternalJwtProvider({
          clientPubKey: pubKey,
          clientId: clientConfig.clientId,
          externalJwt: clientConfig.externalJwt,
          oidcOrigin: clientConfig.oidcOrigin,
        });
      }
    } else {
      //If you're NOT in a browser and are NOT passing client secrets, you're Doing It Wrong.
      //If this is not a browser context, we expect the caller to supply their client ID and client secret, so that
      // we can authenticate them directly with the OIDC endpoint.
      if (!clientConfig.clientSecret) {
        throw new Error(
          'If using client credentials, must supply both client ID and client secret to constructor'
        );
      }
      clientConfig.authProvider = new OIDCClientCredentialsProvider({
        clientPubKey: pubKey,
        clientId: clientConfig.clientId,
        clientSecret: clientConfig.clientSecret,
        oidcOrigin: clientConfig.oidcOrigin,
      });
    }

    this.clientConfig = clientConfig;
  }

  /**
   * Encrypt plaintext into TDF ciphertext. One of the core operations of the Virtru SDK.
   *
   * @param {object} scope - dissem and attributes for constructing the policy
   * @param {object} source - nodeJS source object of unencrypted data
   * @param {boolean} [asHtml] - If we should wrap the TDF data in a self-opening HTML wrapper
   * @param {object} [metadata] - additional non-secret data to store with the TDF
   * @param {object} [opts] - object containing keypair
   * @param {string} [mimeType] - mime type of source
   * @param {boolean} [offline] - Where to store the policy
   * @param {object} [output] - output stream. Created and returned if not passed in
   * @param {object} [rcaSource] - RCA source information
   * @param {number} [windowSize] - segment size in bytes
   * @return {PlaintextStream} - a {@link https://nodejs.org/api/stream.html#stream_class_stream_readable|Readable} stream containing the TDF ciphertext.
   * @see EncryptParamsBuilder
   */
  async encrypt({
    scope,
    source,
    asHtml = false,
    metadata = null,
    opts,
    mimeType,
    offline = false,
    output,
    rcaSource = false,
    windowSize = DEFAULT_SEGMENT_SIZE,
  }: EncryptParams) {
    if (rcaSource && asHtml) throw new Error('rca links should be used only with zip format');

    const keypair: PemKeyPair = await this._getOrCreateKeypair(opts);
    const policyObject = await this._createPolicyObject(scope);
    const kasPublicKey = await this._getOrFetchKasPubKey();

    // TODO: Refactor underlying builder to remove some of this unnecessary config.

    const tdf = TDF.create()
      .setPrivateKey(keypair.privateKey)
      .setPublicKey(keypair.publicKey)
      .setEncryption({
        type: 'split',
        cipher: 'aes-256-gcm',
      })
      .addKeyAccess({
        type: offline ? 'wrapped' : 'remote',
        url: this.clientConfig.kasEndpoint,
        publicKey: kasPublicKey,
        metadata,
      })
      .setDefaultSegmentSize(windowSize)
      // set root sig and segment types
      .setIntegrityAlgorithm('hs256', 'gmac')
      .addContentStream(source, mimeType)
      .setPolicy(policyObject)
      .setAuthProvider(this.clientConfig.authProvider);

    const byteLimit = asHtml ? HTML_BYTE_LIMIT : GLOBAL_BYTE_LIMIT;
    const stream = await tdf.writeStream(byteLimit, rcaSource);
    // Looks like invalid calls | stream.upsertResponse equals empty array?
    // if (rcaSource) {
    //   const url = stream.upsertResponse[0][0].storageLinks.payload.upload;
    //   await uploadBinaryToS3(stream.stream, url, stream.tdfSize);
    // }
    if (!asHtml) {
      return stream;
    }

    // Wrap if it's html.
    // FIXME: Support streaming for html format.
    if (!tdf.manifest) {
      throw new Error('Missing manifest in encrypt function');
    }
    const htmlBuf = TDF.wrapHtml(
      await stream.toBuffer(),
      tdf.manifest,
      this.clientConfig.readerUrl || ''
    );

    if (output) {
      output.push(htmlBuf);
      output.push(null);
      return output;
    }

    return new PlaintextStream(windowSize, {
      pull(controller: ReadableStreamDefaultController) {
        controller.enqueue(htmlBuf);
        controller.close();
      },
    });
  }

  /**
   * Decrypt TDF ciphertext into plaintext. One of the core operations of the Virtru SDK.
   *
   * @param {object} - Required. All parameters for the decrypt operation, generated using {@link DecryptParamsBuilder#build|DecryptParamsBuilder's build()}.
   * @param {object} source - A data stream object, one of remote, stream, buffer, etc. types.
   * @param {object} opts - object with keypair
   * @param {object} [output] - A node Writeable; if not found will create and return one.
   * @param {object} [rcaSource] - RCA source information
   * @return {PlaintextStream} - a {@link https://nodejs.org/api/stream.html#stream_class_stream_readable|Readable} stream containing the decrypted plaintext.
   * @see DecryptParamsBuilder
   */
  async decrypt({ source, opts, rcaSource }: DecryptParams) {
    const keypair = await this._getOrCreateKeypair(opts);
    const tdf = TDF.create()
      .setPrivateKey(keypair.privateKey)
      .setPublicKey(keypair.publicKey)
      .setAuthProvider(this.clientConfig.authProvider);
    const chunker = await makeChunkable(source);

    // Await in order to catch any errors from this call.
    // TODO: Write error event to stream and don't await.
    return await tdf.readStream(chunker, rcaSource);
  }

  /**
   * Get the unique policyId associated with TDF ciphertext. Useful for managing authorization policies of encrypted data.
   * <br/><br/>
   * The policyId is embedded in the ciphertext so this is a local operation.
   *
   * @param {object} source - Required. TDF data stream,
   * generated using {@link DecryptParamsBuilder#build|DecryptParamsBuilder's build()}.
   * @return {string} - the unique policyId, which can be used for tracking purposes or policy management operations.
   * @see DecryptParamsBuilder
   */
  async getPolicyId({ source }: any) {
    const chunker = await makeChunkable(source);
    const zipHelper = new ZipReader(chunker);
    const centralDirectory = await zipHelper.getCentralDirectory();
    const manifest = await zipHelper.getManifest(centralDirectory, '0.manifest.json');
    const policyJson = base64.decode(manifest.encryptionInformation.policy);
    return JSON.parse(policyJson).uuid;
  }

  /*
   * Create a policy object for an encrypt operation.
   */
  async _createPolicyObject(scope: EncryptParams['scope']): Promise<Policy> {
    if (scope.policyObject) {
      // use the client override if provided
      return scope.policyObject;
    }
    const policyId = scope.policyId || v4();
    return {
      uuid: policyId,
      body: {
        dataAttributes: scope.attributes,
        dissem: scope.dissem,
      },
    };
  }

  /*
   * Extract a keypair provided as part of the options dict.
   * Default to using the clientwide keypair, generating one if necessary.
   *
   * Additionally, update the auth injector with the (potentially new) pubkey
   */
  async _getOrCreateKeypair(opts: undefined | { keypair: PemKeyPair }): Promise<PemKeyPair> {
    //If clientconfig has keypair, assume auth provider was already set up with pubkey and bail
    if (this.clientConfig.keypair) {
      return this.clientConfig.keypair;
    }

    //If a keypair is being dynamically provided, then we've gotta (re)register
    // the pubkey with the auth provider
    let keypair: PemKeyPair;
    if (opts) {
      keypair = opts.keypair;
    } else {
      //We have to generate and store a new keypair
      keypair = await TDF.generateKeyPair();
      this.clientConfig.keypair = keypair;
    }

    // This will contact the auth server and forcibly refresh the auth token claims,
    // binding the token and the (new) pubkey together.
    // Note that we base64 encode the PEM string here as a quick workaround, simply because
    // a formatted raw PEM string isn't a valid header value and sending it raw makes keycloak's
    // header parser barf. There are more subtle ways to solve this, but this works for now.

    await this.clientConfig?.authProvider?.updateClientPublicKey(base64.encode(keypair.publicKey));
    return keypair;
  }

  /*
   * If we have KAS url but not public key we can fetch it from KAS
   */
  async _getOrFetchKasPubKey() {
    //If clientconfig has keypair, assume auth provider was already set up with pubkey and bail
    if (this.clientConfig.kasPublicKey) {
      return this.clientConfig.kasPublicKey;
    }

    if (this.clientConfig.kasEndpoint) {
      try {
        this.clientConfig.kasPublicKey = await TDF.getPublicKeyFromKeyAccessServer(
          this.clientConfig.kasEndpoint
        );
      } catch (e) {
        console.error('Retrieving KAS public key has failed');
        throw new Error(e.message);
      }

      return this.clientConfig.kasPublicKey;
    }

    throw new Error('KAS definition not found');
  }
}

export default {
  Client,
  DecryptParamsBuilder,
  EncryptParamsBuilder,
};