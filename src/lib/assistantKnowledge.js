export const ASSISTANT_FAQS = [
  {
    topic: 'Getting Started',
    q: 'What is IndieConverters?',
    a: 'IndieConverters is a home for indie authors and the readers who love them: book discovery, publishing tools, and a marketplace to hire cover designers, editors, and other freelance help.',
  },
  {
    topic: 'Getting Started',
    q: 'Do I need an account to browse books?',
    a: 'No. Anyone can browse the catalogue, explore mood-based recommendations, and view author profiles without signing up. You need an account to save books, publish, or hire freelancers.',
  },
  {
    topic: 'Getting Started',
    q: 'Is IndieConverters free to use?',
    a: 'Browsing, saving books, and publishing are free during early access. Freelancers set their own rates for hired work.',
  },
  {
    topic: 'Publishing a Book',
    q: 'Do I give up any rights by publishing here?',
    a: 'No. You retain full copyright. Indie Converters makes no claim on your work, and you can remove your listing at any time.',
  },
  {
    topic: 'Publishing a Book',
    q: 'What file formats do you accept?',
    a: 'We accept .docx, .odt, .rtf, and plain .txt. If your manuscript is in another format, contact support because the conversion tool can support more formats.',
  },
  {
    topic: 'Publishing a Book',
    q: 'Is there a fee to publish?',
    a: 'Converting and listing your book is free during early access. Indie Converters is designed to avoid exclusivity and large upfront fees.',
  },
  {
    topic: 'Publishing a Book',
    q: 'Can I sell elsewhere at the same time?',
    a: 'Yes. Indie Converters is non-exclusive. You can sell on your own site, Amazon, Kobo, Gumroad, Payhip, bookstores, or anywhere else you choose.',
  },
  {
    topic: 'Publishing a Book',
    q: 'Can readers buy the book directly on this site?',
    a: 'Some direct-sale books can be bought through Indie Converters. Discovery-only books send readers to the author, publisher, or retailer store. Final price and availability are confirmed at checkout or by the retailer.',
  },
  {
    topic: 'Publishing a Book',
    q: 'What happens to my uploaded manuscript file?',
    a: 'Your manuscript is stored securely and used to generate your EPUB and PDF. It is not shared with readers or used for another purpose.',
  },
  {
    topic: 'Publishing a Book',
    q: "Can I update my book after it's published?",
    a: 'Yes. You can re-upload a revised manuscript and regenerate the EPUB/PDF at any time. Your listing URL stays the same.',
  },
  {
    topic: 'Finding & Saving Books',
    q: "How do I find books that match what I'm in the mood for?",
    a: 'Use Book Moods on the browse page, or search by title, author, genre, format, language, and keywords.',
  },
  {
    topic: 'Finding & Saving Books',
    q: 'Can I save books to read later?',
    a: 'Yes. Sign in and tap the save icon on any book to add it to your saved list.',
  },
  {
    topic: 'Author Profiles',
    q: 'How do I set up my author profile?',
    a: 'After publishing your first book, go to your dashboard and add your author bio, photo, website, and social links. These appear on your public author page.',
  },
  {
    topic: 'Author Profiles',
    q: 'Can I link my social media and website?',
    a: 'Yes. Your author profile supports links to your website and social channels so readers can follow you outside Indie Converters.',
  },
  {
    topic: 'Freelancers & Hiring',
    q: 'How do I hire a freelancer?',
    a: 'Post a brief describing what you need, such as cover design, editing, ghostwriting, or formatting. Freelancers with matching skills can reach out directly.',
  },
  {
    topic: 'Freelancers & Hiring',
    q: 'How do I get hired as a freelancer?',
    a: 'Create a freelancer profile with your skills, rates, and portfolio, then respond to briefs that match your services.',
  },
  {
    topic: 'Account & Settings',
    q: 'How do I reset my password or change my email?',
    a: 'Go to Account Settings from your dashboard to update your password, email, and notification preferences.',
  },
  {
    topic: 'Account & Settings',
    q: 'How do I delete my account?',
    a: 'Email info@indieconverters.uk and the team will close your account and remove your data.',
  },
];

