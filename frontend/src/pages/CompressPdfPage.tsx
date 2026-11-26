import { ToolWorkspace } from '../components/tool/ToolWorkspace';
import { getToolById } from '../utils/toolsConfig';

export function CompressPdfPage() {
  return <ToolWorkspace tool={getToolById('compress-pdf')} />;
}
