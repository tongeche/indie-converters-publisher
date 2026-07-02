import { Link } from 'react-router-dom';
import './Hire.css';

const IconEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconBook    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconImage   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconLayout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>;
const IconArrow   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;

const SERVICES = [
  {
    Icon: IconBook,
    label: 'Ghostwriting',
    desc: 'Full manuscripts and co-written books',
    count: '40+ writers',
  },
  {
    Icon: IconEdit,
    label: 'Editing',
    desc: 'Developmental, copy and proofreading',
    count: '60+ editors',
  },
  {
    Icon: IconImage,
    label: 'Cover Design',
    desc: 'Print and digital cover artwork',
    count: '25+ designers',
  },
  {
    Icon: IconLayout,
    label: 'Formatting',
    desc: 'EPUB, PDF and print-ready files',
    count: '30+ formatters',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Post a brief',
    desc: 'Describe your project — genre, word count, timeline and budget. Takes under 5 minutes.',
  },
  {
    num: '02',
    title: 'Get matched',
    desc: "We surface the best-fit freelancers from our vetted pool. No cold outreach needed.",
  },
  {
    num: '03',
    title: 'Review proposals',
    desc: 'Compare rates, samples and timelines side-by-side. Message freelancers directly.',
  },
  {
    num: '04',
    title: 'Hire with confidence',
    desc: 'Secure payments, milestone tracking and revision guarantees on every project.',
  },
];

const CATS = [
  {
    Icon: IconBook,
    title: 'Ghostwriting',
    desc: 'Work with experienced ghostwriters to bring your story or ideas to life — from outlines to full manuscripts.',
    to: '/hire/browse?service=ghostwriting',
  },
  {
    Icon: IconEdit,
    title: 'Editing & Proofreading',
    desc: 'Developmental editors, copy editors and proofreaders who specialise in indie publishing.',
    to: '/hire/browse?service=editing',
  },
  {
    Icon: IconImage,
    title: 'Cover Design',
    desc: 'Genre-savvy designers who know what sells on Amazon, IngramSpark and beyond.',
    to: '/hire/browse?service=cover-design',
  },
  {
    Icon: IconLayout,
    title: 'Formatting & Typesetting',
    desc: 'Get a clean, retailer-ready EPUB and print PDF that passes every validator first time.',
    to: '/hire/browse?service=formatting',
  },
];

const TRUST = [
  'Vetted freelancers only',
  'Milestone-based payments',
  'Revision guarantees',
  'Dedicated to indie authors',
];

export default function Hire() {
  return (
    <div className="hire-page">

      {/* ── Hero ── */}
      <section className="hire-hero">
        <div className="container hire-hero-inner">

          {/* Left */}
          <div className="hire-hero-left">
            <span className="hire-hero-eyebrow">·· Hire Freelancer</span>
            <h1 className="hire-hero-h1">
              Find your book's <em>perfect</em> collaborator
            </h1>
            <p className="hire-hero-sub">
              Connect with vetted ghostwriters, editors, cover designers and formatters who specialise in indie publishing. Post a brief and get matched in 24 hours.
            </p>
            <div className="hire-hero-actions">
              <Link to="/hire/post" className="btn btn-primary">Post a Brief</Link>
              <Link to="/hire/browse" className="btn btn-ghost">Browse Freelancers</Link>
            </div>
          </div>

          {/* Right — service cards */}
          <div className="hire-hero-cards">
            {SERVICES.map(({ Icon, label, desc, count }) => (
              <div key={label} className="hire-service-card">
                <div className="hire-service-icon"><Icon /></div>
                <span className="hire-service-label">{label}</span>
                <span className="hire-service-desc">{desc}</span>
                <span className="hire-service-count">{count}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="hire-trust">
        <div className="container hire-trust-inner">
          {TRUST.map(t => (
            <div key={t} className="hire-trust-item">
              <div className="hire-trust-dot" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="hire-how">
        <div className="container">
          <p className="hire-section-label">How it works</p>
          <h2 className="hire-section-h2">From brief to published,<br />in four steps</h2>
          <p className="hire-section-sub">
            We handle the matching so you can focus on the creative work. No endless searching, no cold DMs.
          </p>

          <div className="hire-steps">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="hire-step">
                <div className="hire-step-num">{num}</div>
                <h3 className="hire-step-title">{title}</h3>
                <p className="hire-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service categories ── */}
      <section className="hire-cats">
        <div className="container">
          <p className="hire-section-label">Browse by service</p>
          <h2 className="hire-section-h2">Every skill your book needs</h2>
          <p className="hire-section-sub">
            All freelancers are reviewed and approved before joining — quality you can count on.
          </p>

          <div className="hire-cats-grid">
            {CATS.map(({ Icon, title, desc, to }) => (
              <Link key={title} to={to} className="hire-cat-card">
                <div className="hire-cat-icon"><Icon /></div>
                <div className="hire-cat-body">
                  <h3 className="hire-cat-title">{title}</h3>
                  <p className="hire-cat-desc">{desc}</p>
                  <span className="hire-cat-link">Browse {title} <IconArrow /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
