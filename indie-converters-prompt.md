# Indie Converters — Project Handover

*Paste this whole document as your first message to Claude Code in VS Code to pick up exactly where this conversation left off.*

---

## What this project is

Indie Converters is a self-publishing platform for independent authors with two audiences in one site: **readers** browsing and discovering indie books, and **authors** uploading a manuscript to get it converted, formatted, and listed — no exclusivity contract, no cart/checkout on the site itself (readers are pointed to wherever the author already sells the book).

This is explicitly **not** a Draft2Digital-style multi-retailer distributor. It does not push books to Amazon/Apple/Kobo/B&N. It converts a manuscript into a proper EPUB/print file and lists it on this site. That distinction matters — don't scope-creep toward retailer integrations, ONIX feeds, or ISBN management unless asked.

## Current status

Everything built so far is **static HTML/CSS/JS — no backend, no real data, no auth.** Six self-contained HTML files exist, cross-linked by relative filename, with hardcoded placeholder content (fictional books/authors). They're meant to be ported into a real app, not edited in place forever.

### Files (attach these to your first Claude Code message, or it should ask for them)

1. **`indie-converters-landing.html`** — Home page. Indigo hero with an animated floating book stack, an animated stats counter, a featured-books shelf with working genre-chip filtering, a 4-step "how it works" section that highlights itself as you scroll past it, value props, testimonials, a closing CTA band, footer. Nav is fixed/transparent over the hero and switches to solid white on scroll.
2. **`indie-converters-browse.html`** — Catalog page. Live search-as-you-type (title/author), genre checkbox filters, a sort dropdown (Newest / Title A–Z / Author A–Z), responsive book grid. 12 hardcoded books across 5 fictional authors and 4 genres (fiction, memoir, poetry, nonfiction).
3. **`indie-converters-book-detail.html`** — Single book page (subject: *The Long Marsh* by Inés Calder). Large cover, blurb, an expandable "Read the first pages" sample panel, a Save (heart) toggle, a "Where to buy" outbound button (no cart), a "More from this author" row, breadcrumb.
4. **`indie-converters-author-profile.html`** — Author page (subject: Inés Calder). Avatar initials circle, bio, stats (books published, followers), a Follow toggle, a grid of her 2 books, social/connect links.
5. **`indie-converters-publish.html`** — Marketing/info page aimed at prospective authors. Indigo hero, a more detailed 4-step process breakdown, an FAQ accordion (rights, file formats, fees, no in-site purchasing yet), closing CTA.
6. **`indie-converters-upload-wizard.html`** — The actual product flow, and the most important file functionally. A 4-step wizard (**Upload → Preview → Details → Published**) with a clickable stepper:
   - *Upload*: drag-and-drop or browse, shows the file as a removable chip, then a simulated "Converting…" progress bar before auto-advancing. **This is the piece that needs a real backend.**
   - *Preview*: a mock reader with Prev/Next flipping through 3 hardcoded sample paragraphs, standing in for an EPUB preview.
   - *Details*: title, blurb (with live character count), genre, price, and a cover-color swatch picker that updates a live cover preview as you type/select.
   - *Published*: confirmation screen with the final cover, a link to "View your book," and a reset button.

All "Start publishing" / "Publish your book" CTAs across the other five pages route to the wizard. All nav links cross-reference each other by relative filename — if you keep the files in one folder, the click-through actually works today.

## Design system (preserve this — don't redesign from scratch)

**Brand color** is exact, extracted from the client's actual logo file, not invented: `#441CB2` (deep indigo/purple). Paired with white. This was a deliberate late correction in the project — an earlier "warm/earthy bookish" palette was explicitly replaced because it didn't match the real logo.

CSS custom properties used throughout every file:

```css
--parchment:#FFFFFF;
--parchment-dim:#EDE7FA;
--ink:#1B1330;
--ink-soft:#4A3F66;
--clay:#441CB2;       /* primary brand indigo, exact from logo */
--clay-dark:#2E1180;  /* hover states, darker sections */
--ochre:#8266E0;      /* secondary accent, periwinkle-violet */
--sand:#E3DBFA;       /* card surfaces, dividers, light tint */
--cream:#FCFBFF;      /* near-white, text on dark backgrounds */
```

**Type:** `Fraunces` (serif, weights 300–700 + italic 500) for headlines and display numerals — characterful, slightly bookish. `Inter` (400–700) for body text and UI. Both loaded via Google Fonts CDN in every file currently; will need to become local/self-hosted assets in a real build.

**Signature motif:** the logo is literally two dots (the ".in" mark). That motif is reused everywhere as the brand's recurring signature — not a generic decorative choice:
- The eyebrow/label marker before section headers (`·· LABEL TEXT`)
- The step-numbering device in "How it works" (a small two-dot mark beside each number)
- A tiny two-dot colophon in the corner of larger book cover treatments

**Book cover component pattern** (reused across every page): a `2/3` aspect-ratio rectangle, right corners rounded (`border-radius: 2px 6px 6px 2px`), a darker "spine" strip on the left edge via a `::before` pseudo-element, a serif title in `Fraunces 600`, a thin rule beneath the title, and an uppercase tracked author name. Background color cycles through the indigo family (`clay`, `ink`, `ochre`, `sand`, `clay-dark`) for shelf variety.

## Tech stack decision (already discussed and agreed — don't re-litigate)

- **Frontend:** React (Vite recommended for a clean start)
- **Backend / DB / Auth / Storage:** Supabase
- **Manuscript conversion:** Pandoc, run as a backend job (not inline on upload — conversion takes real processing time)
- **Job handling:** a `conversion_jobs` status table + a Supabase Edge Function (or Trigger.dev if it needs to get more robust than that)
- **In-browser EPUB preview:** epub.js
- **Explicitly out of scope right now:** shopping cart/checkout, multi-retailer distribution, ISBN management, author payment processing

## What's left to build, roughly in order

1. Scaffold a real React (Vite) project. Port the 6 static pages into components/routes, preserving the existing CSS tokens and component patterns as-is rather than redesigning.
2. Set up the Supabase project: tables for `authors`, `books`, `manuscripts`, `conversion_jobs`; auth for author accounts; storage buckets for raw manuscript uploads and generated EPUB/print files.
3. Replace the hardcoded book/author arrays in Browse, Book Detail, and Author Profile with real Supabase queries.
4. Build the real upload flow in the wizard's Step 1: actual file upload to Supabase Storage, replacing the simulated progress bar with real upload progress.
5. Build the conversion pipeline: an Edge Function (or worker) that runs Pandoc against the uploaded file, writes status to `conversion_jobs`, and stores the resulting EPUB/PDF.
6. Wire wizard Step 2 to render the real converted EPUB via epub.js instead of the 3 hardcoded sample paragraphs.
7. Wire wizard Step 3 to write the final book record to Supabase on submit, and Step 4 to link to the real, newly created book-detail page instead of the static demo one.
8. Author sign-up/login — flagged earlier as a likely "next build" and still outstanding. Books should belong to real author accounts, not anonymous uploads.

## A note on working style

Keep responses focused and avoid re-explaining decisions that are already settled above (the color palette, the dot motif, the no-cart/no-distributor scope, the tech stack). Ask before introducing new dependencies or changing the visual design system established in the existing HTML files.

