import { Breadcrumb } from '../components/common/Breadcrumb';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function PrivacyPolicyPage() {
  useDocumentMeta({
    title: 'Privacy Policy — DocConvertor',
    description:
      'Learn how DocConvertor handles uploaded documents, browser-side image compression, temporary file deletion, and advertising cookies.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Last updated: November 2026
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="text-base font-semibold text-slate-900">
              1. Document &amp; File Handling
            </h2>
            <p className="mt-1.5">
              Files uploaded to PDF to Word, Word to PDF, or Compress PDF are
              processed in isolated temporary directories and deleted
              immediately after conversion or compression completes. We do not
              permanently store, index, or inspect user documents.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              2. Browser-Local Image Processing
            </h2>
            <p className="mt-1.5">
              Compress Image processes JPG, JPEG, PNG, and WebP files locally
              inside your web browser using the HTML Canvas API. Your images are
              not uploaded to our servers or third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              3. Advertising &amp; Cookies
            </h2>
            <p className="mt-1.5">
              When Google AdSense is enabled on DocConvertor, Google and its
              partners may use cookies or similar technologies to serve and
              measure advertisements in accordance with applicable privacy and
              consent regulations (including GDPR/EEA and CCPA notices where
              required).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              4. Contact
            </h2>
            <p className="mt-1.5">
              For privacy inquiries, contact us at{' '}
              <a
                href="mailto:support@docconvertor.app"
                className="font-medium text-rose-600 hover:underline"
              >
                support@docconvertor.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
