-- Seed Getting Started blog articles from the "Blogs & News" editorial sheet.
-- Source rows: GS-001 through GS-004. Body copy comes from the linked drafts in
-- column V, cleaned for public markdown rendering.

insert into public.blogs (
  content_id,
  type,
  status,
  published_at,
  title,
  slug,
  pillar,
  audience,
  primary_keyword,
  secondary_keywords,
  excerpt,
  body,
  meta_title,
  meta_description,
  intro_hook,
  key_sections,
  cta,
  related_tool,
  social_asset_idea,
  source_reference,
  hero_image_brief,
  internal_links,
  notes,
  revision_notes
) values
(
  'GS-001',
  'blog',
  'published',
  '2026-07-20 09:00:00+00',
  'What Is IndieConverters?',
  'what-is-indieconverters',
  'Getting Started',
  'New indie authors and self-published writers visiting IndieConverters for the first time',
  'what is IndieConverters',
  array['indie author platform', 'book conversion', 'author tools', 'book catalogue', 'self-publishing support'],
  'IndieConverters helps independent authors prepare, present, and share their books professionally, from clean digital formats to book listings and author tools.',
  $body$# What Is IndieConverters?

IndieConverters is a platform built for independent authors who want to present their books professionally without losing control of their work, sales, or audience.

Many authors finish a manuscript but get stuck at the next stage: formatting the book, preparing files, creating a clean listing, choosing the right category, or showing readers where to buy it. IndieConverters helps make that process clearer and more organised.

Our goal is simple: help authors move from "I have a book" to "my book is ready for readers."

## Who Is IndieConverters For?

IndieConverters is mainly for independent authors, self-published writers, small publishers, and creative professionals who need practical support with their books.

It is useful if you:

- Have written a book and need help preparing it for publishing
- Want your book converted into clean digital formats
- Need a professional book listing or author page
- Want readers to find your book more easily
- Already sell on another platform and want to point readers there
- Need help with editing, formatting, cover design, or publishing support

You do not need to be a technical person to use IndieConverters. The platform is designed to make the publishing process feel simpler.

## What Can You Do on IndieConverters?

IndieConverters brings together tools and services that help authors prepare and promote their work.

You can use it to:

- List your book in a clean catalogue
- Add book details such as title, author name, category, description, price, and buying link
- Organise books by genre or special collections
- Convert manuscripts into reader-friendly formats
- Explore author tools for formatting and publishing
- Find support for services such as ghostwriting, editing, EPUB formatting, and cover design

Instead of trying to manage everything across scattered files, messages, and links, IndieConverters gives your book a more structured home.

## Does IndieConverters Sell Books Directly?

For now, IndieConverters does not work like a traditional online store with a cart and checkout.

Instead, it helps authors direct readers to where the book is already available. That could be Amazon, Gumroad, Payhip, Selar, a personal website, or another selling platform.

This means authors keep control of their sales channels, margins, customer relationships, and publishing choices.

## Why IndieConverters Exists

Independent publishing gives authors freedom, but it also creates a lot of extra work.

A writer may need to think about formatting, metadata, book covers, sales pages, digital files, categories, discoverability, and reader trust. These things matter because readers often judge a book before they read a single page.

IndieConverters exists to reduce that friction.

We help authors package their work in a way that feels clear, professional, and ready for readers.

## What Should You Do First?

If you are new to IndieConverters, start by preparing the basic information about your book:

- Book title
- Author name
- Book cover
- Short description
- Category or genre
- Price
- Buying link
- Manuscript file, if you need conversion or formatting help

Once these are ready, it becomes easier to create a strong book listing and decide what support you need next.

## In Short

IndieConverters is a practical support platform for authors.

It helps you prepare your book, improve its presentation, organise your publishing details, and connect readers to where they can buy your work.

You bring the book. IndieConverters helps you make it ready for the world.
$body$,
  'What Is IndieConverters? A Getting Started Guide',
  'Learn what IndieConverters is, who it is for, and how it helps independent authors prepare, present, and share their books professionally.',
  'Many authors finish a manuscript but get stuck at the next step: preparing, presenting, and sharing the book professionally.',
  'What IndieConverters is | Who it is for | What authors can do | Sales/link approach | Why it exists | First steps checklist',
  'Explore IndieConverters author tools',
  'Author tools / Catalogue / Book profile setup',
  'Black-and-white author writing image for the Getting Started section',
  'Internal IndieConverters platform positioning',
  'Realistic black-and-white editorial photo of a woman author writing by hand at a vintage desk with manuscript pages, books, soft window light, and no laptop.',
  array['Author tools', 'Book profile', 'Catalogue', 'EPUB converter', 'Buying links', 'Getting Started articles'],
  'Full draft written in linked Google Doc. Added as first Getting Started article.',
  'First Getting Started article completed and linked. Section image generated separately for the Getting Started/help-center area.'
),
(
  'GS-002',
  'blog',
  'published',
  '2026-07-23 09:00:00+00',
  'How IndieConverters Helps Authors Sell More Professionally',
  'how-indieconverters-helps-authors-sell-professionally',
  'Getting Started',
  'Independent authors preparing to present and sell their books more professionally',
  'how authors sell books professionally',
  array['indie author sales', 'book listings', 'book files', 'author tools', 'book catalogue', 'sales links'],
  'IndieConverters helps authors organise their book files, listings, metadata, and sales links into a more polished publishing workflow.',
  $body$# How IndieConverters Helps Authors Sell More Professionally

A finished manuscript is only one part of publishing a book.

Before a reader decides to buy, they need more than the text itself. They need a clear description, a credible cover, the right format, accurate book details, and a simple way to purchase. When these pieces are scattered or incomplete, even a strong book can feel unfinished.

IndieConverters helps authors bring those publishing details into a cleaner, more professional structure.

## Professional Presentation Matters

Readers often make quick decisions. They look at the cover, title, description, category, price, format, and buying link before they commit.

If the book page feels unclear, the file looks poorly formatted, or the buying path is confusing, trust drops quickly.

A professional setup helps answer the reader's first questions:

- What is this book about?
- Who is it for?
- Who wrote it?
- What format is available?
- Where can I buy it?
- Does this feel credible?

IndieConverters helps authors prepare those answers before the reader has to ask.

## Cleaner Book Listings

A book listing should work like a clear publishing profile. It gives readers the essential information without making them search for it.

On IndieConverters, a listing can bring together:

- Book title
- Author name
- Cover image
- Short description
- Category or genre
- Language
- Format
- Price
- Buying link
- Author profile
- Related books or collections

This makes the book easier to understand, easier to browse, and easier to share.

## Better Prepared Book Files

Professional selling also depends on the quality of the book file.

A manuscript may look fine in Word, but digital reading platforms require proper structure. Chapters, headings, spacing, metadata, navigation, and images all affect how the book behaves on different devices.

IndieConverters supports cleaner preparation for formats such as EPUB and PDF, helping authors avoid common issues like broken spacing, weak navigation, poor image placement, missing metadata, or files that do not display well on e-readers.

A better file creates a better reading experience. It also protects the author's credibility.

## Sales Links Without Losing Control

IndieConverters is not built to replace every sales channel an author already uses.

Instead, it helps authors direct readers to the platforms where their books are already available. That may include Amazon, Gumroad, Payhip, Selar, Kobo, a personal website, or another trusted sales page.

This approach lets authors keep control of their pricing, margins, customer relationships, and publishing strategy.

The platform supports the sale without taking ownership of the author's entire sales process.

## Organised Discovery

As a catalogue grows, structure becomes important.

Readers should be able to browse by category, genre, language, region, or special collection. A book about Kenya, a Portuguese title, a poetry collection, or a business guide should sit in the right place, not disappear inside a general list.

IndieConverters helps organise books so readers can find relevant titles more easily.

Good discovery is not only about search. It is about presenting books in a way that makes browsing useful.

## Support Beyond One Listing

Many authors need more than one upload or one conversion.

They may need a stronger author profile, improved metadata, quote graphics, book descriptions, EPUB formatting, cover design, or support preparing the next release.

IndieConverters is designed as a practical support layer around the author's wider publishing work.

The aim is not just to place a book online. The aim is to help the book look ready, read well, and connect clearly to the reader.

## In Short

IndieConverters helps authors sell more professionally by improving the structure around the book.

It helps organise the files, listings, metadata, categories, and buying links that shape the reader's first impression.

A good book still needs a professional path to reach its reader.
$body$,
  'How IndieConverters Helps Authors Sell More Professionally',
  'Learn how IndieConverters helps authors organise book files, listings, metadata, categories, and sales links into a more professional publishing workflow.',
  'A finished manuscript is only one part of publishing a book. Readers also need clear details, credible presentation, and a simple buying path.',
  'Professional presentation | Cleaner book listings | Better prepared book files | Sales links without losing control | Organised discovery | Support beyond one listing',
  'Explore IndieConverters author tools',
  'Author tools / Catalogue / Book profile setup',
  'Clean editorial image showing author materials arranged professionally: book cover, manuscript pages, metadata checklist, and buying link notes',
  'Internal IndieConverters platform positioning',
  'Professional author desk scene with manuscript, printed book cover, metadata checklist, category notes, and buying link cards. Clean realistic editorial style.',
  array['GS-001', 'Author tools', 'Book profile', 'Catalogue', 'EPUB converter', 'Buying links', 'Getting Started articles'],
  'Full draft written in linked Google Doc. Added as second Getting Started article.',
  'Second Getting Started article completed and linked. Tone adjusted to be more professional and less generic.'
),
(
  'GS-003',
  'blog',
  'published',
  '2026-07-26 09:00:00+00',
  'How to Prepare Your Book Before Uploading',
  'how-to-prepare-your-book-before-uploading',
  'Getting Started',
  'Authors preparing to submit a book for listing, formatting, conversion, or publishing support',
  'prepare book before uploading',
  array['book submission checklist', 'manuscript file', 'book cover', 'author bio', 'book description', 'ebook formatting', 'buying link'],
  'Before submitting your book, prepare the key files and details that help IndieConverters format, list, and present your work professionally.',
  $body$# How to Prepare Your Book Before Uploading

Most people think uploading a book means sending a file and waiting. In reality, a smooth submission takes a bit more, and getting those pieces together beforehand makes everything faster.

Along with the manuscript, you will need the cover, author details, description, category, price, buying link, and a few notes. Each one plays a role in how your book gets listed, converted, or reviewed.

Having these ready before you upload means fewer delays, fewer back-and-forth messages, and a much smoother experience for everyone involved.

## 1. Prepare the Manuscript File

Think of this as the "carry-on" you bring to the publishing gate: one tidy file that actually represents the book you want readers to see.

Use the file that is as close to your final text as possible. If you have multiple drafts saved, pick one. Sending three slightly different versions and hoping we guess the right one does not work out well for anyone.

Common files include:

- `.docx`
- `.odt`
- `.rtf`
- `.txt`
- `.md`
- Existing `.epub` or `.pdf`, if the book has already been prepared

Before uploading, check that:

- The chapters are in the correct order
- The title page is included if needed
- Headings are clear and consistent
- Page breaks or chapter breaks are intentional
- Images, tables, or special sections are included
- The file name is easy to recognise

A clear file name saves more time than you would expect. Instead of `final_final_v3_really_final.docx`, go with something like `book-title-author-name-final.docx`. It looks professional and everyone knows exactly which file to use.

## 2. Prepare the Book Cover

Your cover does a lot of work before anyone reads a single word. Make sure it shows up looking its best.

Use the highest-quality version you have. A blurry or heavily compressed image never looks great in a catalogue or on a product page, and it is usually hard to fix after the fact.

Useful cover files include:

- `.jpg`
- `.png`
- `.pdf`
- Source files, if design changes are required

Before uploading, check that the cover is:

- Clear
- High resolution
- Correctly cropped
- Free from unwanted borders
- Matched to the final book title and author name

No finished cover yet? That is okay. Just mention it clearly when you submit and we will handle it from there.

## 3. Confirm the Book Title and Subtitle

This sounds obvious, but it is one of the most common sources of confusion. Write the title exactly as it should appear everywhere: on the cover, in listings, in metadata, and in sales links.

Double-check spelling, capitalisation, and punctuation. A small typo in the title can quietly create problems across listings, covers, and sales links, and fixing it later takes more work than getting it right from the start.

Prepare:

- Main title
- Subtitle, if any
- Series name, if any
- Book number, if part of a series

Example:

- Title: The Quiet Road
- Subtitle: Notes on Leaving, Returning, and Becoming
- Series: Essays from the Borderlands
- Book number: Book 1

## 4. Prepare the Author Details

Readers want to know who wrote the book they are holding. A few lines and a photo go a long way.

Prepare:

- Author name
- Short author bio
- Author photo, if available
- Website or social links
- Country or region, if relevant
- Previous books, if any

Do not overthink the bio. A short, honest paragraph about who you are and what you write is all you need.

## 5. Write a Clear Book Description

Your description is often what convinces someone to pick up your book over another. It does not need to be a masterpiece, but it does need to be clear and honest about what is inside.

A strong description usually includes:

- The central topic or story
- The intended reader
- The main promise or value
- The tone or genre
- Any important themes

If you are not sure where to start, try this: open with what the book is about, cover what the reader will find inside, and end with who it is really written for.

## 6. Choose the Right Category

The right category puts your book in front of the right readers. It is a small choice that makes a real difference in discoverability.

Choose the category or genre that best fits the content. If the book fits more than one area, choose a primary category first, then add secondary categories if needed.

Examples include:

- Fiction
- Poetry
- Memoir
- Business
- Self-help
- Children's books
- Kenyan books
- Portuguese books
- Romance
- Fantasy
- Spirituality
- Education

Pick the one that fits best, and add secondary categories if the book genuinely crosses more than one area. Do not over-categorise just to get more visibility. It often has the opposite effect.

## 7. Prepare the Price and Buying Link

If your book is already on sale somewhere, grab the direct link now so it does not hold things up later.

This may be a link to:

- Amazon
- Kobo
- Gumroad
- Payhip
- Selar
- Shopify
- A personal website
- Another online store or sales page

Also note the price and currency. If the book is not live yet, just leave the link blank for now. You can add it when the time comes.

## 8. Know What Format You Need

Not every book needs the same output. Knowing what you are aiming for upfront saves time and avoids having to redo work.

Before submitting, decide what you need help with:

- EPUB for e-readers and digital stores
- PDF for sharing or fixed-layout reading
- Print-ready PDF for physical books
- Web-ready book page
- Catalogue listing
- Cover design
- Editing or proofreading
- Metadata cleanup

Not sure which format you need? Just tell us where you are planning to publish or sell, and we will point you in the right direction.

## 9. Add Any Special Notes

Every book is different. If yours has something a bit out of the ordinary, it is worth flagging it before we get started.

Add notes if your book includes:

- Images
- Footnotes or endnotes
- Tables
- Poems
- Scripts or dialogue formatting
- Multiple languages
- Special fonts
- Children's book layouts
- Academic references
- Accessibility requirements

A quick note about any unusual elements in your book means fewer surprises mid-process and a better end result.

## Final Checklist Before Uploading

Run through this list before you hit submit:

- Manuscript file
- Cover file
- Book title and subtitle
- Author name and bio
- Book description
- Category or genre
- Price
- Buying link
- Preferred output format
- Special notes or instructions

## In Short

You do not need to have everything perfect. But the more prepared you are, the faster and smoother the whole process goes.

Things do not need to be flawless before you reach out. What matters is that the key files and details are clear enough to work with.

A clean, well-prepared submission makes the whole experience better for you and for everyone working on your book.
$body$,
  'How to Prepare Your Book Before Uploading',
  'A practical checklist for authors preparing their manuscript, cover, author details, book description, category, price, buying link, and format notes before upload.',
  'Uploading a book is easier when the important files and publishing details are ready before you begin.',
  'Manuscript file | Book cover | Title and subtitle | Author details | Book description | Category | Price and buying link | Format needs | Special notes | Final checklist',
  'Prepare your book profile for IndieConverters',
  'Book profile / Catalogue setup / EPUB conversion',
  'Checklist-style graphic showing manuscript file, cover, author bio, description, category, price, buying link, and format selection',
  'Internal IndieConverters submission workflow',
  'Realistic checklist desk scene: manuscript document, book cover image, author bio card, metadata fields, category tags, price and buying link notes, and output format options.',
  array['GS-001', 'GS-002', 'Book profile', 'Catalogue', 'EPUB converter', 'Buying links', 'Author tools'],
  'Full draft created as DOCX and uploaded to Drive. Added as third Getting Started article.',
  'Third Getting Started article completed as DOCX, rendered for visual QA, uploaded, and linked. Editorial note removed from public body.'
),
(
  'GS-004',
  'blog',
  'published',
  '2026-07-29 09:00:00+00',
  'Understanding Book Formats on IndieConverters',
  'understanding-book-formats-on-indieconverters',
  'Getting Started',
  'Authors who need help choosing the right file format for conversion, listing, sharing, or print preparation',
  'book formats for authors',
  array['EPUB', 'PDF', 'print-ready PDF', 'MOBI', 'manuscript file', 'ebook conversion', 'IndieConverters'],
  'IndieConverters helps authors understand which file they need for reading, listing, sharing, printing, or conversion.',
  $body$# Understanding Book Formats on IndieConverters

A book can exist in more than one file format.

The same manuscript may begin as a Word document, become an EPUB for digital reading, a PDF for review, and a print-ready file for paperback or hardcover production. These formats may contain the same book, but they do not serve the same purpose.

IndieConverters helps authors prepare the right file for the right use.

The goal is not to create every format possible. The goal is to understand what each format is for, then choose the version that matches your publishing plan.

## Why Book Formats Matter

Book formats affect how your work is read, shared, listed, sold, and printed.

A file that works well for editing may not work well for e-readers. A file that looks perfect as a PDF may not be comfortable to read on a phone. A file prepared for print may not behave like a digital ebook.

Before converting or listing a book, it helps to know what you want the file to do:

- Should readers resize the text?
- Should the layout stay fixed?
- Will the book be printed?
- Is the file only for review?
- Is the book being added to the IndieConverters catalogue?
- Do you need help cleaning the source file first?

Once the goal is clear, the format becomes easier to choose.

## Manuscript Files

A manuscript file is usually the working version of the book.

This is the file authors send when they need editing, cleanup, formatting, conversion, or publishing preparation. It may not be the final reader-facing file, but it is often the source used to create one.

Common manuscript files include:

- `.doc`
- `.docx`
- `.odt`
- `.rtf`
- `.txt`
- `.md`

For most authors, `.docx` is a practical starting point because it is editable and widely supported.

When sending a manuscript to IndieConverters, use the cleanest version you have. If there are multiple versions, label them clearly so the correct file is used.

## EPUB

EPUB is one of the most important formats for digital reading.

It is designed for reflowable text, which means the content can adjust to different screen sizes, font settings, and reading devices. This makes EPUB useful for readers using phones, tablets, e-readers, and ebook apps.

An EPUB is usually the right format when you want:

- A digital ebook
- Reflowable text
- A table of contents
- Ebook metadata
- Better reading on different screen sizes
- A file suitable for ebook distribution

A good EPUB is not just an exported file. It needs structure, clean chapters, navigation, metadata, and proper handling of images or special content.

IndieConverters can help turn a manuscript into a cleaner EPUB that is easier to read and easier to manage across digital publishing workflows.

## PDF

PDF is best when the layout needs to stay fixed.

Unlike EPUB, a PDF does not reflow easily. The page stays exactly as designed, which can be useful for documents where spacing, images, page breaks, or visual layout matter.

A PDF is useful for:

- Review copies
- Fixed-layout books
- Workbooks
- Guides
- Visual books
- Designed pages
- Sharing a file that should look the same everywhere

However, PDF is not always the best format for normal ebook reading. On a small screen, readers may need to zoom or scroll because the page does not adapt like an EPUB.

IndieConverters can help prepare reader-friendly PDFs when the book needs a fixed layout or a clean review copy.

## Print-Ready PDF

A print-ready PDF is prepared for physical production.

This is different from a normal PDF. A print-ready file must be built with printing requirements in mind, including page size, margins, bleed, page numbering, image quality, and font handling.

A print-ready PDF is useful when you want:

- Paperback production
- Hardcover production
- A fixed interior layout
- A file prepared for a print supplier
- A professional proof before printing

Print files require more care because small layout issues can affect the final physical book.

IndieConverters can help authors prepare or check print-ready files so the book is closer to production quality before it is sent to a printer or publishing platform.

## MOBI

MOBI is an older ebook format associated with earlier Kindle workflows.

Many authors still hear about MOBI because older publishing advice mentions it often. Today, most authors do not need to request MOBI as their main file format.

In most cases, EPUB is the better starting point for modern ebook preparation.

IndieConverters can help authors understand when MOBI is relevant, but for most new projects, the focus should be on cleaner source files, EPUB, PDF, and print-ready PDF.

## What Format Should You Request?

If you are not sure what to ask for, start with the goal of the file.

You do not need to know every technical detail before asking for help. A clear publishing goal is usually enough to decide the next step.

| If you want to... | Ask IndieConverters for... |
| --- | --- |
| Turn your manuscript into an ebook | EPUB conversion |
| Share a fixed review copy | PDF |
| Prepare for paperback or hardcover | Print-ready PDF |
| Clean up your source file | DOCX or manuscript cleanup |
| Add your book to the catalogue | Book profile or listing setup |
| Improve book details | Metadata cleanup |
| Prepare for multiple publishing channels | Format consultation |
| Unsure what you need | Publishing file guidance |

## How IndieConverters Helps

IndieConverters helps authors move from a rough or scattered file setup to a clearer publishing workflow.

Depending on the book, this may include:

- Reviewing the source manuscript
- Cleaning file structure
- Preparing EPUB files
- Creating fixed-layout PDFs
- Preparing print-ready PDFs
- Checking metadata
- Organising book details for catalogue listing
- Helping authors understand which file is needed
- Connecting the final book profile to buying links

Different publishing platforms may request different files, but IndieConverters helps you prepare the right version before you upload anywhere.

## In Short

Book formats are tools. Each one has a different job.

A manuscript file is for editing and preparation. EPUB is for digital reading. PDF is for fixed layout and review. Print-ready PDF is for physical books. MOBI is mostly a legacy format.

IndieConverters helps authors choose and prepare the format that fits the book's next step.

You do not need every file. You need the right file for the reader, platform, or publishing goal in front of you.
$body$,
  'Understanding Book Formats on IndieConverters',
  'Learn which book format to request from IndieConverters for digital reading, PDF review, print-ready files, catalogue listing, and manuscript cleanup.',
  'A book can exist in more than one file format, but each version has a different job.',
  'Why formats matter | Manuscript files | EPUB | PDF | Print-ready PDF | MOBI | What format to request | How IndieConverters helps',
  'Ask IndieConverters for the right publishing file',
  'EPUB conversion / PDF preparation / Print-ready PDF / Book profile setup',
  'Format chooser graphic: manuscript, EPUB, PDF, print-ready PDF, MOBI, and catalogue listing',
  'Internal IndieConverters workflow; KDP and Draft2Digital used as background research only',
  'Clean help-center graphic showing one manuscript becoming EPUB, PDF, print-ready PDF, and catalogue listing outputs inside the IndieConverters workflow.',
  array['GS-001', 'GS-002', 'GS-003', 'EPUB converter', 'Book profile', 'Catalogue', 'Author tools'],
  'Full draft created as DOCX and saved in the blogs Drive folder. Framed around IndieConverters, not external publishing platforms.',
  'Fourth Getting Started article completed as DOCX, rendered for visual QA, saved in the blogs Drive folder, and linked. Editorial note removed from public body.'
)
on conflict (content_id) do update set
  type = excluded.type,
  status = excluded.status,
  published_at = excluded.published_at,
  title = excluded.title,
  slug = excluded.slug,
  pillar = excluded.pillar,
  audience = excluded.audience,
  primary_keyword = excluded.primary_keyword,
  secondary_keywords = excluded.secondary_keywords,
  excerpt = excluded.excerpt,
  body = excluded.body,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  intro_hook = excluded.intro_hook,
  key_sections = excluded.key_sections,
  cta = excluded.cta,
  related_tool = excluded.related_tool,
  social_asset_idea = excluded.social_asset_idea,
  source_reference = excluded.source_reference,
  hero_image_brief = excluded.hero_image_brief,
  internal_links = excluded.internal_links,
  notes = excluded.notes,
  revision_notes = excluded.revision_notes,
  updated_at = now();
