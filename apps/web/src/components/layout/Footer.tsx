import { Link } from 'react-router-dom';
import { CATEGORY_META } from '@convyx/tool-contract';
import { getActiveCategories, getToolsByCategory, tools } from '@/tools/registry';
import { Logo } from './Logo';

export function Footer() {
  const categories = getActiveCategories();
  const local = tools.filter((tool) => tool.processing === 'client').length;

  return (
    <footer className="border-line border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(2,1fr)_1fr]">
        <div>
          <Logo />
          <p className="text-fg-muted mt-4 max-w-xs text-sm text-pretty">
            Free tools for PDFs and images. {local} of {tools.length} run entirely in your browser,
            so your files never leave your device.
          </p>
        </div>

        {categories.map((category) => (
          <nav key={category.id} aria-label={`${CATEGORY_META[category.id].label} tools`}>
            <h2 className="text-sm font-semibold">{CATEGORY_META[category.id].label}</h2>
            <ul className="mt-4 space-y-2">
              {getToolsByCategory(category.id)
                .slice(0, 6)
                .map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={`/tools/${tool.id}`}
                      className="text-fg-muted hover:text-fg text-sm transition-colors duration-150"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              <li>
                <Link
                  to={`/tools?category=${category.id}`}
                  className="text-brand text-sm font-medium hover:underline"
                >
                  All {category.count} →
                </Link>
              </li>
            </ul>
          </nav>
        ))}

        <nav aria-label="Convyx">
          <h2 className="text-sm font-semibold">Convyx</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                to="/tools"
                className="text-fg-muted hover:text-fg text-sm transition-colors duration-150"
              >
                All tools
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="text-fg-muted hover:text-fg text-sm transition-colors duration-150"
              >
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-line border-t">
        <div className="text-fg-subtle mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Convyx</span>
          <span>No accounts · No tracking · No stored files</span>
        </div>
      </div>
    </footer>
  );
}
