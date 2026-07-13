import { useState } from 'react';
import { Link } from 'react-router-dom';
import publishBannerImg from '../assets/publish CTA banner.webp';
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

const COST_ITEMS = [
  { label: 'Start a draft', value: '$0', note: 'no charge to begin' },
  { label: 'Convert files', value: '$0', note: 'during early access' },
  { label: 'List your book', value: '$0', note: 'no listing fee' },
  { label: 'Print cost', value: 'varies', note: 'based on format' },
];

const ROYALTY_ROWS = [
  ['Book price', '$12.99'],
  ['Estimated print cost', '-$3.65'],
  ['Estimated fees', '-$0.68'],
  ['Author margin estimate', '$8.66', 'strong'],
];

const WORD_TEMPLATE_GROUPS = [
  {
    title: 'Writing starters',
    description: 'Genre-aware sample files with Heading 1 chapters, body text, scene breaks, and notes authors can replace.',
    templates: [
      {
        title: 'Fiction starter',
        note: 'Chapter opener, body text, and a simple scene break.',
        meta: 'Novel / short fiction',
        file: '/templates/indie-fiction-starter.docx',
      },
      {
        title: 'Romance starter',
        note: 'A warm opening page with dialogue and emotional setup.',
        meta: 'Romance / intimate fiction',
        file: '/templates/indie-romance-starter.docx',
      },
      {
        title: 'Nonfiction starter',
        note: 'A clean model for a practical chapter, essay, or guide.',
        meta: 'Memoir / essays / guides',
        file: '/templates/indie-nonfiction-starter.docx',
      },
      {
        title: 'Memoir starter',
        note: 'Scene, reflection, and quote styles for personal narrative.',
        meta: 'Memoir / personal essay',
        file: '/templates/indie-memoir-starter.docx',
      },
      {
        title: 'Poetry starter',
        note: 'Poem titles, lines, section headings, and notes.',
        meta: 'Poetry / collections',
        file: '/templates/indie-poetry-starter.docx',
      },
      {
        title: 'Story collection',
        note: 'Repeatable story-title structure for anthologies.',
        meta: 'Short stories / anthology',
        file: '/templates/indie-short-story-collection-starter.docx',
      },
    ],
  },
  {
    title: 'Print size starters',
    description: 'Blank-but-guided files with page size, starter margins, and gutter already set for common paperback formats.',
    templates: [
      {
        title: '5 x 8 in',
        note: 'Compact fiction and short nonfiction paperback setup.',
        meta: 'Print trim',
        file: '/templates/indie-print-5x8-starter.docx',
      },
      {
        title: '5.5 x 8.5 in',
        note: 'Popular literary fiction, poetry, and memoir setup.',
        meta: 'Print trim',
        file: '/templates/indie-print-5.5x8.5-starter.docx',
      },
      {
        title: '6 x 9 in',
        note: 'General trade paperback setup for fiction and nonfiction.',
        meta: 'Print trim',
        file: '/templates/indie-print-6x9-starter.docx',
      },
      {
        title: '8.5 x 11 in',
        note: 'Large format setup for workbooks, guides, and manuals.',
        meta: 'Print trim',
        file: '/templates/indie-print-8.5x11-starter.docx',
      },
    ],
  },
  {
    title: 'Front and back matter',
    description: 'A copy-ready pack for the pages authors often forget until the end.',
    templates: [
      {
        title: 'Matter pack',
        note: 'Title, copyright, dedication, epigraph, acknowledgements, about the author, and links.',
        meta: 'Front / back matter',
        file: '/templates/indie-front-back-matter-pack.docx',
      },
    ],
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
          <div className="publish-hero-copy">
            <span className="publish-hero-kicker">For indie authors</span>
            <h1>Publish your book without giving up control.</h1>
            <p>
              Start with your manuscript, prepare reader-ready files, add your cover and links, then publish when you are ready. No exclusivity, no rights grab, no pressure to go live today.
            </p>
            <div className="publish-hero-actions">
              <Link to="/upload" className="btn publish-hero-btn">Start your book upload</Link>
              <a href="#publish-process" className="publish-hero-link">See the path</a>
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

          <div className="process-afterword">
            <span>Start as a draft. Publish only when everything is ready.</span>
            <Link to="/upload">Open the upload wizard →</Link>
          </div>
        </div>
      </section>

      {/* Manuscript templates */}
      <section className="section manuscript-templates" aria-labelledby="manuscript-templates-heading">
        <div className="container manuscript-templates-inner">
          <div className="manuscript-templates-copy">
            <span className="manuscript-templates-kicker">Word templates</span>
            <h2 id="manuscript-templates-heading">Start with a clean Word file.</h2>
            <p>
              Download a .docx starter, replace the sample text, and upload it when you are ready. Each file uses simple Word styles so conversion stays predictable.
            </p>
          </div>

          <div className="manuscript-template-library">
            {WORD_TEMPLATE_GROUPS.map((group) => (
              <div
                className={`manuscript-template-group${group.templates.length === 1 ? ' manuscript-template-group--single' : ''}`}
                key={group.title}
              >
                <div className="manuscript-template-group-head">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>

                <div className="manuscript-template-grid">
                  {group.templates.map((template) => (
                    <article className="manuscript-template-card" key={template.file}>
                      <div className="manuscript-template-preview" aria-hidden="true">
                        <span />
                        <strong>{template.meta === 'Print trim' ? template.title : 'Chapter One'}</strong>
                        <i />
                        <i />
                        <i />
                      </div>
                      <div>
                        <span className="manuscript-template-meta">{template.meta}</span>
                        <h4>{template.title}</h4>
                        <p>{template.note}</p>
                      </div>
                      <a href={template.file} className="manuscript-template-link" download>
                        Download DOCX
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Costs and royalties */}
      <section className="section publish-economics" aria-labelledby="publish-economics-heading">
        <div className="container">
          <div className="publish-economics-header">
            <span className="publish-economics-kicker">Costs & royalties</span>
            <h2 id="publish-economics-heading">Know the money before launch</h2>
            <p>
              Start free during early access, then estimate print costs and author margin before your book goes live.
            </p>
          </div>

          <div className="publish-economics-inner">
            <div className="publish-economics-column">
              <div className="publish-economics-panel-head">
                <span className="publish-economics-kicker">Costs</span>
                <h3>Free to prepare. Print cost depends on the book.</h3>
              </div>

              <div className="publish-cost-list" aria-label="Publishing cost summary">
                {COST_ITEMS.map((item, index) => (
                  <div key={item.label} className={`publish-cost-row${index === 0 ? ' publish-cost-row--active' : ''}`}>
                    <div>
                      <span>{item.label}</span>
                      <small>{item.note}</small>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <p className="publish-economics-note">
                Trim size, page count, paper, cover format, and sales channel are the main variables.
              </p>

              <Link to="/upload" className="btn publish-economics-btn">Start a draft estimate</Link>
            </div>

            <div className="publish-economics-column">
              <div className="publish-economics-panel-head">
                <span className="publish-economics-kicker">Royalties</span>
                <h3>Compare margin before you choose a sales route.</h3>
              </div>

              <div className="publish-royalty-card" aria-label="Royalty example">
                <div className="publish-example-label">Example: direct paperback sale</div>
                {ROYALTY_ROWS.map(([label, value, kind]) => (
                  <div key={label} className={`publish-royalty-row${kind === 'strong' ? ' publish-royalty-row--strong' : ''}`}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <p className="publish-economics-note">
                Direct sales often keep more money with the author. Actual payouts vary by retailer, returns, discounts, and print settings.
              </p>

              <Link to="/tools/revenue-calculator" className="btn publish-economics-btn publish-economics-btn--solid">
                Try the royalty calculator
              </Link>
            </div>
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

      {/* CTA */}
      <section className="section publish-cta-band">
        <div className="container publish-cta-inner">
          <span className="publish-cta-kicker">No need to go live today</span>
          <h2>Start with a draft.</h2>
          <p>Upload your manuscript, preview the files, and save your book privately until you are ready to publish.</p>
          <Link to="/upload" className="btn btn-primary">Start your book upload</Link>
        </div>
      </section>
    </div>
  );
}
