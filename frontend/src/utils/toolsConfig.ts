import type { ToolDefinition, ToolId } from '../types/tool';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    shortTitle: 'PDF to Word',
    description: 'Convert PDF documents into editable Word files.',
    route: '/pdf-to-word',
    acceptedExtensions: ['.pdf'],
    acceptedMimeTypes: 'application/pdf,.pdf',
    supportedFormatsLabel: 'PDF (.pdf) up to 25 MB each — multiple files supported',
    maxFileSizeMb: 25,
    multiple: true,
    ctaLabel: 'Browse PDF files',
    actionLabel: 'Convert All to Word',
    accentColor: 'rose',
    layoutNote:
      'Note: Complex multi-column layouts may not convert with 100% fidelity, and OCR for scanned image-only PDFs is not currently supported.',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    shortTitle: 'Word to PDF',
    description: 'Turn Word documents into professional PDF files.',
    route: '/word-to-pdf',
    acceptedExtensions: ['.doc', '.docx'],
    acceptedMimeTypes:
      '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    supportedFormatsLabel:
      'Word (.doc, .docx) up to 25 MB each — multiple files supported',
    maxFileSizeMb: 25,
    multiple: true,
    ctaLabel: 'Browse Word files',
    actionLabel: 'Convert All to PDF',
    accentColor: 'blue',
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    shortTitle: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining readability.',
    route: '/compress-pdf',
    acceptedExtensions: ['.pdf'],
    acceptedMimeTypes: 'application/pdf,.pdf',
    supportedFormatsLabel: 'PDF (.pdf) up to 25 MB each — multiple files supported',
    maxFileSizeMb: 25,
    multiple: true,
    ctaLabel: 'Browse PDF files',
    actionLabel: 'Compress All',
    accentColor: 'emerald',
  },
  {
    id: 'compress-image',
    title: 'Compress Image',
    shortTitle: 'Compress Image',
    description: 'Optimize images without unnecessary quality loss.',
    route: '/compress-image',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    acceptedMimeTypes: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    supportedFormatsLabel:
      'JPG, JPEG, PNG, WebP up to 25 MB each — multiple files supported',
    maxFileSizeMb: 25,
    multiple: true,
    ctaLabel: 'Browse images',
    actionLabel: 'Compress All',
    accentColor: 'amber',
  },
];

export function getToolById(id: ToolId): ToolDefinition {
  const found = TOOLS.find((tool) => tool.id === id);
  if (!found) {
    throw new Error(`Unknown tool id: ${id}`);
  }
  return found;
}

export function getRelatedTools(currentId: ToolId): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.id !== currentId);
}
