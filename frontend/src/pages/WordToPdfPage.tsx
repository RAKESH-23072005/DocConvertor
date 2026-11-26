import { ToolWorkspace } from '../components/tool/ToolWorkspace';
import { getToolById } from '../utils/toolsConfig';

export function WordToPdfPage() {
  return <ToolWorkspace tool={getToolById('word-to-pdf')} />;
}
