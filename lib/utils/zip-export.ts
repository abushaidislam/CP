// Zero-dependency PKWARE ZIP archive builder (STORE method, UTF-8 filenames, IEEE 802.3 CRC32)

export interface ZipEntryInput {
  name: string;
  content: string;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

export function createZipBytes(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = toDosTimeDate(new Date());

  const prepared = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.name.replace(/^\/+/, ""));
    const dataBytes = encoder.encode(entry.content);
    const checksum = crc32(dataBytes);
    return {
      nameBytes,
      dataBytes,
      checksum,
      localHeaderOffset: 0,
    };
  });

  let localSectionSize = 0;
  let centralSectionSize = 0;

  for (const item of prepared) {
    item.localHeaderOffset = localSectionSize;
    localSectionSize += 30 + item.nameBytes.length + item.dataBytes.length;
    centralSectionSize += 46 + item.nameBytes.length;
  }

  const eocdSize = 22;
  const totalSize = localSectionSize + centralSectionSize + eocdSize;
  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);

  let offset = 0;

  // 1. Local file headers + file data
  for (const item of prepared) {
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true); // Version needed to extract (2.0)
    view.setUint16(offset + 6, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(offset + 8, 0, true); // Compression method (0 = STORE)
    view.setUint16(offset + 10, dosTime, true);
    view.setUint16(offset + 12, dosDate, true);
    view.setUint32(offset + 14, item.checksum, true);
    view.setUint32(offset + 18, item.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 22, item.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 26, item.nameBytes.length, true);
    view.setUint16(offset + 28, 0, true); // Extra field length
    offset += 30;

    output.set(item.nameBytes, offset);
    offset += item.nameBytes.length;

    output.set(item.dataBytes, offset);
    offset += item.dataBytes.length;
  }

  const centralDirStart = offset;

  // 2. Central directory file headers
  for (const item of prepared) {
    view.setUint32(offset, 0x02014b50, true); // Central directory signature
    view.setUint16(offset + 4, 20, true); // Version made by
    view.setUint16(offset + 6, 20, true); // Version needed to extract
    view.setUint16(offset + 8, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(offset + 10, 0, true); // Compression method (STORE)
    view.setUint16(offset + 12, dosTime, true);
    view.setUint16(offset + 14, dosDate, true);
    view.setUint32(offset + 16, item.checksum, true);
    view.setUint32(offset + 20, item.dataBytes.length, true);
    view.setUint32(offset + 24, item.dataBytes.length, true);
    view.setUint16(offset + 28, item.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true); // Extra field length
    view.setUint16(offset + 32, 0, true); // File comment length
    view.setUint16(offset + 34, 0, true); // Disk number start
    view.setUint16(offset + 36, 0, true); // Internal file attributes
    view.setUint32(offset + 38, 0, true); // External file attributes
    view.setUint32(offset + 42, item.localHeaderOffset, true);
    offset += 46;

    output.set(item.nameBytes, offset);
    offset += item.nameBytes.length;
  }

  const centralDirSize = offset - centralDirStart;

  // 3. End of central directory record
  view.setUint32(offset, 0x06054b50, true); // EOCD signature
  view.setUint16(offset + 4, 0, true); // Number of this disk
  view.setUint16(offset + 6, 0, true); // Disk where central directory starts
  view.setUint16(offset + 8, prepared.length, true); // Entries on this disk
  view.setUint16(offset + 10, prepared.length, true); // Total entries
  view.setUint32(offset + 12, centralDirSize, true);
  view.setUint32(offset + 16, centralDirStart, true);
  view.setUint16(offset + 20, 0, true); // ZIP file comment length

  return output;
}

export function createZipBlob(entries: ZipEntryInput[]): Blob {
  const bytes = createZipBytes(entries);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return new Blob([buffer], { type: "application/zip" });
}

export function toZipFilenameSlug(raw: string): string {
  return (
    raw
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "component"
  );
}

export function downloadComponentTsxZip(params: {
  slug: string;
  componentTsx: string;
  defaultTsx: string;
}): void {
  const safeSlug = toZipFilenameSlug(params.slug);
  const entries: ZipEntryInput[] = [
    { name: "component.tsx", content: params.componentTsx },
    { name: "default.tsx", content: params.defaultTsx },
  ];

  const blob = createZipBlob(entries);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeSlug}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
