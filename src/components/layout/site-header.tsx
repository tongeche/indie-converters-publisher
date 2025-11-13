"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { GenresDropdown } from "./genres-dropdown";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { useCart } from "@/lib/cart/CartContext";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/authors", label: "Authors" },
  {
    label: "Books",
    href: "/books",
    sublinks: [
      { href: "/books", label: "Catalog" },
      { href: "/imprints", label: "Imprints" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    sublinks: [
      { label: "Cover Design", href: "/services/cover" },
      { label: "Illustration", href: "/services/illustration" },
      { label: "Typesetting", href: "/services/typesetting" },
      { label: "ISBN Registration", href: "/services/isbn" },
      { label: "ePub Conversion", href: "/services/epub" },
      { label: "Editing", href: "/services/editing" },
      { label: "Translation", href: "/services/translation" },
    ],
  },
  {
    label: "Blogs",
    href: "/blogs",
    sublinks: [
      { label: "Blog", href: "/blogs" },
      { label: "Newsroom", href: "/news" },
      { label: "Events", href: "/events" },
    ],
  },
];

const logoSrc = "/assets/branding/logo.png";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { cartCount } = useCart();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#3a1791]" style={{ backgroundColor: '#451DB3' }}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded-full shadow-lg shadow-purple-900/20 sm:h-16 sm:w-16" style={{ backgroundColor: '#451DB3' }}>
            <Image
              src={logoSrc}
              alt="IndieConverters logo"
              fill
              className="object-contain p-2 sm:p-3"
              priority
            />
          </div>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden flex-1 items-center justify-center max-w-3xl lg:flex">
          <SearchAutocomplete />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-white lg:flex">
          <GenresDropdown />
          {navLinks.map((link) =>
            link.sublinks ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenDropdown((current) =>
                      current === link.label ? null : link.label
                    );
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-white transition hover:bg-white/10 whitespace-nowrap"
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === link.label}
                >
                  {link.label}
                  <span aria-hidden className="text-xs text-white/60">⌄</span>
                </button>
                <div
                  className={`${
                    openDropdown === link.label
                      ? "visible opacity-100 translate-y-0"
                      : "invisible opacity-0 -translate-y-2"
                  } absolute left-0 top-full z-30 mt-2 min-w-[200px] rounded-2xl border border-white/15 bg-[#2d1274]/95 p-3 shadow-xl backdrop-blur transition`}
                >
                  <ul className="flex flex-col gap-1 text-sm">
                    {link.sublinks.map((sublink) => (
                      <li key={sublink.href}>
                        <Link
                          href={sublink.href}
                          className="block rounded-xl px-3 py-2 text-white transition hover:bg-white/10"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {sublink.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/submissions"
            className="rounded-full bg-white px-4 py-2 text-[#451DB3] font-semibold transition hover:bg-white/90 whitespace-nowrap"
          >
            Submissions
          </Link>
        </nav>

        {/* Cart & Mobile Menu Button */}
        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:inline-flex"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:inline-flex"
            >
              Log in
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-white hover:bg-white/10 transition"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-[#451DB3] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-full p-2 text-white hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {/* Mobile Search */}
            <div className="mb-4">
              <SearchAutocomplete />
            </div>

            {/* Mobile Genres - Simple Link */}
            <Link
              href="/catalog"
              className="block rounded-lg px-4 py-3 text-base font-medium text-white hover:bg-white/10 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Genres
            </Link>

            {session ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block rounded-full border border-white/30 px-4 py-3 text-base font-semibold text-white hover:bg-white/10 transition"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="block rounded-full border border-white/30 px-4 py-3 text-base font-semibold text-white hover:bg-white/10 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
            )}

            {/* Mobile Nav Links */}
            {navLinks.map((link) =>
              link.sublinks ? (
                <div key={link.label} className="rounded-xl border border-white/15">
                  <p className="px-4 py-3 text-base font-semibold text-white">
                    {link.label}
                  </p>
                  <div className="border-t border-white/10">
                    {link.sublinks.map((sublink) => (
                      <Link
                        key={sublink.href}
                        href={sublink.href}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {sublink.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-white hover:bg-white/10 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}

            {/* Mobile Submissions Button */}
            <Link
              href="/submissions"
              className="block rounded-full bg-white px-4 py-3 text-center text-base font-semibold text-[#451DB3] hover:bg-white/90 transition mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Submissions
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
