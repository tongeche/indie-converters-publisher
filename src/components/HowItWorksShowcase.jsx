import { Link } from 'react-router-dom';
import lightsFutureCoverImg from '../assets/dammie-covers/dammie01.png';
import './HowItWorksShowcase.css';

const WORKFLOW_ROWS = [
  { step: '01', label: 'Book details', status: 'Saved', detail: 'Title, author, audience, blurb' },
  { step: '02', label: 'Manuscript', status: 'Analysing', detail: '.docx structure and headings' },
  { step: '03', label: 'Preview files', status: 'Ready', detail: 'EPUB, print trim, front matter' },
  { step: '04', label: 'Cover & links', status: 'Draft', detail: 'Cover, pricing, retailer links' },
];

const BENEFITS = [
  {
    icon: '··',
    title: 'Start privately.',
    body: 'Upload a draft, save progress, and keep the book hidden until the manuscript, cover, and links are ready.',
    link: 'Start an upload',
    to: '/upload',
  },
  {
    icon: '↗',
    title: 'Preview before launch.',
    body: 'Check reading style, chapter structure, front and back matter, EPUB flow, and print trim before publishing.',
    link: 'See publishing path',
    to: '/publish',
  },
  {
    icon: '✓',
    title: 'Stay in control.',
    body: 'Publish today, schedule a release, or keep a private draft. Your rights and sales links remain yours.',
    link: 'Publish when ready',
    to: '/publish',
  },
  {
    icon: '$',
    title: 'Sell & earn.',
    body: 'Add retailer links, estimate royalties, and track how each book performs once readers start clicking through.',
    link: 'Track royalties',
    to: '/dashboard',
  },
];

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M3 16v5h5" />
      <path d="M21 16v5h-5" />
    </svg>
  );
}

export default function HowItWorksShowcase() {
  return (
    <section className="how-showcase" aria-labelledby="how-showcase-heading">
      <div className="container how-showcase-inner">
        <div className="how-visual" aria-hidden="true">
          <button className="how-expand" type="button" tabIndex="-1" aria-label="Expand">
            <IconExpand />
          </button>

          <div className="how-browser">
            <div className="how-browser-bar">
              <span />
              <span />
              <span />
              <b>Author workspace</b>
            </div>

            <div className="how-browser-body">
              <aside className="how-sidebar">
                <div className="how-logo">.in</div>
                <strong>Indie Converters</strong>
                <span>Draft workspace</span>
                <nav>
                  <b>Book</b>
                  <b>Manuscript</b>
                  <b>Preview</b>
                  <b>Publish</b>
                </nav>
              </aside>

              <main className="how-dashboard">
                <div className="how-dashboard-head">
                  <span>Continue your book</span>
                  <strong>The Lights in the Future</strong>
                </div>

                <div className="how-alert">
                  <span>Action needed</span>
                  <p>Review two manuscript notes before generating final files.</p>
                  <button type="button" tabIndex="-1">Fix notes</button>
                </div>

                <div className="how-stats">
                  <div>
                    <span>Estimated length</span>
                    <strong>246 pages</strong>
                  </div>
                  <div>
                    <span>Release plan</span>
                    <strong>Draft</strong>
                  </div>
                </div>

                <div className="how-workflow-table">
                  <div className="how-table-head">
                    <span>Step</span>
                    <span>Status</span>
                    <span>What is checked</span>
                  </div>
                  {WORKFLOW_ROWS.map(row => (
                    <div className="how-workflow-row" key={row.step}>
                      <span><b>{row.step}</b>{row.label}</span>
                      <strong>{row.status}</strong>
                      <span>{row.detail}</span>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>

          <div className="how-floating-card how-floating-card--upload">
            <strong>Manuscript check</strong>
            <p>Headings detected, page estimate ready, EPUB validation queued.</p>
            <code>upload.accept('.docx')</code>
          </div>

          <div className="how-floating-card how-floating-card--preview">
            <strong>Reader preview</strong>
            <p>Proof the interior before anyone sees the listing.</p>
            <code>preview.build('epub')</code>
          </div>

          <div className="how-floating-card how-floating-card--publish">
            <img src={lightsFutureCoverImg} alt="" />
            <div>
              <strong>Publish choice</strong>
              <p>Draft · Schedule · Publish today</p>
            </div>
          </div>
        </div>

        <div className="how-benefits">
          {BENEFITS.map(item => (
            <article className="how-benefit" key={item.title}>
              <span className="how-benefit-icon">{item.icon}</span>
              <h3>{item.title} <span>{item.body}</span></h3>
              <Link to={item.to}>{item.link} →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
