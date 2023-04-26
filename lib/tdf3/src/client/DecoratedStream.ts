import {
  AbortMultipartUploadCommandOutput,
  CompleteMultipartUploadCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import { Buffer } from 'buffer';
import { EventEmitter } from 'eventemitter3';

import { VirtruS3Config, VirtruTempS3Credentials, VirtruCreds } from './builders.js';
import { Upload } from '../utils/aws-lib-storage/index.js';
import { Options } from '../utils/aws-lib-storage/types.js';
import { type Metadata } from '../tdf.js';
import { type Manifest, type UpsertResponse } from '../models/index.js';

export async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const accumulator = await new Response(stream).arrayBuffer();
  return Buffer.from(accumulator);
}

export type DecoratedReadableStreamSinkOptions = {
  encoding?: BufferEncoding;
  signal?: AbortSignal;
};

function isTransformer(param: any): param is Transformer{
  return !!param.transform;
}
function isUnderlyingSource(param: any): param is UnderlyingSource{
  return !!param.pull;
}

export abstract class DecoratedStream {
  KEK: null | string;
  algorithm: string;
  policyUuid?: string;
  tdfSize: number;
  fileSize: number | undefined;
  stream: TransformStream<Uint8Array> | ReadableStream<Uint8Array>;
  readable: ReadableStream<Uint8Array>;
  ee: EventEmitter;
  on: EventEmitter['on'];
  emit: EventEmitter['emit'];
  metadata?: Metadata;
  contentLength?: number;
  manifest: Manifest;
  upsertResponse?: UpsertResponse;

  constructor(param: Transformer | UnderlyingSource, highWaterMark: number = 1) {
    if (isTransformer(param)){
      this.stream = new TransformStream(param, { highWaterMark });
    } else if (isUnderlyingSource(param)){
      this.stream = new ReadableStream(param, { highWaterMark, }) as ReadableStream<Uint8Array>;
    }
    this.readable = this.stream instanceof TransformStream ? this.stream.readable : this.stream;
    this.ee = new EventEmitter();
    this.on = (...args) => this.ee.on(...args);
    this.emit = (...args) => this.ee.emit(...args);
  }

  /**
   *
   * Dump the stream content to remote storage. This will consume the stream.
   * @param {string} fileName - the name of the remote file to write TDF ciphertext to.
   * @param {S3ClientConfig} [config] - the object containing remote storage configuration.
   * <br>A detailed spec for the interface can be found [here]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html}
   * @param {string} [credentialURL] - the url to request remote storage credentials from.
   * @return {RemoteUploadResponse} - an object containing metadata for the uploaded file.
   */
  async toRemoteStore(
    fileName: string,
    config: VirtruS3Config,
    credentialURL: string
  ): Promise<CompleteMultipartUploadCommandOutput | AbortMultipartUploadCommandOutput> {
    // State
    const CONCURRENT_UPLOADS = 6;
    const MAX_UPLOAD_PART_SIZE = 1024 * 1024 * 5; // 5MB
    let storageParams: VirtruS3Config;
    let virtruTempS3Credentials: VirtruTempS3Credentials | undefined;

    // Param validation
    if (!config) {
      try {
        virtruTempS3Credentials = await axios.get(credentialURL);
      } catch (e) {
        console.error(e);
      }
    }

    // Build a storage config object from 'config' or 'virtruTempS3Credentials'
    if (virtruTempS3Credentials) {
      const credentials: VirtruCreds = {
        accessKeyId: virtruTempS3Credentials.data.fields.AWSAccessKeyId,
        secretAccessKey: virtruTempS3Credentials.data.fields.AWSSecretAccessKey,
        sessionToken: virtruTempS3Credentials.data.fields.AWSSessionToken,
      };

      storageParams = {
        credentials,
        region: virtruTempS3Credentials.data.url.split('.')[1],
        forcePathStyle: false,
        maxAttempts: 3,
        useAccelerateEndpoint: true,
      };
    } else {
      storageParams = config;
    }

    const BUCKET_NAME: string | undefined =
      config?.Bucket || virtruTempS3Credentials?.data?.bucket || undefined;

    const FILE_NAME = fileName || 'upload.tdf';

    const s3 = new S3Client(storageParams);

    // Managed Parallel Upload
    const uploadParams: Options['params'] = {
      Bucket: BUCKET_NAME,
      Key: FILE_NAME,
      Body: this.readable
    };

    try {
      const parallelUpload = new Upload({
        client: s3,
        queueSize: CONCURRENT_UPLOADS, // optional concurrency configuration
        partSize: MAX_UPLOAD_PART_SIZE, // optional size of each part, defaults to 5MB, cannot be smaller than 5MB
        leavePartsOnError: false, // optional manually handle dropped parts
        params: uploadParams,
      });

      parallelUpload.on('httpUploadProgress', (progress) => {
        this.emit('progress', progress);
      });

      return await parallelUpload.done();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async getMetadata() {
    return new Promise((resolve, reject) => {
      if (this.metadata) {
        resolve(this.metadata);
      } else {
        this.on('error', reject);
        this.on('rewrap', (rewrapResponse: Metadata) => {
          this.metadata = rewrapResponse;
          resolve(rewrapResponse);
        });
      }
    });
  }

  /**
   * Dump the stream content to a buffer. This will consume the stream.
   * @return the plaintext in Buffer form.
   */
  async toBuffer(): Promise<Buffer> {
    return streamToBuffer(this.readable);
  }

  /**
   * Dump the stream content to a string. This will consume the stream.
   * @return the plaintext in string form.
   */
  async toString(): Promise<string> {
    return new Response(this.readable).text();
  }

  /**
   * Dump the stream content to a local file. This will consume the stream.
   *
   * @param filepath The path of the local file to write plaintext to.
   * @param encoding The charset encoding to use. Defaults to utf-8.
   */
  abstract toFile(
    filepath: string,
    options?: BufferEncoding | DecoratedReadableStreamSinkOptions
  ): Promise<void>;
}