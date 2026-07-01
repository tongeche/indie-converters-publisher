-- BN-004: Book Metadata 101
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
  'BN-004', 'blog', 'published', '2026-07-12 09:00:00+00',
  'Book Metadata 101: The Small Details That Help Readers Find Your Book',
  'book-metadata-101-indie-authors',
  'Book Metadata',
  'Indie authors preparing to list or relaunch a book on any retail or catalogue platform',
  'book metadata for indie authors',
  ARRAY['EPUB metadata','retailer listing','book discoverability','ISBN','keywords'],
  'Metadata is the public identity of your book. A clean title, consistent author name, accurate categories and complete buying links help readers find, trust and choose your book.',
  'Book Metadata 101: Help Readers Find Your Book',
  'A practical guide to book metadata for indie authors — covering retailer fields, EPUB internal metadata, catalogue pages, common mistakes and a pre-launch checklist.',
  'Readers cannot buy a book they cannot find, understand, or trust.',
  'What metadata means | Retailer metadata fields | EPUB internal metadata | Catalogue metadata | Pre-launch checklist | Common mistakes | How Indie Converters helps',
  'Prepare your book profile for Indie Converters',
  'Catalogue / Book profile',
  'Checklist graphic: Book Metadata Before You Launch',
  'W3C EPUB 3.3: https://www.w3.org/TR/epub-33/ | W3C EPUB Accessibility 1.1: https://www.w3.org/TR/epub-a11y-11/ | W3C Accessibility Metadata Authoring Guide: https://w3c.github.io/publ-a11y/package-metadata-authoring-guide/',
  'Clean desk mockup showing a book profile card with all metadata fields filled in — title, author, cover, description, categories, buying links — displayed on a laptop or tablet.',
  ARRAY['EPUB converter','Accessibility guide','Book catalogue','Buying links','Author tools','Sell in all channels'],
  'Fourth full blog completed in linked Google Doc. Ready for image planning and website publishing.',
  'Fourth blog completed. Good for checklist carousel: Book metadata before you publish.',
  '# Book Metadata 101: The Small Details That Help Readers Find Your Book

Readers cannot buy a book they cannot find, understand, or trust.

That is the quiet power of book metadata. It is not the glamorous part of publishing. It is not the cover reveal, the launch post, or the moment you finally upload the manuscript. But metadata is one of the things that decides whether a reader, retailer, catalogue, search tool, or accessibility system can understand what your book is, who it is for, and where it belongs.

For indie authors, metadata can feel like a set of boring form fields you rush through at the end. Title. Subtitle. Category. Keywords. Description. ISBN. Language. Author name. Price. Format. Buying links. Done.

But those small fields become the public identity of your book. They travel through retailer pages, EPUB files, catalogues, search engines, newsletters, affiliate links, and reader recommendations. When they are incomplete or inconsistent, the book becomes harder to discover and harder to trust.

Good metadata does not make a weak book strong. But weak metadata can make a good book almost invisible.

## What Metadata Means

Book metadata is the structured information that describes your book.

Some of it is visible to readers. The title, subtitle, author name, description, categories, price, format, cover, and buying links help a reader decide whether to click, sample, or buy.

Some of it sits inside the book file. EPUB metadata can include the title, creator, language, identifier, publication details, accessibility properties, and other package information that reading systems use to understand the file.

Some of it belongs to your wider author ecosystem. Your catalogue page, author bio, book tags, affiliate links, social captions, quote cards, and newsletter links all depend on the same basic facts being clear and consistent.

The mistake many authors make is treating each place separately. They write one title in the manuscript, another variation on the cover, a slightly different subtitle on the retailer page, and a different description in their website catalogue. The reader may not notice every mismatch, but systems often do.

Metadata is not just administration. It is the map around the book.

## Retailer Metadata

Retailer metadata is the information you enter when you publish or list your book on platforms such as Amazon, Kobo, Google Play Books, Apple Books, Bookshop.org, Gumroad, Payhip, Shopify, or your own website.

The most important retailer fields usually include:

