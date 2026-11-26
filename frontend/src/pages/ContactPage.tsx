import { Mail } from 'lucide-react';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function ContactPage() {
  useDocumentMeta({
    title: 'Contact Us — DocConvertor',
    description:
      'Get in touch with the DocConvertor team for support, feedback, or privacy inquiries.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Contact Us' }]} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Contact Us
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Have feedback, bug reports, or privacy questions about DocConvertor?
          Reach out directly via email and we will respond as soon as possible.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Support Email</p>
            <a
              href="mailto:support@docconvertor.app"
              className="text-sm font-semibold text-slate-900 hover:text-rose-600"
            >
              support@docconvertor.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
