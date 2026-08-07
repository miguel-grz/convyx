import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { CATEGORY_META } from '@convyx/tool-contract';
import { getActiveCategories, getToolsByCategory } from '@/tools/registry';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Icon } from '@/components/ui/icon';
import { Logo } from './Logo';

/**
 * Categories and their contents come from the registry, so a new category
 * appears in the menu the moment its first tool folder exists.
 */
export function Header() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const categories = getActiveCategories();

  // A menu left open across a navigation covers the page you just asked for.
  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'bg-bg/80 sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300',
        scrolled ? 'border-line border-b' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Convyx home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {categories.map((category) => (
            <Dropdown
              key={category.id}
              label={CATEGORY_META[category.id].label}
              panelClassName="w-[30rem] p-2"
            >
              {(close) => (
                <>
                  <ul className="grid max-h-[24rem] grid-cols-2 gap-0.5 overflow-y-auto">
                    {getToolsByCategory(category.id).map((tool) => (
                      <li key={tool.id}>
                        <Link
                          to={`/tools/${tool.id}`}
                          onClick={close}
                          data-category={tool.category}
                          className="group hover:bg-bg-raised flex items-center gap-3 rounded-lg p-2.5"
                        >
                          <span className="cat-tint flex size-8 shrink-0 items-center justify-center rounded-md">
                            <Icon name={tool.icon} className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="group-hover:text-brand block truncate text-sm font-medium transition-colors duration-150">
                              {tool.name}
                            </span>
                          </span>
                          {tool.status === 'planned' && <Badge variant="outline">Soon</Badge>}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/tools?category=${category.id}`}
                    onClick={close}
                    className="text-brand border-line mt-1 block border-t px-3 py-2.5 text-sm font-medium"
                  >
                    All {category.count} {CATEGORY_META[category.id].label} tools →
                  </Link>
                </>
              )}
            </Dropdown>
          ))}

          {[
            { to: '/tools', label: 'All tools' },
            { to: '/privacy', label: 'Privacy' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'hover:text-fg rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive ? 'text-fg' : 'text-fg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>

          <Link to="/tools" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
            Browse tools
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-line bg-bg animate-[pop-in_180ms_ease-out] border-t lg:hidden"
        >
          <nav aria-label="Mobile" className="mx-auto max-w-6xl space-y-1 px-4 py-4 sm:px-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/tools?category=${category.id}`}
                data-category={category.id}
                className="hover:bg-bg-raised flex items-center gap-3 rounded-lg p-3"
              >
                <span className="cat-tint flex size-9 items-center justify-center rounded-lg">
                  <Icon name={CATEGORY_META[category.id].icon} />
                </span>
                <span className="flex-1 font-medium">{CATEGORY_META[category.id].label}</span>
                <Badge variant="neutral">{category.count}</Badge>
              </Link>
            ))}

            {[
              { to: '/tools', label: 'All tools' },
              { to: '/privacy', label: 'Privacy' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:bg-bg-raised block rounded-lg p-3 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
