import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './GetHired.css';

const IconEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconImage   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconLayout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconLaunch  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M5 19c2.8-.7 5.1-2.4 6.8-5.1"/><path d="M14 4h6v6"/><path d="M20 4 9.5 14.5"/><path d="M5 19l2.5-7 4.5 4.5z"/></svg>;
const IconBrief   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="42" height="42"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12h5"/><path d="M9 16h3"/><path d="m16.5 17.5 3-3 1.5 1.5-3 3-2 .5z"/></svg>;
const IconChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="42" height="42"><path d="M5 5h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 4v-4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"/><path d="M14 10h7v7l-3-3h-4z"/></svg>;
const IconUserFit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="42" height="42"><path d="M15 20v-1.5A4.5 4.5 0 0 0 10.5 14h-3A4.5 4.5 0 0 0 3 18.5V20"/><circle cx="9" cy="7" r="4"/><circle cx="18" cy="16" r="4"/><path d="m16.4 16 1.1 1.1 2.1-2.3"/></svg>;
const IconBookReady = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="42" height="42"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M18 2v4"/><path d="M16 4h4"/></svg>;

const AUTHOR_SUPPORT = [
  {
    Icon: IconEdit,
    title: 'Manuscript polish',
    services: 'Developmental editing, copy editing, proofreading',
    desc: 'Help authors move from rough draft to a manuscript readers can trust.',
  },
  {
    Icon: IconImage,
    title: 'Cover and print design',
    services: 'Ebook covers, paperback wraps, KDP-ready files',
    desc: 'Turn book details into covers that feel credible on stores and socials.',
  },
  {
    Icon: IconLayout,
    title: 'Interior formatting',
    services: 'EPUB, print PDF, trim sizes, front and back matter',
    desc: 'Prepare clean reading files so authors are not stuck wrestling layout tools.',
  },
  {
    Icon: IconLaunch,
    title: 'Launch support',
    services: 'Blurbs, metadata, social copy, book-page polish',
    desc: 'Help authors explain the book clearly when it is time to share it.',
  },
];

const STEPS = [
  {
    num: '01',
    Icon: IconBrief,
    title: 'Author posts a brief',
    desc: 'Authors share what they need: manuscript, cover, formatting, metadata, or other publishing support.',
  },
  {
    num: '02',
    Icon: IconChat,
    title: 'You respond with proof',
    desc: 'Share relevant samples, experience, and a clear approach so authors can see the value you bring.',
  },
  {
    num: '03',
    Icon: IconUserFit,
    title: 'Author chooses the right fit',
    desc: 'Authors compare skills, rates, and feedback to find the best match for their project.',
  },
  {
    num: '04',
    Icon: IconBookReady,
    title: 'Book moves forward',
    desc: 'Work together to deliver high-quality files, better metadata, and a book ready for readers.',
  },
];

export default function GetHired() {
  return (
    <div className="gh-page">
      <SEO
        title="Get Hired | IndieConverters"
        description="Create a freelancer profile and get discovered by indie authors looking for editing, cover design, ghostwriting, and formatting help."
        path="/get-hired"
      />

      {/* ── Hero ── */}
      <section className="gh-hero">
        <div className="container gh-hero-inner">

          <div className="gh-hero-left">
            <h1 className="gh-hero-h1">
              Helping indie authors bring their books to life
            </h1>
            <p className="gh-hero-sub">
              Work on real book projects: editing manuscripts, designing covers, formatting interiors, polishing blurbs, and helping authors get ready for readers.
            </p>
            <div className="gh-hero-actions">
              <Link to="/get-hired/profile" className="btn btn-primary">Create Your Profile</Link>
              <Link to="/get-hired/projects" className="btn btn-outline">Browse Author Briefs</Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Author support areas ── */}
      <section className="gh-focus">
        <div className="container">
          <p className="gh-section-label">Book support</p>
          <h2 className="gh-section-h2">The work authors actually need</h2>
          <p className="gh-section-sub">
            Indie authors rarely need a vague freelancer. They need a specific problem solved before the book reaches readers.
          </p>

          <div className="gh-focus-grid">
            {AUTHOR_SUPPORT.map(({ Icon, title, services, desc }) => (
              <article key={title} className="gh-focus-card">
                <div className="gh-focus-icon"><Icon /></div>
                <div>
                  <h3>{title}</h3>
                  <p className="gh-focus-services">{services}</p>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="gh-how">
        <div className="container">
          <p className="gh-section-label">How you fit in</p>
          <h2 className="gh-section-h2">From author brief to better book,<br />in four steps</h2>
          <p className="gh-section-sub">
            The best profiles make it obvious how your skills help an author move through the publishing process faster.
          </p>

          <div className="gh-steps">
            {STEPS.map(({ num, Icon, title, desc }) => (
              <div key={num} className="gh-step">
                <div className="gh-step-num">{num}</div>
                <div className="gh-step-icon"><Icon /></div>
                <h3 className="gh-step-title">{title}</h3>
                <p className="gh-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
