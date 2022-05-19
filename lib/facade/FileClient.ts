import { Client as ClientTdf3 } from '../tdf3/src/client';
import { DecryptParamsBuilder, EncryptParamsBuilder } from '../tdf3/src/client/builders';
import { TDFCiphertextStream } from '../tdf3/src/client/tdf-cipher-text-stream';
import { PlaintextStream } from '../tdf3/src/client/tdf-stream';

interface FileClientConfig {
  clientId: string;
  organizationName: string;
  oidcOrigin: string;
  kasEndpoint: string;
  clientSecret?: string;
  oidcRefreshToken?: string;
}

export class FileClient {
  private client: ClientTdf3;

  constructor({
    clientId,
    clientSecret,
    oidcRefreshToken,
    organizationName,
    oidcOrigin,
    kasEndpoint,
  }: FileClientConfig) {
    this.client = new ClientTdf3({
      clientId,
      organizationName,
      clientSecret,
      oidcRefreshToken,
      kasEndpoint,
      virtruOIDCEndpoint: oidcOrigin,
    });
  }

  private static setSource(
    source: ReadableStream | TDFCiphertextStream | Buffer | string | ArrayBuffer,
    params: EncryptParamsBuilder | DecryptParamsBuilder
  ) {
    // @ts-ignore
    if (source.pipe !== undefined) {
      // @ts-ignore
      params.setStreamSource(source);
    }
    if (Buffer && Buffer.isBuffer(source)) {
      params.setBufferSource(source);
    }
    if (typeof source === 'string') {
      // there is not point to used tdf3.js withStringSource, after merging we have nanoTdf for that
      params.setFileSource(source);
    }
    if (source instanceof ArrayBuffer) {
      params.setArrayBufferSource(source);
    }
    return params.build();
  }

  async encrypt(
    source: ReadableStream | Buffer | string | ArrayBuffer = '',
    users: string[] = [],
    params?: any
  ): Promise<TDFCiphertextStream> {
    const encryptParams = new EncryptParamsBuilder().withOffline().withUsersWithAccess(users);

    if (params) {
      return await this.client.encrypt(params);
    }
    // @ts-ignore
    return await this.client.encrypt(FileClient.setSource(source, encryptParams));
  }

  async decrypt(
    source: ReadableStream | Buffer | string | ArrayBuffer = '',
    params?: any
  ): Promise<PlaintextStream> {
    const decryptParams = new DecryptParamsBuilder();

    if (params) {
      return await this.client.decrypt(params);
    }
    // @ts-ignore
    return await this.client.decrypt(FileClient.setSource(source, decryptParams));
  }
}
