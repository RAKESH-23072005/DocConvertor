import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({
    title: 'Page Not Found — DocConvertor',
    description: 'The requested page does not exist on DocConvertor.',
    noIndex: true,
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">
        The route you requested does not exist in DocConvertor.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
      >
        Return Home
      </Link>
    </div>
  );
}
