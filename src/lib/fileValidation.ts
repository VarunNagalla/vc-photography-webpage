// Lightweight magic-byte sniffing so we never trust a client-supplied
// MIME type or file extension. Only real image bytes are accepted.

export interface SniffResult {
  valid: boolean;
  ext: "jpg" | "png" | "webp" | "gif" | null;
  mime: string | null;
}

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB per photo, generous for high-res RAW exports/JPEGs

export function sniffImage(buffer: Buffer): SniffResult {
  if (buffer.length < 12) return { valid: false, ext: null, mime: null };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, ext: "png", mime: "image/png" };
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, ext: "gif", mime: "image/gif" };
  }

  // WEBP: "RIFF"....{"WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: "webp", mime: "image/webp" };
  }

  return { valid: false, ext: null, mime: null };
}

export function isWithinSizeLimit(size: number): boolean {
  return size > 0 && size <= MAX_FILE_BYTES;
}

export { MAX_FILE_BYTES };
