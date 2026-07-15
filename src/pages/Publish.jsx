import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import publishBannerImg from '../assets/publish CTA banner.webp';
import EndPageCta from '../components/EndPageCta';
import SEO from '../components/SEO';
import './Publish.css';

const STEPS = [
  {
    num: '01',
    title: 'Upload your manuscript',
    detail: 'Start with a draft or final file. Upload .docx, .odt, .rtf, or .txt and save your work before anything goes public.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 22h12M16 18V8m0 0-4 4m4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 26a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10l-6-6H8a2 2 0 0 0-2 2v20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Preview your book files',
    detail: 'Check the reading style, trim size, front matter, EPUB, and print-ready PDF preview before you move forward.',
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
    title: 'Add cover, price, and links',
    detail: 'Use a finished cover or starter template, add your blurb and sales links, then estimate royalties before launch.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="16" r="3.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Publish now or schedule',
    detail: 'Go live when the book is ready, or keep it private as a draft while you review files, links, and launch assets.',
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
    q: "Can I update my book after it's published?",
    a: 'Yes. You can re-upload a revised manuscript and regenerate your files at any time. Your listing URL stays the same.',
  },
  {
    q: 'Can I sell elsewhere at the same time?',
    a: 'Yes. Indie Converters is non-exclusive. You can sell on your own site, Amazon, Kobo, Gumroad, Payhip, bookstores, or anywhere else you choose.',
  },
  {
    q: 'Can readers buy the book directly on this site?',
    a: "Not yet, and possibly never — that's a deliberate choice. We list your book and send readers to wherever you sell it. You set the price and keep the relationship with your audience.",
  },
  {
    q: 'What file formats do you accept?',
    a: 'We accept .docx (Word), .odt (LibreOffice), .rtf, and plain .txt. If your manuscript is in a different format, contact us — Pandoc supports dozens more.',
  },
  {
    q: 'What happens to my uploaded manuscript file?',
    a: "It's stored securely and used only to generate your EPUB and PDF. We don't share it or use it for any other purpose.",
  },
];

const ESSENTIALS = [
  {
    title: 'Free to start',
    detail: 'No listing fees during early access. Prepare your files and list your book at no cost.',
  },
  {
    title: 'Keep every right',
    detail: 'Full copyright stays with you. No exclusivity — sell here and anywhere else too.',
  },
  {
    title: 'Know your margin',
    detail: 'Estimate print cost and royalties before you set a price.',
    link: { to: '/tools/revenue-calculator', label: 'Try the royalty calculator' },
  },
];

export default function Publish() {
  const [openFaq, setOpenFaq] = useState(null);
  const location = useLocation();

  // Client-side navigation (e.g. the Publish nav dropdown's quick-jump
  // links) doesn't trigger the browser's native anchor scroll, so scroll
  // to the target section ourselves whenever the hash changes.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }));
  }, [location.hash]);

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
          <div className="publish-hero-copy">
            <span className="publish-hero-kicker">For indie authors</span>
            <h1>Publish your book without giving up control.</h1>
            <div className="publish-hero-actions">
              <Link to="/upload" className="btn publish-hero-btn">Start your book upload</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section process" id="publish-process">
        <div className="container">
          <div className="process-header">
            <div className="eyebrow">Publishing workflow</div>
            <h2>From manuscript to listed book</h2>
            <p className="process-subtitle">
              A guided path for getting a book ready without forcing you to publish before the manuscript, cover, and links are final.
            </p>
          </div>

          <div className="process-flow">
            {STEPS.map((s, i) => (
              <div key={i} className="process-card">
                <div className="process-card-icon">{s.icon}</div>
                <div className="process-card-body">
                  <span className="process-card-num">{s.num}</span>
                  <h3 className="process-card-title">{s.title}</h3>
                  <p className="process-card-detail">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="process-afterword">
            <span>Need a starting file?</span>
            <Link to="/publish/templates">Browse manuscript templates →</Link>
          </div>
        </div>
      </section>

      {/* Essentials: costs, rights, royalties — brief, links out for detail */}
      <section className="section publish-essentials" id="publish-essentials">
        <div className="container">
          <div className="publish-essentials-header">
            <span className="publish-essentials-kicker">Costs & royalties</span>
            <h2>Know the essentials before you launch</h2>
          </div>

          <div className="publish-essentials-grid">
            {ESSENTIALS.map((item) => (
              <div className="publish-essentials-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                {item.link && (
                  <Link to={item.link.to} className="publish-essentials-link">{item.link.label} →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq" id="publish-faq">
        <div className="container">
          <div className="eyebrow">Common questions</div>
          <h2>Questions before you start</h2>
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

      <EndPageCta
        title="Ready to publish on your terms?"
        subtitle="Start with a private draft and publish when you are ready."
        actionLabel="Upload your manuscript"
        to="/upload"
      />
    </div>
  );
}
