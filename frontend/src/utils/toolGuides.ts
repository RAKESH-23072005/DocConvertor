import type { ToolId } from '../types/tool';

export interface ToolGuideContent {
  steps: string[];
  faqs: { question: string; answer: string }[];
}

export const TOOL_GUIDES: Record<ToolId, ToolGuideContent> = {
  'pdf-to-word': {
    steps: [
      'Drag and drop one or more PDF files (up to 25 MB each) into the upload area.',
      'Review the uploaded PDF thumbnails and queue, then click Convert All to Word.',
      'Download individual DOCX files or package all converted documents into a single ZIP.',
    ],
    faqs: [
      {
        question: 'Can I convert scanned image-only PDFs to Word?',
        answer:
          'No. OCR for scanned image-only PDFs is not currently supported. Text-based PDFs convert directly into editable DOCX documents.',
      },
      {
        question: 'Will complex multi-column PDF layouts stay identical?',
        answer:
          'Standard text, paragraphs, tables, and embedded images are preserved well, though complex multi-column layouts may require minor adjustments in Word.',
      },
    ],
  },
  'word-to-pdf': {
    steps: [
      'Upload one or more DOC or DOCX files (up to 25 MB each).',
      'Click Convert All to PDF to process up to two documents simultaneously via LibreOffice.',
      'Download your converted PDFs individually or as a ZIP archive.',
    ],
    faqs: [
      {
        question: 'Which Word formats are supported?',
        answer:
          'DocConvertor supports both modern Word (.docx) and legacy Word (.doc) documents.',
      },
      {
        question: 'Are my Word files stored after conversion?',
        answer:
          'No. Each document is processed in an isolated temporary directory that is deleted immediately after conversion.',
      },
    ],
  },
  'compress-pdf': {
    steps: [
      'Upload one or more PDF files (up to 25 MB each) into the workspace.',
      'Choose Recommended, High, or Maximum compression depending on your quality needs.',
      'Click Compress All and compare original vs. compressed sizes on the results page.',
    ],
    faqs: [
      {
        question: 'What happens if a PDF is already well-optimized?',
        answer:
          'If compression would make the file larger, DocConvertor preserves your smaller original PDF and reports 0% saved rather than inflating the file.',
      },
      {
        question: 'Which compression level should I choose?',
        answer:
          'Recommended provides the best balance between readability and size reduction; High and Maximum apply stronger image downsampling.',
      },
    ],
  },
  'compress-image': {
    steps: [
      'Select or drop JPG, JPEG, PNG, or WebP images (up to 25 MB each).',
      'Adjust the quality slider (default 75%) and click Compress All.',
      'Compare original vs. compressed previews with the slider and download individually or as a ZIP.',
    ],
    faqs: [
      {
        question: 'Are my images uploaded to a server?',
        answer:
          'No. Image compression runs locally in your browser using the HTML Canvas API, so your images never leave your device.',
      },
      {
        question: 'Does PNG compression preserve transparency?',
        answer:
          'Yes. PNG files preserve their alpha transparency and are never silently converted to JPEG.',
      },
    ],
  },
};
