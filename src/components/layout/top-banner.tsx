import Link from "next/link";

export function TopBanner() {
  return (
    <div className="relative z-20 border-b border-white/10 bg-[#451DB3] backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2 text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-sm font-medium">Over 1,000 books published</span>
        </div>
        <div className="hidden items-center gap-6 text-sm text-white md:flex">
          <Link
            href="/publish"
            className="rounded-full px-6 py-2 font-semibold text-white transition hover:text-purple-200"
          >
            Publish Your Book
          </Link>
        </div>
      </div>
    </div>
  );
}