export const ASSISTANT_GUIDES = [
  {
    id: 'publishing-workflow',
    topic: 'Publishing a Book',
    title: 'Publishing workflow',
    keywords: ['publish', 'publishing', 'upload', 'manuscript', 'preview', 'cover', 'links', 'launch', 'schedule'],
    body: 'Start with a manuscript file, save the book privately, preview reading style, trim size, front matter, EPUB, and print PDF, then add cover, blurb, price, and retailer links. Publish only when you are ready, or keep the book as a draft.',
    cta: { label: 'Start an upload', path: '/upload' },
  },
  {
    id: 'pricing',
    topic: 'Pricing',
    title: 'Pricing and retailer prices',
    keywords: ['price', 'pricing', 'currency', 'eur', 'royalty', 'royalties', 'earn', 'sell', 'fees', 'cost'],
    body: 'Use EUR as the default display currency. Add a clear list price for direct-sale books and retailer prices where available. Retailer prices are estimates on Indie Converters; final prices, delivery, tax, and availability are confirmed by the retailer or checkout flow.',
    cta: { label: 'Estimate royalties', path: '/tools/revenue-calculator' },
  },
  {
    id: 'retailer-links',
    topic: 'Retailer Links',
    title: 'Retailer links and availability',
    keywords: ['retailer', 'retailers', 'amazon', 'kobo', 'google', 'bookshop', 'open library', 'buy', 'get', 'availability', 'store'],
    body: 'For discovery-only books, Indie Converters sends readers to the available retailer, publisher, library, or author store. For direct-sale books, the cart and checkout happen on Indie Converters. The Get it modal compares available options when prices are known.',
    cta: { label: 'Browse the shop', path: '/shop' },
  },
  {
    id: 'private-control',
    topic: 'Publishing a Book',
    title: 'Start privately and stay in control',
    keywords: ['private', 'draft', 'control', 'rights', 'ownership', 'exclusive', 'exclusivity', 'copyright'],
    body: 'You keep ownership of your manuscript, cover, and rights. Uploads begin privately, and you decide when the listing is ready for readers. Indie Converters is non-exclusive, so you can sell elsewhere at the same time.',
    cta: { label: 'Read the author promise', path: '/publish#publish-faq' },
  },
  {
    id: 'account-setup',
    topic: 'Account & Settings',
    title: 'Account and author setup',
    keywords: ['account', 'setup', 'sign', 'login', 'profile', 'dashboard', 'author', 'bio', 'photo'],
    body: 'Create an account to save books, publish, manage listings, and complete your author profile. After your first book is published, your dashboard lets you add bio, photo, website, social links, retailer links, and book updates.',
    cta: { label: 'Go to dashboard', path: '/dashboard' },
  },
  {
    id: 'checkout',
    topic: 'Checkout',
    title: 'Cart, checkout, and payments',
    keywords: ['cart', 'checkout', 'payment', 'shipping', 'order', 'visa', 'mastercard', 'paypal', 'mpesa', 'stripe'],
    body: 'Direct-sale books use the Indie Converters cart and checkout. External retailer titles are purchased on their own retailer pages. Accepted payment method display is part of checkout setup, but the final processor confirmation happens at payment time.',
    cta: { label: 'View cart', path: '/cart' },
  },
];

export function assistantKnowledgeDocuments() {
  return [
    ...ASSISTANT_GUIDES.map(item => ({
      id: item.id,
      type: 'guide',
      topic: item.topic,
      title: item.title,
      body: item.body,
      keywords: item.keywords || [],
      cta: item.cta || null,
    })),
    ...ASSISTANT_FAQS.map((faq, index) => ({
      id: `faq-${index}`,
      type: 'faq',
      topic: faq.topic,
      title: faq.q,
      body: faq.a,
      keywords: [faq.topic, faq.q],
      cta: { label: 'Open Help Center', path: '/help' },
    })),
  ];
}
