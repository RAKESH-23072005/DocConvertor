import { Link } from 'react-router-dom';
import { FileStack, Mail, ShieldCheck } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { TOOLS } from '../../utils/toolsConfig';

export function Footer() {
  const { status } = useHealthCheck();

  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base font-bold text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
                <FileStack className="h-4 w-4" />
              </span>
              <span>
                Doc<span className="text-rose-600">Convertor</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Simple, fast, and focused document conversion and compression tools
              with zero clutter.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === 'online'
                    ? 'bg-emerald-500'
                    : status === 'loading'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                }`}
              />
              <span>
                Backend API:{' '}
                {status === 'online'
                  ? 'Connected'
                  : status === 'loading'
                    ? 'Checking...'
                    : 'Offline'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Tools
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {TOOLS.map((tool) => (
                <li key={tool.id}>
                  <Link
                    to={tool.route}
                    className="transition-colors hover:text-rose-600"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Company &amp; Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/about" className="transition-colors hover:text-rose-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-rose-600">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="transition-colors hover:text-rose-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-rose-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>&copy; {new Date().getFullYear()} DocConvertor. Isolated temporary processing.</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <a href="mailto:support@docconvertor.app" className="hover:text-slate-900">
              support@docconvertor.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
