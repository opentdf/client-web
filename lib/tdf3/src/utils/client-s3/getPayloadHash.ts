import { ChecksumConstructor, HashConstructor, HttpRequest } from "@aws-sdk/types";
import { toHex } from "./hexCoding.js";
import { toUint8Array } from "./utils.js";

import { SHA256_HEADER, UNSIGNED_PAYLOAD } from "./constants.js";

export const isArrayBuffer = (arg: any): arg is ArrayBuffer =>
  (typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer) ||
  Object.prototype.toString.call(arg) === "[object ArrayBuffer]";

/**
 * @private
 */
export const getPayloadHash = async (
  { headers, body }: HttpRequest,
  hashConstructor: ChecksumConstructor | HashConstructor
): Promise<string> => {
  for (const headerName of Object.keys(headers)) {
    if (headerName.toLowerCase() === SHA256_HEADER) {
      return headers[headerName];
    }
  }

  if (body == undefined) {
    return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  } else if (typeof body === "string" || ArrayBuffer.isView(body) || isArrayBuffer(body)) {
    const hashCtor = new hashConstructor();
    hashCtor.update(toUint8Array(body));
    return toHex(await hashCtor.digest());
  }

  // As any defined body that is not a string or binary data is a stream, this
  // body is unsignable. Attempt to send the request with an unsigned payload,
  // which may or may not be accepted by the service.
  return UNSIGNED_PAYLOAD;
};