- Title
- Subtitle
- Author name
- Series name and number, if relevant
- Book description
- Categories or genres
- Keywords or search terms
- Language
- ISBN or platform identifier
- Format: ebook, paperback, hardback, audiobook, bundle
- Price
- Territories or availability
- Age range or audience, where relevant
- Buying link

For readers, these fields answer simple questions: What is this book? Who wrote it? Is it for me? Where can I get it? Is it part of a series? What format am I buying?

For platforms, these fields help classify and display the book. A romance novel placed under general business, or a poetry collection described only as "a powerful book," gives the system very little to work with. The result is usually weaker discovery.

A strong retailer listing is specific without being stuffed. A subtitle should clarify the book, not become a pile of keywords. A description should help the right reader understand the promise of the book, not try to trick every possible search query. Categories should match the book readers will actually receive.

Trust is part of discoverability.

## EPUB Internal Metadata

An EPUB is not just a visible reading file. It is a structured package. Inside that package, metadata helps reading systems identify the publication and display it correctly.

At minimum, an EPUB publication needs clear information such as title, creator, language, and identifier. EPUB 3.3 also treats publication metadata as part of the package structure, not as an optional decoration.

This matters because the same EPUB may travel across different reading environments. A reader may open it in Apple Books, Kobo, Thorium Reader, Calibre, a library app, or a retailer previewer. If the internal metadata is weak, the book may display with the wrong title, missing author name, bad language handling, or poor sorting in a library.

Internal metadata also connects to accessibility. EPUB accessibility guidance expects accessibility metadata to travel with the publication so platforms and readers can understand its accessible qualities. That includes information such as access modes, accessibility features, hazards, and a human-readable accessibility summary.

In plain English: the book file should be able to explain itself.

For indie authors, this does not mean you need to become a metadata engineer. It means your EPUB should be created with care, validated before publishing, and checked in more than one reading environment.

## Catalogue Metadata

Your book catalogue page is another metadata layer. It may sit on your author website, Indie Converters, a newsletter archive, a landing page, or a public book profile.

Catalogue metadata should help readers move from interest to action quickly.

Useful catalogue fields include:

- Book title
- Author name
- Short description
- Long description
- Genre or category
- Mood or reading vibe
- Format availability
- Cover image
- Sample link, if available
- Buying links by channel
- Affiliate links, where relevant
- Reader age or content notes, if needed
- Accessibility notes, if available
- Author bio
- Related books
- Publication date

Catalogue metadata is especially important when your sales system uses multiple channels. One reader may prefer Amazon. Another may prefer Kobo. Another may buy directly through Gumroad, Payhip, Shopify, or your personal website. A good catalogue page does not trap the reader. It routes them clearly.

This is where metadata becomes marketing infrastructure.

Instead of saying "buy my book" in ten different places, your catalogue can hold the structured truth of the book: what it is, who it is for, how it feels, where it can be bought, and what else the reader may enjoy next.

## The Metadata Fields Indie Authors Should Prepare

Before launch, every indie author should prepare a simple book profile. This does not need to be complicated. It should be complete enough that you can reuse it across retailers, your website, your EPUB file, social content, and catalogue tools.

Start with the identity fields:

- Final title and subtitle
- Author name exactly as it should appear
- Series name and book number, if relevant
- Publisher or imprint name, if relevant
- Publication date, language, ISBN or identifier

Then prepare the reader-facing fields:

- One-sentence hook
- Short and full book description
- Primary and secondary genre
- Three to five reader keywords
- Audience or reader profile
- Comparable themes or moods
- Content notes, if relevant

Then prepare the technical and sales fields:

- Available formats and retailer links
- Direct sales and affiliate links
- Cover image file and EPUB file
- Accessibility notes and alt text for cover and key images

The goal is to stop rebuilding the same information from memory every time you publish, promote, or upload the book somewhere new.

## Common Metadata Mistakes

The most common metadata problem is inconsistency. A book title appears one way on the cover, another way on the retailer page, and another way inside the EPUB file. The author name may include a middle initial in one place and not another. A buying link may point to an old page.

