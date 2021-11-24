import { binaryMimeTypes } from "../config/mimeTypes.js";

export function isBinaryMimeType(mimeType: string) {
  return binaryMimeTypes.some((v) => mimeType.startsWith(v));
}
