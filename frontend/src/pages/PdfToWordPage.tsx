import { ToolWorkspace } from '../components/tool/ToolWorkspace';
import { getToolById } from '../utils/toolsConfig';

export function PdfToWordPage() {
  return <ToolWorkspace tool={getToolById('pdf-to-word')} />;
}