Another mistake is vague categorization. "Fiction" is usually not enough. "Self-help" may be too broad. Readers need enough information to understand the promise of the book.

Keyword stuffing is another risk. Metadata should help classification and discovery, but it should still feel honest. Readers can sense when a subtitle or description has been written for a machine instead of a person.

A fourth mistake is forgetting accessibility metadata. If your EPUB has proper structure, alt text, navigation, and readable order, that value should be reflected in the file and, where useful, in your catalogue notes.

The final mistake is treating metadata as a launch-day task. By launch day, the book is already moving through systems. Metadata should be prepared before conversion, before upload, and before public promotion.

## A Simple Pre-Launch Metadata Checklist

Before you publish, check these items:

- The title matches across manuscript, cover, EPUB, retailer page, and catalogue
- The author name is consistent everywhere
- The subtitle is useful, accurate, and not overloaded
- The book description clearly explains the promise of the book
- The categories match the real reader expectation
- The keywords support discovery without becoming spam
- The language is correctly set and the ISBN or identifier is correct
- The EPUB internal metadata has been checked
- The table of contents works and the cover image displays correctly
- The buying links are current with direct and marketplace options
- The accessibility notes are not forgotten
- The author bio is ready and consistent

## How Indie Converters Helps

Indie Converters is built around the idea that authors should keep control of their books, sales channels, and publishing assets. That control depends on structure.

A clean book profile helps the catalogue understand the book. A well-prepared EPUB helps reading systems understand the file. Clear buying links help readers choose where to purchase. Accessibility notes help the book serve more readers. Good descriptions and categories help the right audience recognize the book faster.

Metadata is not there to replace the book. It is there to carry the book properly.

When those small details line up, the book feels more professional before the reader even opens page one.

## Final Thought

Readers cannot respond to a book they cannot find. They cannot trust a listing that feels incomplete. They cannot choose a buying channel that is hidden. They cannot benefit from accessibility information that was never added.

Book metadata is small, but it is not minor. It is how your book introduces itself to the systems, stores, catalogues, and readers around it.

Before you launch, give your book the details it needs to be found, understood, and trusted.'
);

-- BN-005: From Book to Daily Content
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
  'BN-005', 'blog', 'published', '2026-07-16 09:00:00+00',
  'From Book to Daily Content: How Indie Authors Can Turn Quotes into Marketing Assets',
  'book-quotes-author-marketing-assets',
  'Author Marketing',
  'Indie authors who have published or are preparing to launch a book and need a content system',
  'book quote marketing',
  ARRAY['author content strategy','quote cards','Canva bulk create','social media for authors','book marketing'],
  'Your book already contains more marketing material than you think. Learn how to extract quotes, match them to mood, and turn one book into weeks of consistent social content.',
  'Turn Book Quotes Into Marketing Assets | Indie Authors',
  'How indie authors can extract quotes from their book, split them for design, match them to mood, and use a Canva workflow to create consistent social content without starting from scratch.',
  'Your book already contains more marketing material than you think.',
  'Why quote content works | What makes a good marketing quote | Splitting quotes for design | Matching quotes to mood | One book → many content types | Weekly plan | Canva export workflow | What to avoid',
  'Create quote graphics from your book catalogue',
  'Quote export / Canva workflow / Catalogue',
  'Carousel: One book, 30 days of content',
  'Canva Bulk Create workflow: https://www.canva.com/help/bulk-create/ | Internal Indie Converters quote product line and Canva export workflow',
  'Flat-lay showing a book open beside a phone displaying a quote card and a laptop with the Canva Bulk Create interface — clean Indie Converters style.',
  ARRAY['Book catalogue','Quote export tool','Author tools','Book metadata guide','Sell in all channels','EPUB converter'],
  'Fifth blog entry in editorial sheet. Strong carousel potential: One book, many content types.',
  'Fifth blog completed. Good for website blog plus carousel: One book, 30 days of content.',
  '# From Book to Daily Content: How Indie Authors Can Turn Quotes into Marketing Assets

