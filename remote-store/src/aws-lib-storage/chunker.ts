import { getChunkBuffer } from './chunks/getChunkBuffer.js';
import { getChunkStream } from './chunks/getChunkStream.js';
import { getDataReadable } from './chunks/getDataReadable.js';
import { getDataReadableStream } from './chunks/getDataReadableStream.js';
import { BodyDataTypes } from './types.js';

export const getChunk = (data: BodyDataTypes, partSize: number) => {
  if (Object.prototype.hasOwnProperty.call(data, 'pipe')) {
    return getChunkStream<BodyDataTypes>(data, partSize, getDataReadable);
  } else if (data instanceof String || typeof data === 'string') {
    // chunk Strings, Uint8Array.
    return getChunkBuffer(new TextEncoder().encode(data as string), partSize);
  } else if (data instanceof Uint8Array) {
    return getChunkBuffer(data, partSize);
  }
  if (typeof (data as { stream: unknown }).stream === 'function') {
    // approximate support for Blobs.
    const streamable: Blob = data as Blob;
    return getChunkStream<ReadableStream>(streamable.stream(), partSize, getDataReadableStream);
  } else if (data instanceof ReadableStream) {
    return getChunkStream<ReadableStream>(data as ReadableStream, partSize, getDataReadableStream);
  } else {
    throw new Error(
      'Body Data is unsupported format, expected data to be one of: string | Uint8Array | Buffer | Readable | ReadableStream | Blob;.'
    );
  }
};
