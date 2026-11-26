import type { ToolDefinition } from '../types/tool';

async function readHeadBytes(file: File, length: number): Promise<Uint8Array> {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}

function startsWithBytes(data: Uint8Array, signature: number[]): boolean {
  if (data.length < signature.length) return false;
  return signature.every((byte, idx) => data[idx] === byte);
}

export async function validateFileForTool(
  file: File,
  tool: ToolDefinition,
): Promise<string | null> {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;

  if (!tool.acceptedExtensions.includes(ext)) {
    return `"${file.name}" has an unsupported format. Allowed: ${tool.acceptedExtensions.join(', ')}.`;
  }

  if (file.size === 0) {
    return `"${file.name}" appears to be empty or damaged (0 bytes).`;
  }

  const maxBytes = tool.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `"${file.name}" exceeds the ${tool.maxFileSizeMb} MB maximum file size limit.`;
  }

  try {
    const head = await readHeadBytes(file, 16);

    if (ext === '.pdf') {
      // %PDF-
      if (!startsWithBytes(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
        return `"${file.name}" does not have a valid PDF signature (%PDF-).`;
      }
    } else if (ext === '.docx') {
      // PK\x03\x04
      if (!startsWithBytes(head, [0x50, 0x4b, 0x03, 0x04])) {
        return `"${file.name}" does not have a valid DOCX archive signature.`;
      }
    } else if (ext === '.doc') {
      const isOle2 = startsWithBytes(
        head,
        [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
      );
      const isRtf = startsWithBytes(head, [0x7b, 0x5c, 0x72, 0x74, 0x66]);
      if (!isOle2 && !isRtf) {
        return `"${file.name}" does not have a valid DOC file signature.`;
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      if (!startsWithBytes(head, [0xff, 0xd8, 0xff])) {
        return `"${file.name}" does not have a valid JPEG image signature.`;
      }
    } else if (ext === '.png') {
      if (
        !startsWithBytes(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ) {
        return `"${file.name}" does not have a valid PNG image signature.`;
      }
    } else if (ext === '.webp') {
      // RIFF....WEBP
      const isRiff = startsWithBytes(head, [0x52, 0x49, 0x46, 0x46]);
      const isWebp =
        head.length >= 12 &&
        head[8] === 0x57 &&
        head[9] === 0x45 &&
        head[10] === 0x42 &&
        head[11] === 0x50;
      if (!isRiff || !isWebp) {
        return `"${file.name}" does not have a valid WebP image signature.`;
      }
    }
  } catch {
    return `Unable to read "${file.name}". The file may be damaged.`;
  }

  return null;
}
