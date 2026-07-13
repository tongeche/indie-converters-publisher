import lightsFutureCoverImg from '../assets/dammie-covers/dammie01.png';
import loveSunsetCoverImg   from '../assets/dammie-covers/dammie-02.png';
import wishHorseCoverImg    from '../assets/dammie-covers/dammie-03.png';
import './PublishingProcessShowcase.css';

const PROJECTS = [
  {
    title: 'The Lights in the Future',
    stage: 'Proof review',
    version: 'v4',
    owner: 'T. Holink',
    updated: '2h ago',
    progress: 82,
    cover: lightsFutureCoverImg,
  },
  {
    title: 'Love Before Sunset',
    stage: 'Cover revision',
    version: 'v3',
    owner: 'Amelia Park',
    updated: 'Today',
    progress: 64,
    cover: loveSunsetCoverImg,
  },
  {
    title: 'If I Had a Wish and a Horse',
    stage: 'EPUB build',
    version: 'v2',
    owner: 'Elad Stone',
    updated: 'Yesterday',
    progress: 48,
    cover: wishHorseCoverImg,
  },
  {
    title: 'Saltwater Letters',
    stage: 'Metadata pass',
    version: 'v1',
    owner: 'Mira Vale',
    updated: 'Fri',
    progress: 28,
    cover: loveSunsetCoverImg,
  },
];

const REVISION_STEPS = [
  { label: 'Manuscript', status: 'Done' },
  { label: 'Formatting', status: 'Done' },
  { label: 'Proofing', status: 'Active' },
  { label: 'Publish files', status: 'Next' },
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

export default function PublishingProcessShowcase() {
  const activeProject = PROJECTS[0];

  return (
    <section className="process-showcase" aria-labelledby="process-showcase-heading">
      <div className="container process-showcase-inner">
        <div className="process-copy">
          <span className="process-eyebrow">Publishing workspace</span>
          <h2 id="process-showcase-heading">Track every revision before a book goes live</h2>
        </div>

        <div className="process-mockup" aria-hidden="true">
          <button className="process-expand" type="button" tabIndex="-1" aria-label="Expand">
            <IconExpand />
          </button>

          <div className="process-desk">
            <div className="process-window">
              <div className="process-window-bar">
                <span />
                <span />
                <span />
                <b>Publishing projects</b>
              </div>

              <div className="process-window-body">
                <div className="process-sidebar">
                  <div className="process-brand-mark">.in</div>
                  <strong>Indie Converters</strong>
                  <span>Author workspace</span>
                </div>

                <div className="process-table">
                  <div className="process-table-head">
                    <span>Book</span>
                    <span>Stage</span>
                    <span>Version</span>
                    <span>Owner</span>
                    <span>Updated</span>
                  </div>

                  {PROJECTS.map(project => (
                    <div
                      className={`process-row${project.title === activeProject.title ? ' process-row--active' : ''}`}
                      key={project.title}
                    >
                      <span className="process-book-cell">
                        <img src={project.cover} alt="" />
                        <b>{project.title}</b>
                      </span>
                      <span>{project.stage}</span>
                      <span>{project.version}</span>
                      <span>{project.owner}</span>
                      <span>{project.updated}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="process-detail-card">
              <div className="process-detail-head">
                <img src={activeProject.cover} alt="" />
                <div>
                  <strong>{activeProject.title}</strong>
                  <span>Current revision: {activeProject.version}</span>
                </div>
              </div>

              <div className="process-version-meter">
                <span style={{ width: `${activeProject.progress}%` }} />
              </div>

              <div className="process-step-list">
                {REVISION_STEPS.map(step => (
                  <div className={`process-step process-step--${step.status.toLowerCase()}`} key={step.label}>
                    <span />
                    <p>{step.label}</p>
                    <b>{step.status}</b>
                  </div>
                ))}
              </div>

              <div className="process-notes">
                <p>Proof notes synced</p>
                <p>Cover export awaiting approval</p>
                <p>EPUB validation queued</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
