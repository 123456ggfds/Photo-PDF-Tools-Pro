export function bytesToBlobPart(bytes: Uint8Array<ArrayBufferLike>): BlobPart {
  if (bytes.buffer instanceof ArrayBuffer) {
    return bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  return new Uint8Array(bytes);
}
