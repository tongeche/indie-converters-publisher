import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './PublishTemplates.css';

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

export default function PublishTemplates() {
  return (
    <div className="publish-templates-page">
      <SEO
        title="Manuscript Templates | IndieConverters"
        description="Free Word starter templates for fiction, nonfiction, poetry, print trim sizes, and front/back matter — download and start writing."
        path="/publish/templates"
      />

      <section className="section publish-templates-hero">
        <div className="container publish-templates-hero-inner">
          <Link to="/publish" className="publish-templates-back">← Back to Publish</Link>
          <span className="publish-templates-kicker">Word templates</span>
          <h1>Start with a clean Word file.</h1>
          <p>
            Download a .docx starter, replace the sample text, and upload it when you are ready. Each file uses simple Word styles so conversion stays predictable.
          </p>
        </div>
      </section>

      <section className="section manuscript-templates">
        <div className="container">
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

      <section className="section publish-templates-cta">
        <div className="container publish-templates-cta-inner">
          <h2>Ready to upload?</h2>
          <p>Bring your finished manuscript into the wizard whenever you're ready.</p>
          <Link to="/upload" className="btn btn-primary">Start your book upload</Link>
        </div>
      </section>
    </div>
  );
}
