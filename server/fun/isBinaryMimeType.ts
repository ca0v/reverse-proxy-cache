export function isBinaryMimeType(mimeType: string) {
  return ["image/", "binary/", "application/x-protobuf"].some((v) =>
    mimeType.startsWith(v)
  );
}