Your book already contains more marketing material than you think.

Many indie authors finish a book, publish it, and then face a second problem: what do I post now?

The book took months or years to write. The launch announcement is easy. The cover reveal is easy. The release-day post is easy. But after that, the pressure starts again. You need social posts, newsletter ideas, website content, captions, short videos, carousel ideas, author updates, and small reminders that the book exists.

This is where many authors feel stuck. They assume book marketing means inventing new content every day. It does not.

A good book is already full of reusable material. It has sentences that capture the theme. It has paragraphs that reveal the mood. It has questions that speak directly to readers. It has lines that can become quote cards, author notes, captions, reading prompts, newsletter snippets, and catalogue assets.

The task is not to create from nothing. The task is to extract, organize, and design what is already there.

## Why Quote Content Works

Quote content works because it gives readers a small piece of the book before asking them to care about the whole thing.

A quote can show the voice of the author. It can reveal the emotional world of the book. It can give a reader a reason to pause, save, share, or click. For nonfiction, a quote can capture a useful idea. For fiction, it can carry atmosphere, character, tension, or beauty. For poetry, it can become the main bridge between the book and the reader.

This is not just decoration. Quote content helps readers understand the book faster.

A cover tells readers what the book looks like. A description tells them what the book is about. A quote shows them how the book feels.

That feeling matters. Readers often decide whether a book is for them through tone before they decide through plot or topic. A sharp sentence, a tender line, a funny observation, or a haunting paragraph can do more than a generic promotional post.

The mistake is treating quote posts as random filler. The best quote assets are selected with purpose.

## What Makes a Good Book Quote for Marketing

Not every good sentence is a good marketing quote.

A strong marketing quote should be understandable outside the full chapter. It should carry a complete idea, image, mood, or emotional turn. It should not require too much setup. It should not reveal a spoiler unless the campaign is built around that reveal. It should not be so long that the design becomes cramped.

Good quote candidates usually fall into five groups:

- A line that captures the book''s central promise
- A sentence that expresses the author''s point of view
- A moment that reveals the emotional tone
- A short passage that gives readers a useful idea
- A phrase that can become a hook for a caption or carousel

For fiction, look for lines that show conflict, longing, place, voice, or character. For nonfiction, look for insights, definitions, warnings, frameworks, or memorable turns of phrase. For memoir, look for lines that feel honest without needing too much context. For poetry, look for compact lines that can breathe visually.

A quote should invite the reader in, not confuse them at the door.

## How to Split Quotes Into Design-Ready Parts

Long quotes often fail on social media because they are pasted as one block. The design becomes crowded, the words shrink, and the reader scrolls past.

A better approach is to split the quote into small parts.

Instead of treating a quote as one paragraph, treat it as a rhythm. Break it into two, three, or four short fragments. Each fragment should feel like it belongs on its own line or section of the design.

For example, a quote can become:

- A short opening phrase
- A middle turn
- A final punch
- A small attribution line

This works especially well for quote card templates because the design can adapt to different quote lengths. A short quote can use one large phrase. A longer quote can be split into smaller blocks. A dramatic quote can use contrast between a large phrase and smaller supporting words.

The quote should not only be readable. It should have movement.

This is why a simple Canva template becomes more powerful when the sheet behind it separates the quote into parts. Instead of forcing every quote into one text box, you can use fields such as Quote Part 1, Quote Part 2, Quote Part 3, Author, Book Title, Mood, Color, and CTA.

The design becomes flexible because the data is prepared properly.

## Matching Quotes to Mood and Category

A quote card should not look the same for every book.

A gothic fiction quote may need shadow, texture, and tension. A romance quote may need warmth and intimacy. A business quote may need confidence and clarity. A poetry quote may need space. A children''s book quote may need color and playfulness. A memoir quote may need honesty and restraint.

This does not mean every quote needs a new design from scratch. It means the quote should carry a mood label.

Useful mood labels might include: Haunting, Romantic, Reflective, Bold, Hopeful, Funny, Practical, Tender, Dark, Inspirational, Minimal, Academic, Playful.

