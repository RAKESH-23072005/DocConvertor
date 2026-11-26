import JSZip from 'jszip';
import type { BatchFileItem } from '../types/tool';

/**
 * Generates a unique filename within a ZIP archive so duplicate names
 * (e.g. two files named "report.pdf") never overwrite each other.
 */
export function getUniqueFileName(
  desiredName: string,
  usedNames: Set<string>,
): string {
  if (!usedNames.has(desiredName)) {
    usedNames.add(desiredName);
    return desiredName;
  }

  const dotIndex = desiredName.lastIndexOf('.');
  const base = dotIndex > 0 ? desiredName.slice(0, dotIndex) : desiredName;
  const ext = dotIndex > 0 ? desiredName.slice(dotIndex) : '';

  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }

  usedNames.add(candidate);
  return candidate;
}

/**
 * Triggers a browser download for a Blob and revokes the object URL cleanly.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Packages completed items into a downloadable ZIP archive.
 * Prevents empty ZIP downloads and handles duplicate filenames safely.
 */
export async function downloadBatchAsZip(
  completedItems: BatchFileItem[],
  zipFileName: string,
): Promise<{
  fileCount: number;
  archivedNames: string[];
}> {
  const validItems = completedItems.filter(
    (item) => item.status === 'completed' && item.result?.blob,
  );

  if (validItems.length === 0) {
    throw new Error('No completed files are available to package into a ZIP.');
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  const archivedNames: string[] = [];

  for (const item of validItems) {
    const result = item.result!;
    const uniqueName = getUniqueFileName(result.outputFileName, usedNames);
    archivedNames.push(uniqueName);
    zip.file(uniqueName, result.blob!);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipFileName);

  return { fileCount: archivedNames.length, archivedNames };
}
