import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { analyseFile, platformStatus } from '../lib/manuscriptValidator';
import SEO from '../components/SEO';
import './CheckVerify.css';

const PLATFORM_ORDER = ['epubcheck', 'kdp', 'd2d', 'ingram', 'apple', 'kobo'];

const PLATFORM_ICON = {
  epubcheck: '✓',
  kdp:       'A',
  d2d:       'D',
  ingram:    'I',
  apple:     '',
  kobo:      'K',
};

export default function CheckVerify() {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['docx', 'txt', 'rtf'].includes(ext)) {
      setError('Unsupported format. Upload a .docx, .rtf, or .txt file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(`File is ${(file.size / 1024 / 1024).toFixed(0)} MB — maximum is 50 MB.`);
      return;
    }
    setError('');
    setFilename(file.name);
    setLoading(true);
    try {
      const res = await analyseFile(file);
      setResult(res);
    } catch (e) {
      setError('Could not read the file. Make sure it is a valid .docx, .rtf, or .txt.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const platforms = result ? platformStatus(result) : null;
  const errors   = result?.issues.filter(i => i.severity === 'error')   || [];
  const warnings = result?.issues.filter(i => i.severity === 'warning') || [];
  const infos    = result?.issues.filter(i => i.severity === 'info')    || [];
  const allClear = result && result.issues.length === 0;

  return (
    <div className="cv-page">
      <SEO title="Manuscript Checker | IndieConverters" description="Check your manuscript file for common formatting issues before uploading." path="/check" />

      {/* Hero */}
      <section className="cv-hero">
        <div className="container">
          <div className="eyebrow">Free tool</div>
          <h1>Check &amp; Verify your manuscript</h1>
          <p>Upload your .docx and get an instant readiness report for Amazon KDP, Draft2Digital, IngramSpark, Apple Books, Kobo, and EPUBCheck — before you hit publish.</p>
        </div>
      </section>

      <div className="container cv-body">

        {/* Drop zone */}
        <div
          className={`cv-dropzone ${dragging ? 'cv-dropzone--over' : ''} ${loading ? 'cv-dropzone--loading' : ''} ${result ? 'cv-dropzone--done' : ''}`}
          onClick={() => !loading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".docx,.rtf,.txt"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {loading ? (
            <div className="cv-drop-inner">
              <div className="cv-spinner" />
              <p className="cv-drop-label">Analysing {filename}…</p>
            </div>
          ) : result ? (
            <div className="cv-drop-inner">
              <span className="cv-drop-file-icon">doc</span>
              <p className="cv-drop-label">{filename}</p>
              <button className="cv-recheck-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                Check a different file
              </button>
            </div>
          ) : (
            <div className="cv-drop-inner">
              <div className="cv-drop-icon">↑</div>
              <p className="cv-drop-label">Drop your manuscript here</p>
              <p className="cv-drop-sub">.docx · .rtf · .txt &nbsp;·&nbsp; max 50 MB</p>
            </div>
          )}
        </div>

        {error && <p className="cv-error">{error}</p>}

        {result && (
          <>
            {/* Stats bar */}
            <div className="cv-stats">
              <div className="cv-stat">
                <span className="cv-stat-val">{result.wordCount.toLocaleString()}</span>
                <span className="cv-stat-lbl">words</span>
              </div>
              <div className="cv-stat">
                <span className="cv-stat-val">~{result.estimatedPages}</span>
                <span className="cv-stat-lbl">pages</span>
              </div>
              <div className="cv-stat">
                <span className="cv-stat-val">{result.headings.length}</span>
                <span className="cv-stat-lbl">headings</span>
              </div>
              <div className="cv-stat">
                <span className="cv-stat-val">{result.paragraphCount}</span>
                <span className="cv-stat-lbl">paragraphs</span>
              </div>
            </div>

            {/* Platform cards */}
            <h2 className="cv-section-title">Platform readiness</h2>
            <div className="cv-platforms">
              {PLATFORM_ORDER.map(key => {
                const p = platforms[key];
                return (
                  <div key={key} className={`cv-platform cv-platform--${p.status}`}>
                    <div className="cv-platform-icon">{PLATFORM_ICON[key]}</div>
                    <span className="cv-platform-name">{p.label}</span>
                    <span className="cv-platform-badge">
                      {p.status === 'pass' ? 'Ready' : p.status === 'warn' ? 'Review' : 'Fix needed'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* All clear */}
            {allClear && (
              <div className="cv-all-clear">
                <span className="cv-all-clear-icon">✓</span>
                <div>
                  <strong>Manuscript looks great</strong>
                  <p>No issues found. You're ready to publish.</p>
                </div>
                <Link to="/upload" className="btn btn-primary cv-all-clear-cta">Publish now →</Link>
              </div>
            )}

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="cv-issues">
                <h2 className="cv-section-title">
                  {errors.length > 0
                    ? `${errors.length} error${errors.length > 1 ? 's' : ''} to fix before publishing`
                    : 'A few things to review'}
                </h2>

                {errors.length > 0 && (
                  <div className="cv-issue-group">
                    {errors.map(i => <IssueRow key={i.type} issue={i} />)}
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="cv-issue-group">
                    {warnings.map(i => <IssueRow key={i.type} issue={i} />)}
                  </div>
                )}
                {infos.length > 0 && (
                  <div className="cv-issue-group">
                    {infos.map(i => <IssueRow key={i.type} issue={i} />)}
                  </div>
                )}

                <p className="cv-issues-note">
                  Fix these in your word processor, save a new .docx, then drop it here to re-check.
                </p>
              </div>
            )}

            {/* Chapter outline */}
            {result.headings.length > 0 && (
              <details className="cv-outline">
                <summary className="cv-outline-toggle">
                  Chapter outline ({result.headings.length} heading{result.headings.length !== 1 ? 's' : ''})
                </summary>
                <ol className="cv-outline-list">
                  {result.headings.map((h, i) => (
                    <li key={i} className={`cv-outline-item cv-outline-item--h${h.level}`}>
                      <span className="cv-outline-text">{h.text}</span>
                      <span className="cv-outline-words">{h.words > 0 ? `${h.words.toLocaleString()}w` : <em className="cv-outline-empty">empty</em>}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {/* CTA */}
            <div className="cv-cta-row">
              <Link to="/upload" className="btn btn-primary">Publish on IndieConverters →</Link>
              <Link to="/hire" className="btn btn-outline">Hire a formatter</Link>
            </div>
          </>
        )}

        {/* How it works — shown before first upload */}
        {!result && !loading && (
          <div className="cv-how">
            <h2 className="cv-section-title">What we check</h2>
            <div className="cv-how-grid">
              {[
                { icon: '¶', title: 'Heading structure', desc: 'Detects missing, mismatched, or all-caps headings that break EPUB navigation and TOC generation.' },
                { icon: '⟷', title: 'Word & page count', desc: "Flags manuscripts that fall below platform minimums or exceed KDP's 828-page print limit." },
                { icon: '↔', title: 'File size', desc: 'Checks the 50 MB upload cap enforced by KDP, Draft2Digital, and IngramSpark.' },
                { icon: '□', title: 'Empty chapters', desc: 'Finds headings with no body text — EPUBCheck rejects these as validation errors.' },
                { icon: '···', title: 'Blank line runs', desc: 'Spots stacked blank lines that collapse in EPUB readers and may trigger EPUBCheck warnings.' },
                { icon: '6 platforms', title: 'Platform gates', desc: 'Maps every finding to a pass / review / fix badge per retailer and EPUBCheck.' },
              ].map(c => (
                <div key={c.title} className="cv-how-card">
                  <div className="cv-how-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function IssueRow({ issue }) {
  return (
    <div className={`cv-issue cv-issue--${issue.severity}`}>
      <span className="cv-issue-dot" />
      <p className="cv-issue-msg">{issue.message}</p>
    </div>
  );
}
