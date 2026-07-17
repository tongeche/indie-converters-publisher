// Automated internal linking for blog posts — SEO-motivated: the first time a
// post mentions a topic that another real post or platform page already
// covers, that mention becomes a link. Grounded in phrases that actually
// occur in the published posts (checked against real body content), not
// speculative keywords. Order matters: more specific phrases first, so a
// longer match isn't pre-empted by a shorter one later in the list.
//
// `selfSlug`, when set, is the post this entry links to — skipped when the
// current post IS that post, so an article never links to itself.
export const BLOG_AUTO_LINKS = [
  { pattern: /sell(ing)? in all( your)? channels/i, url: '/blog/sell-books-all-author-channels', selfSlug: 'sell-books-all-author-channels' },
  { pattern: /prepare your book/i, url: '/blog/how-to-prepare-your-book-before-uploading', selfSlug: 'how-to-prepare-your-book-before-uploading' },
  { pattern: /book formats?/i, url: '/blog/understanding-book-formats-on-indieconverters', selfSlug: 'understanding-book-formats-on-indieconverters' },
  { pattern: /book metadata/i, url: '/blog/book-metadata-101-indie-authors', selfSlug: 'book-metadata-101-indie-authors' },
  { pattern: /quote cards?/i, url: '/blog/book-quotes-author-marketing-assets', selfSlug: 'book-quotes-author-marketing-assets' },
  { pattern: /marketing assets?/i, url: '/blog/book-quotes-author-marketing-assets', selfSlug: 'book-quotes-author-marketing-assets' },
  { pattern: /accessibility/i, url: '/blog/epub-accessibility-indie-authors-2026', selfSlug: 'epub-accessibility-indie-authors-2026' },
  { pattern: /\bWCAG\b/, url: '/blog/epub-accessibility-indie-authors-2026', selfSlug: 'epub-accessibility-indie-authors-2026' },
  { pattern: /\bEPUB\b/, url: '/blog/convert-manuscript-clean-epub', selfSlug: 'convert-manuscript-clean-epub' },
  { pattern: /catalogue page/i, url: '/browse' },
  { pattern: /book profiles?/i, url: '/browse' },
  { pattern: /author profiles?/i, url: '/browse' },
];
