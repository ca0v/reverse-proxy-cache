export function bufferToString(buffer: Array<number>) {
    return buffer.map(v => String.fromCharCode(v)).join("");
}
