import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, FileStack, Menu, X } from 'lucide-react';
import { TOOLS } from '../../utils/toolsConfig';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setToolsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
  }, [location.pathname]);

  function handleSectionNav(sectionId: string) {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);

    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      target?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    navigate(`/#${sectionId}`);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
            <FileStack className="h-5 w-5" />
          </span>
          <span>
            Doc<span className="text-rose-600">Convertor</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            Home
          </NavLink>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setToolsDropdownOpen((prev) => !prev)}
              aria-expanded={toolsDropdownOpen}
              className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <span>Tools</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${
                  toolsDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {TOOLS.map((tool) => (
                  <NavLink
                    key={tool.id}
                    to={tool.route}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 transition-colors ${
                        isActive ? 'bg-rose-50' : 'hover:bg-slate-50'
                      }`
                    }
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {tool.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {tool.description}
                    </p>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSectionNav('about')}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            About
          </button>

          <button
            type="button"
            onClick={() => handleSectionNav('contact')}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Contact
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Home
            </NavLink>

            <div className="my-1 border-t border-slate-100 pt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tools
              </p>
              {TOOLS.map((tool) => (
                <NavLink
                  key={tool.id}
                  to={tool.route}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {tool.title}
                </NavLink>
              ))}
            </div>

            <div className="mt-1 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => handleSectionNav('about')}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => handleSectionNav('contact')}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Contact
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
