import { ToolWorkspace } from '../components/tool/ToolWorkspace';
import { getToolById } from '../utils/toolsConfig';

export function CompressImagePage() {
  return <ToolWorkspace tool={getToolById('compress-image')} />;
}
