import { Link } from 'react-router-dom';
import './GetHired.css';

const IconEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconBook    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconImage   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconLayout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;

const ROLES = [
  { Icon: IconBook,   label: 'Ghostwriter',   desc: 'Write books in collaboration with indie authors', earn: '$800 – $8k / project' },
  { Icon: IconEdit,   label: 'Editor',         desc: 'Developmental, copy editing and proofreading',   earn: '$200 – $2k / project' },
  { Icon: IconImage,  label: 'Cover Designer', desc: 'Create covers for print and digital formats',     earn: '$150 – $1.5k / project' },
  { Icon: IconLayout, label: 'Formatter',      desc: 'Produce retailer-ready EPUB and print PDFs',     earn: '$80 – $600 / project' },
];

const STATS = [
  { value: '500+', label: 'indie authors hiring now' },
  { value: '$1.2M', label: 'paid to freelancers to date' },
  { value: '4.9★', label: 'average freelancer rating' },
];

const STEPS = [
  {
    num: '01',
    title: 'Create your profile',
    desc: 'Showcase your portfolio, rates and services. Takes 10 minutes to set up.',
  },
  {
    num: '02',
    title: 'Browse open projects',
    desc: 'Filter by service type, budget and timeline. Apply to the ones that fit.',
  },
  {
    num: '03',
    title: 'Submit a proposal',
    desc: "Send a personalised pitch. We'll notify you as soon as the author responds.",
  },
  {
    num: '04',
    title: 'Get paid securely',
    desc: 'Milestone payments mean you always get paid for work completed.',
  },
];

const PROJECTS = [
  {
    tag: 'Editing',
    title: 'Copy editor needed for 80k-word fantasy novel',
    desc: 'Looking for an experienced copy editor with fantasy genre knowledge. Manuscript ready, aiming for publication in Q4.',
    budget: '$600 – $900',
    deadline: 'Deadline: 6 weeks',
    to: '/get-hired/projects',
  },
  {
    tag: 'Cover Design',
    title: 'Illustrated cover for YA contemporary romance',
    desc: 'Need a vibrant, illustrated cover for a YA romance with a summer beach setting. Must have experience with character-focused covers.',
    budget: '$350 – $600',
    deadline: 'Deadline: 3 weeks',
    to: '/get-hired/projects',
  },
  {
    tag: 'Ghostwriting',
    title: 'Co-writer for entrepreneur memoir (full manuscript)',
    desc: 'Entrepreneur with a compelling story seeking an experienced ghostwriter. Will be closely involved — this is a collaboration, not a buyout.',
    budget: '$4,000 – $8,000',
    deadline: 'Deadline: 6 months',
    to: '/get-hired/projects',
  },
  {
    tag: 'Formatting',
    title: 'EPUB + Print PDF formatting for 5-book box set',
    desc: 'Series of five novellas needs consistent formatting across EPUB and print-ready PDF. Existing template can be shared.',
    budget: '$300 – $500',
    deadline: 'Deadline: 2 weeks',
    to: '/get-hired/projects',
  },
];

export default function GetHired() {
  return (
    <div className="gh-page">

      {/* ── Hero ── */}
      <section className="gh-hero">
        <div className="container gh-hero-inner">

          {/* Left */}
          <div className="gh-hero-left">
            <span className="gh-hero-eyebrow">·· Get Hired</span>
            <h1 className="gh-hero-h1">
              Turn your skills into <em>income</em> helping indie authors
            </h1>
            <p className="gh-hero-sub">
              Join our curated community of editors, ghostwriters, designers and formatters. Find projects that fit your schedule and get paid securely through the platform.
            </p>
            <div className="gh-hero-actions">
              <Link to="/get-hired/profile" className="btn btn-primary">Create Your Profile</Link>
              <Link to="/get-hired/projects" className="btn btn-outline">Browse Projects</Link>
            </div>
          </div>

          {/* Right — role cards */}
          <div className="gh-hero-roles">
            {ROLES.map(({ Icon, label, desc, earn }) => (
              <div key={label} className="gh-role-card">
                <div className="gh-role-icon"><Icon /></div>
                <div>
                  <div className="gh-role-label">{label}</div>
                  <div className="gh-role-desc">{desc}</div>
                </div>
                <span className="gh-role-earn">{earn}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <div className="gh-stats">
        <div className="container gh-stats-inner">
          {STATS.map(({ value, label }) => (
            <div key={label} className="gh-stat">
              <span className="gh-stat-value">{value}</span>
              <span className="gh-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="gh-how">
        <div className="container">
          <p className="gh-section-label">How it works</p>
          <h2 className="gh-section-h2">From profile to paid project,<br />in four steps</h2>
          <p className="gh-section-sub">
            We make it easy to get in front of authors who are ready to hire. No bidding wars, just fair work.
          </p>

          <div className="gh-steps">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="gh-step">
                <div className="gh-step-num">{num}</div>
                <h3 className="gh-step-title">{title}</h3>
                <p className="gh-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured projects ── */}
      <section className="gh-projects">
        <div className="container">
          <p className="gh-section-label">Open projects</p>
          <h2 className="gh-section-h2">Work available right now</h2>
          <p className="gh-section-sub">
            A sample of what indie authors are hiring for this month.
          </p>

          <div className="gh-projects-grid">
            {PROJECTS.map(({ tag, title, desc, budget, deadline, to }) => (
              <Link key={title} to={to} className="gh-project-card">
                <span className="gh-project-tag">{tag}</span>
                <h3 className="gh-project-title">{title}</h3>
                <p className="gh-project-desc">{desc}</p>
                <div className="gh-project-meta">
                  <span className="gh-project-budget">{budget}</span>
                  <span className="gh-project-deadline">{deadline}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
