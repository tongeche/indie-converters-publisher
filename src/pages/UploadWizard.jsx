import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';
import './UploadWizard.css';

const STEPS = ['Upload', 'Preview', 'Details', 'Published'];
const GENRES = ['Fiction', 'Memoir', 'Poetry', 'Nonfiction', 'Essay', 'Other'];
const COVER_COLORS = [
  { cls: 'cover-clay', label: 'Indigo' },
  { cls: 'cover-clay-dark', label: 'Deep indigo' },
  { cls: 'cover-ochre', label: 'Violet' },
  { cls: 'cover-ink', label: 'Midnight' },
  { cls: 'cover-sand', label: 'Parchment' },
];
const SAMPLE_PAGES = [
  "The first thing you notice is the quality of the silence. Not the absence of sound — there's plenty of that, out on the marsh in winter — but a silence that has texture, that presses back against the skin the way cold water does.",
  'She had been measuring this place for eleven years. Every April and every October, the same transects, the same numbered stakes, the same waterproof notebooks that she bought in batches of twelve from a supplier in Rotterdam. The notebooks came in one colour: orange. She had stopped wondering why.',
  "By the time Luz arrived, the methodology was already a kind of mythology. Marta handed her a stake-hammer on the first morning and said only: \"Don't name the birds.\" Luz asked why. \"Because then you'll start noticing when they're gone.\"",
];

