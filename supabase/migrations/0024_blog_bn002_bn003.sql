-- BN-002: add body + update metadata now fully filled in from sheet
UPDATE blogs SET
  body              = '# EPUB Accessibility: What Indie Authors Need to Know Before Publishing in 2026

Your ebook should not exclude readers before they reach page one.

For many indie authors, EPUB accessibility sounds technical, legal or expensive. It can feel like something only large publishers need to worry about. That is no longer a useful way to think about it.

Accessibility is becoming part of basic digital publishing quality. A book that works well for more readers is easier to trust, easier to distribute and better prepared for modern publishing standards.

The point is not to turn every author into an accessibility specialist. The point is to help authors understand what needs attention before a book is published.

![ Side-by-side comparison: an inaccessible EPUB with broken reading order on a screen reader vs a clean accessible EPUB rendering correctly.]()

## What EPUB accessibility means

An accessible EPUB is an ebook file that can be used by readers with different needs, devices and reading preferences.

Some readers use screen readers or text-to-speech. Some need larger text. Some navigate by headings. Some rely on keyboard controls. Some need image descriptions. Some need a clear reading order because visual layout alone is not enough.

Accessibility is not only about disability. It also improves the experience for readers using small screens, older devices, poor lighting, reading apps with limited controls, or audio-supported reading.

A good EPUB should not fight the reader. It should allow the content to adapt.

## Accessibility starts with structure

Most EPUB accessibility problems begin before the EPUB exists.

If a manuscript uses fake formatting instead of real structure, the converted EPUB becomes harder to read and harder for assistive technology to understand. A bold line that only looks like a heading is not the same as a real heading. A list made with hyphens and spaces is not as reliable as a proper list. A manually created table of contents is not the same as functional navigation.

Structure tells the reading system what each part of the book is. Headings, paragraphs, lists, links, notes, tables, images and page breaks should have meaning, not just appearance.

For authors, this means accessibility begins in the editing and formatting stage. The cleaner the manuscript structure, the easier it is to produce a better EPUB.

## WCAG matters, but EPUB has its own needs

EPUB accessibility builds on web accessibility. EPUB files use web technologies such as HTML, CSS, SVG and related standards, so many accessibility principles come from the Web Content Accessibility Guidelines, commonly known as WCAG.

WCAG is built around four broad principles: content should be perceivable, operable, understandable and robust. In plain terms, readers should be able to access the content, move through it, understand it and use it with reliable technologies.

But EPUB is not just a single web page. It is a publication made of many content documents, packaged together with metadata and navigation. That is why EPUB accessibility also focuses on things like reading order, table of contents, page navigation, synchronized text and audio where relevant, and accessibility metadata.

![ Diagram showing the four WCAG principles — Perceivable, Operable, Understandable, Robust — applied to an EPUB publication.]()

## Accessibility metadata helps readers decide

An EPUB can be accessible in practice but still hard to evaluate if it does not describe its accessible qualities.

Accessibility metadata tells platforms, libraries, retailers and readers what accessibility features are present. It can describe whether the book has textual content, alt text, captions, hazards, a table of contents, page navigation or an accessibility summary.

This matters because readers have different needs. One reader may depend on screen reader support. Another may need text resizing. Another may need to know whether a book contains flashing content, motion simulation or audio without transcript support.

Metadata makes these qualities discoverable before someone buys or opens the book.

For indie authors, this is also about professionalism. A book listing that carries clear metadata looks more prepared than a file that says nothing about how it can be read.

## The European Accessibility Act changed the context

Accessibility is also becoming more important because of regulation.

The European Accessibility Act applies to certain products and services placed on the EU market or provided to consumers after 28 June 2025. Its scope includes e-readers, e-books and dedicated software, and e-commerce services.

For authors and small publishing projects, this does not mean every situation is identical or that every author has the same legal obligations. But it does mean accessibility is no longer a distant technical topic. It is part of the publishing environment, especially for anyone selling into Europe or using online sales channels.

A practical response is to build accessibility into the production workflow early: clean structure, usable navigation, good metadata, readable text, meaningful image descriptions, and testing before publication.

