import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function AboutPage() {
  useDocumentMeta({
    title: 'About Us — DocConvertor',
    description:
      'Learn about DocConvertor, a focused, privacy-first web suite for PDF to Word, Word to PDF, PDF compression, and image optimization.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'About Us' }]} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          About DocConvertor
        </h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            DocConvertor is built to handle the four most essential everyday
            document and image tasks without clutter, forced sign-ups, or
            confusing workflows.
          </p>
          <p>
            PDF and Word conversions run on isolated temporary backend jobs using
            open, proven engines (pdf2docx, LibreOffice, Ghostscript, and
            pikepdf), while image compression executes directly inside your
            browser.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              Explore All Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
