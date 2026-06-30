import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Publish.css';

const STEPS = [
  {
    num: '01',
    title: 'Upload your manuscript',
    detail: 'We accept .docx, .odt, .rtf, and plain .txt. No special styles or templates required — Pandoc handles the conversion from whatever state your file is in.',
  },
  {
    num: '02',
    title: 'Automated conversion',
    detail: "Pandoc converts your manuscript into a standards-compliant EPUB3 and a print-ready PDF. This takes a few minutes. You'll get a notification when it's ready.",
  },
  {
    num: '03',
    title: 'Preview and add details',
    detail: 'Read through your formatted book in the browser, then add a title, blurb, genre, price, and pick a cover palette. A live cover preview updates as you type.',
  },
  {
    num: '04',
    title: 'Published on Indie Converters',
    detail: 'Your book gets its own permanent page here. Readers can browse and find it. You get a link to point them to wherever you already sell — your own site, Gumroad, Payhip, wherever.',
  },
];

const FAQS = [
  {
    q: 'Do I give up any rights by publishing here?',
    a: 'None whatsoever. You retain full copyright. We make no claim on your work. You can remove your listing at any time.',
  },
  {
    q: 'What file formats do you accept?',
    a: 'We accept .docx (Word), .odt (LibreOffice), .rtf, and plain .txt. If your manuscript is in a different format, contact us — Pandoc supports dozens more.',
  },
  {
    q: 'Is there a fee to publish?',
    a: "Converting and listing your book is free during our early-access period. We're working on a sustainable model that doesn't require exclusivity or large upfront fees.",
  },
  {
    q: 'Can readers buy the book directly on this site?',
    a: "Not yet, and possibly never — that's a deliberate choice. We list your book and send readers to wherever you sell it. You set the price and keep the relationship with your audience.",
  },
  {
    q: 'What happens to my uploaded manuscript file?',
    a: "It's stored securely and used only to generate your EPUB and PDF. We don't share it or use it for any other purpose.",
  },
  {
    q: "Can I update my book after it's published?",
    a: 'Yes. You can re-upload a revised manuscript and regenerate the EPUB/PDF at any time. Your listing URL stays the same.',
  },
];

export default function Publish() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="publish-page">
      {/* Hero */}
      <section className="publish-hero">
        <div className="container publish-hero-inner">
          <div className="publish-hero-text">
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>For authors</div>
            <h1>Publish without compromise.</h1>
            <p>
              Upload your manuscript. Get a proper EPUB and print file. List your book here, keep every other right you have. No exclusivity clause. No cart on this site. No surprise fees.
            </p>
            <Link to="/upload" className="btn btn-ghost">Upload a manuscript →</Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section process">
        <div className="container">
          <div className="eyebrow">The process</div>
          <h2>How it works</h2>
          <div className="process-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="process-step">
                <div className="process-step-header">
                  <div className="process-num"><span className="process-dot">··</span>{s.num}</div>
                  <h3>{s.title}</h3>
                </div>
                <p>{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rights */}
      <section className="section rights-band">
        <div className="container rights-inner">
          <div>
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Your rights</div>
            <h2>You keep everything.</h2>
            <p>Publishing on Indie Converters grants us a non-exclusive licence to display your book's title, cover, and sample on this site. That's it. You can pull your listing any time, sell elsewhere simultaneously, and we'll never ask for exclusivity.</p>
          </div>
          <div className="rights-checklist">
            {['You own your copyright', 'Sell on any platform simultaneously', 'Remove your listing any time', 'No exclusivity window', 'No revenue share on outside sales'].map(item => (
              <div key={item} className="rights-item">
                <span className="rights-check">··</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq">
        <div className="container">
          <div className="eyebrow">Common questions</div>
          <h2>FAQ</h2>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="faq-answer"><p>{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section publish-cta-band">
        <div className="container publish-cta-inner">
          <h2>Ready to publish?</h2>
          <p>Upload takes two minutes. Conversion takes a few more. Your book could be listed by this afternoon.</p>
          <Link to="/upload" className="btn btn-primary">Upload your manuscript</Link>
        </div>
      </section>
    </div>
  );
}