## What accessible EPUB production looks like

Accessible EPUB production is not one button. It is a set of decisions made across the book.

The manuscript should be structured before conversion. Chapter titles should be real headings, not enlarged body text. Lists should be real lists. Tables should be simple and readable. Notes should be clear. Images should be handled intentionally.

During conversion, the EPUB should preserve that structure. The table of contents should reflect the actual book. The reading order should be logical. The file should not lock the reader into a layout that prevents resizing, screen reader access or navigation.

After conversion, the file should be checked. Open it in more than one reading app. Test the table of contents. Resize the text. Check the cover. Review images. Inspect metadata. If possible, validate the EPUB and test it with assistive technology or accessibility-aware tools.

## A practical accessibility checklist before you publish

Before publishing your EPUB, check these areas:

- Does the file use proper headings for chapters and sections?
- Does the table of contents work?
- Are images supported with meaningful alt text where needed?
- Does the reading order make sense from beginning to end?
- Can the text be resized without breaking the layout?
- Are links descriptive rather than vague?
- Are tables, lists and notes structured properly?
- Does the EPUB include accessibility metadata?
- Does the book avoid blocking assistive technologies?
- Has the file been tested in more than one reading app?

This is not only a compliance checklist. It is a quality checklist.

![ Screenshot of an EPUB validation and accessibility audit tool showing a clean pass, with a tablet preview of the accessible book beside it.]()

## Accessibility is now part of professional publishing

For indie authors, accessibility can feel like another technical burden. But the better way to see it is simple: accessibility protects the reader experience.

A clean, accessible EPUB helps more people read the book. It improves trust. It makes the file easier to distribute. It also prepares the author for markets and platforms where accessibility information is becoming more visible.

The book does not need to be perfect before the author starts thinking about accessibility. But accessibility should not be left until the last export button either.

At Indie Converters, the aim is to help authors create, edit, convert, style and prepare books in formats that work for real readers. Accessibility is part of that work. It is not a separate luxury feature. It is part of making a book behave properly as a digital publication.

A finished manuscript deserves an EPUB that can carry the work to as many readers as possible.',
  meta_title        = 'EPUB Accessibility for Indie Authors in 2026',
  meta_description  = 'A practical guide to EPUB accessibility for indie authors, covering structure, navigation, metadata, WCAG context and publishing readiness.',
  excerpt           = 'Accessibility is becoming part of digital publishing quality. A clean EPUB should support readers who resize text, use screen readers, navigate by headings, or rely on accessibility metadata.',
  hero_image_brief  = 'Accessible ebook mockup: EPUB file shown with icons for screen reader, alt text, table of contents, resizable text and metadata. Clean Indie Converters style.',
  internal_links    = ARRAY['EPUB converter','Accessibility checklist','Book metadata guide','Explore author tools','Indie Converters catalogue'],
  revision_notes    = 'Second full blog completed. Can be converted into a carousel: EPUB accessibility before publishing.'
WHERE content_id = 'BN-002';

