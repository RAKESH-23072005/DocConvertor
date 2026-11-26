import type { BatchFileItem, ToolId } from '../../types/tool';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { FilePreviewPanel } from './FilePreviewPanel';
import { ImagePreview } from './ImagePreview';

interface DocumentPreviewProps {
  toolId: ToolId;
  items: BatchFileItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Renders image previews and before/after visual comparison exclusively
 * for the Compress Image tool. Document tools (PDF/Word) intentionally do
 * not render document previews.
 */
export function DocumentPreview({
  toolId,
  items,
  selectedId,
  onSelect,
}: DocumentPreviewProps) {
  if (toolId !== 'compress-image') return null;

  const activeItem = items.find((it) => it.id === selectedId) ?? items[0];
  if (!activeItem || !activeItem.previewUrl) return null;

  const isCompleted =
    activeItem.status === 'completed' &&
    Boolean(activeItem.result?.compressedPreviewUrl);

  return (
    <FilePreviewPanel
      items={items}
      selectedId={activeItem.id}
      onSelect={onSelect}
    >
      {isCompleted &&
      activeItem.result &&
      activeItem.result.compressedPreviewUrl ? (
        <BeforeAfterComparison
          originalUrl={activeItem.previewUrl}
          compressedUrl={activeItem.result.compressedPreviewUrl}
          fileName={activeItem.file.name}
          originalSize={activeItem.result.originalSize}
          compressedSize={activeItem.result.compressedSize}
          savedPercent={activeItem.result.savedPercent}
          isLargerThanOriginal={activeItem.result.isLargerThanOriginal}
          attemptedSize={activeItem.result.attemptedSize}
          sizeIncreasePercent={activeItem.result.sizeIncreasePercent}
          originalDimensions={activeItem.result.originalDimensions}
          compressedDimensions={activeItem.result.compressedDimensions}
        />
      ) : (
        <ImagePreview
          src={activeItem.previewUrl}
          alt={activeItem.file.name}
          title={activeItem.file.name}
          fileSize={activeItem.file.size}
        />
      )}
    </FilePreviewPanel>
  );
}
