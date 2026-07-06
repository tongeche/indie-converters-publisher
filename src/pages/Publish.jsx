import { useState } from 'react';
import { Link } from 'react-router-dom';
import publishBannerImg from '../assets/publish CTA banner.webp';
import SEO from '../components/SEO';
import './Publish.css';

const STEPS = [
  {
    num: '01',
    title: 'Upload your manuscript',
    detail: 'Drop in a .docx, .odt, .rtf, or .txt file. No templates, no special styles — we handle whatever state it\'s in.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 22h12M16 18V8m0 0-4 4m4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 26a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10l-6-6H8a2 2 0 0 0-2 2v20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Automated conversion',
    detail: 'Pandoc converts your file into a standards-compliant EPUB3 and print-ready PDF in minutes.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4v4M16 24v4M4 16h4M24 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8.34 8.34l2.83 2.83M20.83 20.83l2.83 2.83M8.34 23.66l2.83-2.83M20.83 11.17l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Preview and add details',
    detail: 'Read through your formatted book in the browser, add a title, blurb, genre, and cover. A live preview updates as you type.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="16" r="3.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Published',
    detail: 'Your book gets its own permanent page. Readers can find it here; you get a link to point them wherever you sell.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3C8.82 3 3 8.82 3 16s5.82 13 13 13 13-5.82 13-13S23.18 3 16 3Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M3 16h26M16 3c-3.5 4-5.5 8.5-5.5 13S12.5 25 16 29c3.5-4 5.5-8.5 5.5-13S19.5 7 16 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
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
      <SEO
        title="Publish Your Book | IndieConverters"
        description="Upload your manuscript, convert it to EPUB and PDF, and list it for readers — free during early access, no exclusivity."
        path="/publish"
      />
      {/* Hero */}
      <section className="publish-hero">
        <img src={publishBannerImg} alt="" className="publish-hero-img" />
        <div className="publish-hero-overlay" />
        <div className="container publish-hero-content">
          <h1>Publish without<br />compromise.</h1>
          <p>
            Upload your manuscript. Get a proper EPUB and print file. List your book here, keep every other right you have. No exclusivity clause. No cart on this site. No surprise fees.
          </p>
          <Link to="/upload" className="btn publish-hero-btn">Upload a manuscript →</Link>
        </div>
      </section>

      {/* Process */}
      <section className="section process">
        <div className="container">
          <div className="process-header">
            <h2>How it works</h2>
            <p className="process-subtitle">
              Upload a manuscript. Get a proper book file. List it here — no middlemen, no fees, no rights grab.
            </p>
          </div>

          <div className="process-flow">
            {STEPS.map((s, i) => (
              <div key={i} className="process-flow-item">
                <div className="process-card">
                  <div className="process-card-icon">{s.icon}</div>
                  <div className="process-card-body">
                    <span className="process-card-num">{s.num}</span>
                    <h3 className="process-card-title">{s.title}</h3>
                    <p className="process-card-detail">{s.detail}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="process-connector" aria-hidden="true">
                    <svg width="64" height="32" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d={i % 2 === 0
                          ? 'M2 28 Q32 4 62 28'
                          : 'M2 4 Q32 28 62 4'}
                        stroke="#C9BDF5"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        fill="none"
                      />
                      {i % 2 === 0 ? (
                        <polyline points="56,22 62,28 56,32" fill="none" stroke="#C9BDF5" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                      ) : (
                        <polyline points="56,8 62,4 56,0" fill="none" stroke="#C9BDF5" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                      )}
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Print cover tool */}
      <section className="section publish-tool-band">
        <div className="container publish-tool-inner">
          <div>
            <div className="eyebrow">Print covers</div>
            <h2>Know the full-wrap size before you design.</h2>
            <p>
              Calculate spine width, bleed, safe area, and 300 DPI export dimensions for paperback covers before you open Canva or send a brief to a designer.
            </p>
          </div>
          <Link to="/tools/print-cover-calculator" className="btn btn-outline">Open cover calculator</Link>
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
