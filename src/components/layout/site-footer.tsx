import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = [
  {
    heading: "Services",
    items: [
      { label: "Free Publishing Guide", href: "/guide" },
      { label: "Publish Your Book", href: "/publish" },
      { label: "Services", href: "/services" },
      { label: "Book-to-Screen", href: "/book-to-screen" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Referral Program", href: "/referral" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Resources", href: "/resources" },
      { label: "Bookstore", href: "/bookstore" },
      { label: "Sign up", href: "/signup" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full shadow-md" style={{ backgroundColor: '#451DB3' }}>
                <Image
                  src="/assets/branding/logo.png"
                  alt="IndieConverters logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-900">
                  IndieConverters
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-700">
              Stories, services, and support for modern indie authors.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <p className="text-sm font-bold text-zinc-900 mb-4">
                {section.heading}
              </p>
              <ul className="space-y-2.5 text-sm text-zinc-600">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition hover:text-zinc-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 text-xs text-zinc-600">
              <p>©{new Date().getFullYear()} Copyright IndieConverters</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy" className="transition hover:text-zinc-900">
                  Privacy Policy
                </Link>
                <span>·</span>
                <Link href="/accessibility" className="transition hover:text-zinc-900">
                  Accessibility Statement
                </Link>
                <span>·</span>
                <Link href="/do-not-sell" className="transition hover:text-zinc-900">
                  Do Not Sell My Info
                </Link>
                <span>·</span>
                <Link href="/california" className="transition hover:text-zinc-900">
                  CA Resident Only
                </Link>
              </div>
              <p>E-Commerce Powered by nopCommerce</p>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