Once quotes are tagged by mood, they can be matched to templates, color sets, backgrounds, and posting categories.

This is where a catalogue becomes more than a list of books. It becomes a content engine.

## Turning One Book Into Multiple Content Types

A single book can produce many types of content.

Start with quote cards — one strong line or short passage from the book, designed cleanly with the book title and author name.

Then create author corner posts that combine a quote with a short author note, writing reflection, or question for readers.

Then create mood cards that focus on the emotional atmosphere of the book. A mood card might use a short phrase, a color palette, and a visual direction.

Then create carousel posts where a quote becomes the opening slide, followed by slides that explain the idea, ask a question, or connect the quote to the book.

Then create captions. A quote can lead into a short note such as: "This line came from a chapter about starting over."

Then create newsletter snippets where a quote can introduce a short update, a behind-the-scenes note, or a recommendation.

One book can produce: 10 quote cards, 5 author reflection posts, 5 mood cards, 3 carousel posts, 3 newsletter snippets, 10 short captions, and several website or catalogue highlights. That is a month of content from one book, before inventing anything new.

## A Simple Weekly Content Plan

A simple weekly plan could look like this:

- **Monday:** Quote card from the book
- **Tuesday:** Short caption explaining the quote or theme
- **Wednesday:** Author corner post with a behind-the-scenes note
- **Thursday:** Mood card showing the atmosphere of the book
- **Friday:** Catalogue or buying link post
- **Weekend:** Reader question, poll, or newsletter snippet

This rhythm gives the author variety without chaos. The author is not saying the same thing every day. They are showing the book from different angles: sentence, meaning, mood, author, and purchase path.

## How a Canva Export Workflow Helps

Design work becomes slow when every post is built manually.

A Canva export workflow helps by separating the content from the design. The sheet holds the quote data. The Canva template holds the visual structure. Bulk Create connects the two.

The sheet can hold fields like: Quote Part 1, Quote Part 2, Quote Part 3, Full Quote, Book Title, Author Name, Genre, Mood, Color Theme, CTA, Catalogue Link, Post Type, Background Style, and Image Prompt.

The Canva template then uses matching element names. When the data is clean, the design can be generated in batches.

The workflow is simple: collect quotes from the book → split long quotes into parts → tag each by mood and category → add author, title, and CTA fields → connect to Canva Bulk Create → review the generated designs → export and schedule.

This turns book content into reusable marketing assets without making the posts feel generic.

## What Authors Should Avoid

Quote marketing can go wrong when it becomes too crowded. Avoid putting too many words on one graphic. Avoid using fonts that are beautiful but unreadable. Avoid placing text over busy images. Avoid using the same quote too many times without a new angle. Avoid posting quotes with no context, no author name, and no path back to the book.

Also avoid turning every quote into a sales pitch. Some posts should simply let the writing breathe. If every caption says "buy now," the reader stops listening.

The best quote marketing balances value and direction. The quote gives the reader a reason to care. The caption or CTA gives them a place to go next.

## How Indie Converters Can Use This

Indie Converters can help authors turn a book profile into a practical content system.

The catalogue already holds structured information about the book. If the book has a title, author, category, mood, buying links, and visual direction, then quote assets can be prepared much faster.

This supports the wider Indie Converters idea: authors keep control of their books, links, channels, and content. The system does not replace the author. It helps the author reuse their own material more intelligently.

A book should not only sit in a catalogue. It should keep producing ways for readers to notice it.

## Final Thought

Indie authors do not need to become full-time content machines.

They need a repeatable way to turn the work they already created into small, useful, beautiful pieces of communication.

Your book contains sentences, moods, questions, ideas, and emotional signals. Those can become quote cards, captions, newsletters, carousels, author posts, and catalogue highlights.

Start with the book. Pull out the lines that still feel alive. Split them clearly. Tag them by mood. Match them to a simple design system. Give each post a path back to the book.

Daily content does not have to come from pressure. It can come from the book itself.'
);