-- BN-003: new post, status Ready, publish 2026-07-09
INSERT INTO blogs (
  content_id, type, status, published_at,
  title, slug, pillar, audience,
  primary_keyword, secondary_keywords,
  excerpt, meta_title, meta_description,
  intro_hook, key_sections, cta, related_tool,
  social_asset_idea, source_reference,
  hero_image_brief, internal_links,
  notes, revision_notes,
  body
) VALUES (
  'BN-003', 'blog', 'published', '2026-07-09 09:00:00+00',
  'Sell in All Your Channels: Why Indie Authors Should Keep Control of Their Book Sales',
  'sell-books-all-author-channels',
  'Author Sales',
  'Authors with existing Gumroad, Payhip, Shopify, Amazon, Kobo, Bookshop, or personal site links',
  'sell books online as an indie author',
  ARRAY['author website','direct sales','book links','affiliate book marketing'],
  'Indie authors do not need to depend on one sales channel. A stronger setup lets the author sell directly, list on marketplaces, use affiliate links and route readers through a clean catalogue page.',
  'Sell in All Your Channels: Indie Author Sales Control',
  'Why indie authors should use direct sales, marketplaces, affiliate links and catalogue pages without giving up control of margins and reader relationships.',
  'The best book sales system is the one that does not trap the author.',
  'Why one sales channel is risky | Direct sales vs marketplaces | Affiliate-friendly catalogues | Reader routing | How to organize links',
  'Add your book and buying links to the catalogue',
  'Catalogue / Affiliate link routing',
  'Graphic: One book, many sales channels',
  'Bookshop.org ebook expansion; Bookshop.org affiliate model; direct sales tools such as Gumroad, Payhip and Shopify',
  'Graphic showing one book at the center connected to Amazon, Kobo, direct website, Bookshop.org, Gumroad, Payhip, Shopify and Indie Converters catalogue.',
  ARRAY['Catalogue','Buying links','Author tools','EPUB converter','Book metadata guide','Direct sales setup'],
  'Full sales-channel blog written in linked Google Doc. Focus: direct sales, marketplaces, affiliate links, catalogue routing, margin and reader relationship control.',
  'Third full blog completed. Good for website blog plus carousel: One book, many sales channels.',
  '# Sell in All Your Channels: Why Indie Authors Should Keep Control of Their Book Sales

The best book sales system is the one that does not trap the author.

For a long time, indie authors were told to think in single platforms. Put the book here. Send every reader there. Trust the algorithm. Wait for discovery.

That can work for some books, but it is not a complete strategy. An author who depends on one channel is also accepting one set of rules, one customer relationship, one pricing structure and one platform decision-making system.

A stronger sales setup gives the author more control. The book can still appear on major retailers, but the author should not lose the ability to sell directly, link to preferred shops, use affiliate channels, build a catalogue presence and keep the relationship with readers.

That is why Indie Converters is not trying to replace the author''s cart. We can help the author sell in all their channels while keeping control of margins, relationships and profits.

![ Graphic showing one book at the centre connected by lines to Amazon, Kobo, Gumroad, Payhip, Shopify, Bookshop.org, a personal website, and an Indie Converters catalogue page.]()

## A book can have more than one sales path

A modern book does not need one door.

An author may sell an EPUB directly through Gumroad, Payhip or Shopify. They may also list on Amazon, Kobo, Apple Books, Google Play Books or other ebook retailers. They may point readers to a local bookstore, Bookshop.org, a personal website, a newsletter landing page or a campaign page.

Each channel can serve a different purpose.

Direct sales can support higher margins and closer reader relationships. Retailers can provide reach and buyer familiarity. Bookstore links can support independent booksellers. Affiliate links can reward the platforms and creators who help readers discover the book. Catalogue pages can organize everything in one clean place.

The goal is not to make the sales journey complicated. The goal is to avoid making the author dependent on one path.

## Margin is only one part of control

Authors often talk about margins first, and margins do matter. A sale through a direct channel can leave the author with more of the purchase price than a sale through a retailer.

But control is bigger than margin.

Control also means knowing where the reader came from. It means being able to update links quickly. It means presenting the book in the right context. It means building an email list, offering bundles, running launch campaigns, testing prices and owning more of the reader relationship.

A marketplace sale may give the author revenue. A direct sale can also give the author information, permission and a future path back to the reader.

For independent authors, that difference matters.

## The problem with relying on one channel

One sales channel can feel simple. It gives the author one link, one dashboard and one place to send readers.

The problem is dependency.

If a platform changes its rules, fees, search visibility or content policies, the author has limited control. If the book is removed, hidden, miscategorized or buried by algorithm changes, the author may lose access to readers overnight. If all marketing points to one retailer, the author becomes dependent on that retailer''s priorities.

This does not mean authors should avoid major platforms. Large retailers can still be useful. They provide discovery, trust, payment handling and reader habits. But they should not be the only part of the author sales system.

A stronger model gives the author options.

![ Comparison visual: left side shows a single retailer funnel with a fragile single path; right side shows a multi-channel author setup with resilient, independent paths to readers.]()

## Direct sales protect the relationship

Direct sales matter because they keep the author closer to the reader.

When an author sells through their own website or a direct sales tool, they may have more control over pricing, bundles, customer communication, launch offers, bonus material and long-term audience building. This can be especially useful for authors who already have an email list, community, course, newsletter, podcast or social audience.

Direct sales are not always easier. The author may need to handle taxes, payments, file delivery, support, refunds and compliance depending on the tool they use. But the advantage is clear: the author is not only renting attention from a marketplace.

They are building an audience asset.

## Marketplaces still have a role

Direct sales do not remove the need for marketplaces.

Many readers already buy from Amazon, Kobo, Apple Books, Google Play Books, Bookshop.org or local book retailers. Some readers trust familiar checkout systems. Some want books inside a specific reading app. Some prefer to support independent bookstores. Some will only buy where they already have an account.

That is why the question should not be direct sales or marketplaces. The better question is: which channel serves which reader?

A reader who follows the author closely may buy directly. A reader who discovers the book in search may buy from a retailer. A reader who wants to support a local bookshop may use Bookshop.org or a bookstore link. A reader who prefers a specific device ecosystem may choose the store connected to that device.

The author does not need to force every reader through one door.

## Affiliate links can support the catalogue model

Affiliate links are useful when the author or platform is not the final seller but still helps the sale happen.

For a catalogue like Indie Converters, this matters. We do not need to build a cart immediately to create value. We can list books, improve discovery, create content around them, route readers to buying channels and use affiliate links where appropriate.

This creates a lighter model. The author keeps their chosen sales channel. The reader gets a clear path to buy. The catalogue earns when it helps produce a sale. No one has to rebuild the whole bookselling system from scratch.

This also fits how book discovery often works. Readers do not always buy from the place where they first discovered the book. They may see a quote card, read a blog post, check a book profile, click a buying link, compare formats and then choose where to purchase.

The catalogue should support that journey, not block it.

## A better system is flexible

A good author sales system should not trap the author. It should make the book easier to find wherever the author already sells.

That is the idea behind Indie Converters. We do not need to replace every sales tool. We can help authors prepare cleaner book files, organize catalogue information, improve book profiles, generate marketing assets and point readers to the correct buying channel.

The author keeps the margin where they sell directly. They keep the relationship where they own the customer. They keep the marketplace benefit where a retailer gives them reach. They keep the community benefit where a partner or affiliate sends them readers.

That is not a weaker model. It is a more realistic one.

## What authors should prepare before linking sales channels

Before an author starts sending readers everywhere, the book information should be clean.

The title should be consistent. The author name should match across platforms. The book description should be clear. The cover should be ready. The format should be correct. The EPUB should be tested. The buying links should be checked. The price should be current. The author bio should be professional. The category and keywords should make sense.

A messy sales link sends the reader into confusion. A clean catalogue entry gives them confidence.

For Indie Converters, this creates a practical workflow:

- Prepare the book file.
- Clean the metadata.
- Add the book to the catalogue.
- Connect the buying links.
- Create social assets.
- Route readers to the right channel.
- Update the links when prices or platforms change.

This is not just marketing. It is publishing operations.

![ Clean Indie Converters book catalogue page showing a well-organised author profile with consistent title, cover, description, formats and buying links across multiple channels.]()

## Keep control without doing everything alone

Indie authors do not need to do everything manually. They also do not need to hand over everything to one marketplace.

The better approach is controlled flexibility. Use the channels that work. Keep the direct links that matter. Make the reader journey simple. Keep the book information clean. Do not build a system that depends on one platform staying friendly forever.

A book can live on Amazon, Kobo, Gumroad, Payhip, Shopify, Bookshop.org, a personal website and a catalogue page at the same time. The important thing is not to scatter links everywhere without structure. The important thing is to organize the book so readers know where to go next.

At Indie Converters, our role is to help authors prepare the book, organize the profile and point readers to the channels the author already trusts.

We help you sell. You keep your margins, relationships and profits.'
);
