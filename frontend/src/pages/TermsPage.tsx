import { Breadcrumb } from '../components/common/Breadcrumb';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function TermsPage() {
  useDocumentMeta({
    title: 'Terms of Service — DocConvertor',
    description:
      'Terms of Service governing the use of DocConvertor online PDF, Word, and image utilities.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Terms of Service' }]} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Last updated: November 2026
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="text-base font-semibold text-slate-900">
              1. Acceptable Use
            </h2>
            <p className="mt-1.5">
              You may use DocConvertor only for lawful document and image
              processing. You retain full ownership and responsibility for all
              files you upload or process.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              2. Service Limits &amp; Availability
            </h2>
            <p className="mt-1.5">
              Individual files are subject to a 25 MB upload limit and
              server-side conversion timeouts. Because files are temporary and
              not stored, you should keep local backups of important documents.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              3. Disclaimer
            </h2>
            <p className="mt-1.5">
              DocConvertor is provided &ldquo;as is&rdquo; without warranties of
              uninterrupted availability or exact layout preservation across
              complex document formats.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
