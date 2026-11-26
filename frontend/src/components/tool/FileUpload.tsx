import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import type { ToolDefinition } from '../../types/tool';

interface FileUploadProps {
  tool: ToolDefinition;
  compact?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({
  tool,
  compact = false,
  onFilesSelected,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      onFilesSelected(Array.from(fileList));
    }
    event.target.value = '';
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const dropped = event.dataTransfer.files;
    if (dropped && dropped.length > 0) {
      onFilesSelected(Array.from(dropped));
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed text-center transition-colors duration-150 ${
        isDragging
          ? 'border-rose-500 bg-rose-50/70'
          : 'border-slate-300 bg-white hover:border-slate-400'
      } ${compact ? 'px-6 py-6' : 'px-6 py-12 sm:px-10 sm:py-16'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={tool.acceptedMimeTypes}
        multiple={tool.multiple}
        onChange={handleFileChange}
        className="hidden"
        aria-label={tool.ctaLabel}
      />

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <UploadCloud className="h-7 w-7" />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 sm:text-base"
        >
          {tool.ctaLabel}
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        or drag and drop {tool.multiple ? 'your files' : 'your file'} here
      </p>
      <p className="mt-1.5 text-xs text-slate-500">
        Supported: {tool.supportedFormatsLabel}
      </p>
    </div>
  );
}
