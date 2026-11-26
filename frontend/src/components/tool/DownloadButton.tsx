import { Download } from 'lucide-react';

interface DownloadButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'sm';
  onClick: () => void;
}

export function DownloadButton({
  label,
  variant = 'primary',
  size = 'md',
  onClick,
}: DownloadButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600';

  const variantStyles =
    variant === 'primary'
      ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  const sizeStyles =
    size === 'md' ? 'px-6 py-3 text-sm' : 'px-3.5 py-2 text-xs';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles}`}
    >
      <Download className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{label}</span>
    </button>
  );
}
