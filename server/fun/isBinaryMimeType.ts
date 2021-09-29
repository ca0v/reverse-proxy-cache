export function isBinaryMimeType(mimeType: string) {
    return ["image/", "binary/"].some((v) => mimeType.startsWith(v));
}
