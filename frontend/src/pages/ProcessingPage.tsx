import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessingLoadingView } from '../components/tool/ProcessingLoadingView';
import { useBatchResult } from '../context/BatchResultContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { ToolId } from '../types/tool';
import { getToolById } from '../utils/toolsConfig';

interface ProcessingPageProps {
  toolId: ToolId;
}

export function ProcessingPage({ toolId }: ProcessingPageProps) {
  const tool = getToolById(toolId);
  useDocumentMeta({
    title: `Processing ${tool.title} — DocConvertor`,
    description: `Processing your ${tool.title} files on DocConvertor.`,
    noIndex: true,
  });

  const navigate = useNavigate();
  const { session, batchStatus, cancelBatchProcessing } = useBatchResult();

  const isSessionValid =
    session !== null &&
    session.toolId === toolId &&
    session.items.length > 0;

  useEffect(() => {
    if (!isSessionValid) {
      navigate(tool.route, { replace: true });
      return;
    }

    if (batchStatus === 'completed') {
      navigate(`${tool.route}/download`, { replace: true });
    }
  }, [batchStatus, isSessionValid, navigate, tool.route]);

  const items = isSessionValid ? session.items : [];

  const completedCount = useMemo(
    () => items.filter((item) => item.status === 'completed').length,
    [items],
  );
  const failedCount = useMemo(
    () => items.filter((item) => item.status === 'failed').length,
    [items],
  );
  const overallProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => {
      if (item.status === 'completed' || item.status === 'failed') {
        return sum + 100;
      }
      return sum + item.progress;
    }, 0);
    return Math.round(total / items.length);
  }, [items]);

  if (!isSessionValid) {
    return null;
  }

  return (
    <ProcessingLoadingView
      tool={tool}
      items={items}
      overallProgress={overallProgress}
      completedCount={completedCount}
      failedCount={failedCount}
      onCancel={() => {
        cancelBatchProcessing();
        navigate(tool.route, { replace: true });
      }}
    />
  );
}
