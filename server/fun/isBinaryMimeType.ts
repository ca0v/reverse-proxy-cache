export function isBinaryMimeType(mimeType: string) {
    return ["image/"].some(v => mimeType.startsWith(v));
}