export default function UploadWizard() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [samplePage, setSamplePage] = useState(0);
  const [details, setDetails] = useState({ title: '', blurb: '', genre: '', price: '', coverColor: 'cover-clay' });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, []);

  function acceptFile(f) {
    setFile(f);
    setConverting(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => { setConverting(false); setStep(1); }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 180);
  }

  function updateDetail(key, val) { setDetails(d => ({ ...d, [key]: val })); }

  const previewTitle = details.title || (file ? file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') : 'Your Book Title');
  const previewAuthor = 'Your Name';

  return (
    <div className="wizard">
      <div className="wizard-header">
        <div className="container">
          <div className="wizard-stepper">
            {STEPS.map((s, i) => (
              <button
                key={s}
                className={`wizard-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => { if (i < step) setStep(i); }}
                disabled={i > step}
              >
                <span className="ws-dot">··</span>
                <span className="ws-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ws-label">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wizard-body container">
        {/* ── Step 0: Upload ── */}
        {step === 0 && (
          <div className="step-upload">
            <div className="eyebrow">Step 01</div>
            <h2>Upload your manuscript</h2>
            <p className="step-sub">We accept .docx, .odt, .rtf, and .txt files. Max 50 MB.</p>

            {!file && !converting && (
              <div
                className={`drop-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.odt,.rtf,.txt"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) acceptFile(e.target.files[0]); }}
                />
                <div className="drop-icon">··</div>
                <p className="drop-label">Drag your manuscript here</p>
                <p className="drop-sub">or click to browse</p>
                <span className="btn btn-outline btn-sm" style={{ marginTop: 16, pointerEvents: 'none' }}>Choose file</span>
              </div>
            )}

            {file && !converting && (
              <div className="file-chip">
                <span className="file-chip-icon">📄</span>
                <span className="file-chip-name">{file.name}</span>
                <span className="file-chip-size">{(file.size / 1024).toFixed(0)} KB</span>
                <button className="file-chip-remove" onClick={() => setFile(null)}>✕</button>
              </div>
            )}

            {converting && (
              <div className="converting">
                <div className="file-chip">
                  <span className="file-chip-icon">📄</span>
                  <span className="file-chip-name">{file.name}</span>
                </div>
                <div className="progress-label">
                  <span>Converting…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-note">Running Pandoc · generating EPUB and PDF</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Preview ── */}
        {step === 1 && (
          <div className="step-preview">
            <div className="eyebrow">Step 02</div>
            <h2>Preview your book</h2>
            <p className="step-sub">This is how your formatted text looks. Use Prev / Next to page through the sample.</p>

            <div className="reader-window">
              <div className="reader-header">
                <span className="reader-title">{previewTitle}</span>
                <span className="reader-page">{samplePage + 1} / {SAMPLE_PAGES.length}</span>
              </div>
              <div className="reader-body">
                <p>{SAMPLE_PAGES[samplePage]}</p>
              </div>
              <div className="reader-controls">
                <button
                  className="btn btn-outline btn-sm"
                  disabled={samplePage === 0}
                  onClick={() => setSamplePage(p => p - 1)}
                >← Prev</button>
                <div className="reader-dots">
                  {SAMPLE_PAGES.map((_, i) => (
                    <button
                      key={i}
                      className={`reader-dot-btn ${i === samplePage ? 'active' : ''}`}
                      onClick={() => setSamplePage(i)}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={samplePage === SAMPLE_PAGES.length - 1}
                  onClick={() => setSamplePage(p => p + 1)}
                >Next →</button>
              </div>
            </div>

            <div className="step-nav">
              <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Looks good → Add details</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div className="step-details">
            <div className="eyebrow">Step 03</div>
            <h2>Book details</h2>
            <p className="step-sub">Fill in the details that readers will see on your book page.</p>

            <div className="details-layout">
              <form className="details-form" onSubmit={e => { e.preventDefault(); setStep(3); }}>
                <div className="field">
                  <label htmlFor="title">Title <span className="req">*</span></label>
                  <input
                    id="title"
                    type="text"
                    placeholder="The title of your book"
                    value={details.title}
                    onChange={e => updateDetail('title', e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="blurb">
                    Blurb <span className="req">*</span>
                    <span className="char-count">{details.blurb.length} / 400</span>
                  </label>
                  <textarea
                    id="blurb"
                    placeholder="A short description readers will see on the book page (max 400 characters)"
                    value={details.blurb}
                    onChange={e => { if (e.target.value.length <= 400) updateDetail('blurb', e.target.value); }}
                    rows={5}
                    required
                  />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="genre">Genre <span className="req">*</span></label>
                    <select
                      id="genre"
                      value={details.genre}
                      onChange={e => updateDetail('genre', e.target.value)}
                      required
                    >
                      <option value="">Select genre</option>
                      {GENRES.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="price">Price (USD) <span className="req">*</span></label>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="9.99"
                      value={details.price}
                      onChange={e => updateDetail('price', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Cover colour</label>
                  <div className="color-swatches">
                    {COVER_COLORS.map(c => (
                      <button
                        key={c.cls}
                        type="button"
                        className={`swatch ${c.cls} ${details.coverColor === c.cls ? 'selected' : ''}`}
                        title={c.label}
                        onClick={() => updateDetail('coverColor', c.cls)}
                      />
                    ))}
                  </div>
                </div>

                <div className="step-nav">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-primary">Publish →</button>
                </div>
              </form>

              <div className="details-preview">
                <div className="preview-label">Cover preview</div>
                <div className="cover-preview-wrap">
                  <BookCover
                    title={details.title || 'Your Book Title'}
                    author="Your Name"
                    colorClass={details.coverColor}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Published ── */}
        {step === 3 && (
          <div className="step-published">
            <div className="published-inner">
              <div className="published-cover-wrap">
                <BookCover
                  title={details.title || previewTitle}
                  author="Your Name"
                  colorClass={details.coverColor}
                  size="lg"
                />
              </div>
              <div className="published-text">
                <div className="published-badge">
                  <span className="published-dots">··</span> Published
                </div>
                <h2>{details.title || previewTitle}</h2>
                <p className="published-sub">Your book is now listed on Indie Converters. Share this link with readers:</p>
                <div className="published-url">
                  indieconverters.com/book/{(details.title || 'your-book').toLowerCase().replace(/\s+/g, '-')}
                </div>
                <div className="published-actions">
                  <Link to="/browse" className="btn btn-primary">View your listing →</Link>
                  <button className="btn btn-outline" onClick={() => { setStep(0); setFile(null); setProgress(0); setDetails({ title: '', blurb: '', genre: '', price: '', coverColor: 'cover-clay' }); setSamplePage(0); }}>
                    Publish another book
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
