import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  COVER_DPI,
  INTERIOR_OPTIONS,
  PAPER_OPTIONS,
  TRIM_SIZE_OPTIONS,
  calculatePrintCover,
  copyableCoverSummary,
  formatInches,
  getCompatiblePaperOptions,
} from '../lib/printCoverCalculator';
import './PrintCoverCalculator.css';

const BINDING_OPTIONS = [
  { id: 'paperback', label: 'Paperback', note: 'KDP-style full-wrap cover' },
  { id: 'hardcover', label: 'Hardcover', note: 'Use printer specs before final export' },
];

const READING_DIRECTIONS = [
  { id: 'ltr', label: 'Left to right' },
  { id: 'rtl', label: 'Right to left' },
];

const TRIM_PARAM_ALIASES = {
  '5x8': '5x8',
  '5_5x8_5': '5.5x8.5',
  '5.5x8.5': '5.5x8.5',
  '6x9': '6x9',
  '7x10': '7x10',
  '8_5x11': '8.5x11',
  '8.5x11': '8.5x11',
  custom: 'custom',
};

function firstParam(searchParams, keys) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return '';
}

function choiceParam(searchParams, key, allowed, fallback) {
  const value = searchParams.get(key);
  return allowed.includes(value) ? value : fallback;
}

function trimParam(searchParams) {
  return TRIM_PARAM_ALIASES[searchParams.get('trim')] || '6x9';
}

function numberParam(searchParams, keys, fallback) {
  const raw = firstParam(searchParams, keys);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : String(fallback);
}

function pageCountParam(searchParams, fallback) {
  const raw = firstParam(searchParams, ['pages', 'pageCount']);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : fallback;
}

function copyText(value, setCopied, label) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(value).then(() => {
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1600);
  });
}

function guideFileBase(result) {
  return `indie-cover-guide-${result.trimWidth}x${result.trimHeight}-${result.pageCount || 0}pages`;
}

function serializeGuideSvg(svgElement, result) {
  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(result.pixelWidth));
  clone.setAttribute('height', String(result.pixelHeight));
  clone.setAttribute('viewBox', `0 0 ${result.fullCoverWidth} ${result.fullCoverHeight}`);
  clone.setAttribute('style', 'background:#fff');
  return new XMLSerializer().serializeToString(clone);
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Could not generate PNG guide.'));
    }, 'image/png');
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not render the cover guide.'));
    image.src = src;
  });
}

function CoverWireframe({ result, svgRef }) {
  const panelFill = {
    back: '#F6F2FF',
    front: '#FFFFFF',
    spine: '#E7DDFC',
  };
  const fontSize = Math.max(0.13, Math.min(result.fullCoverHeight / 32, 0.22));
  const labelY = result.bleed + 0.38;
  const hasReadableSpine = result.spineWidth >= 0.22;

  return (
    <svg
      ref={svgRef}
      className="pcc-wireframe-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${result.fullCoverWidth} ${result.fullCoverHeight}`}
      role="img"
      aria-label="Print cover wireframe showing bleed, trim, safe areas, back cover, spine, and front cover"
    >
      <rect
        x="0"
        y="0"
        width={result.fullCoverWidth}
        height={result.fullCoverHeight}
        fill="#F0EAFB"
      />
      <rect
        x={result.bleed}
        y={result.bleed}
        width={result.fullCoverWidth - (result.bleed * 2)}
        height={result.fullCoverHeight - (result.bleed * 2)}
        fill="#fff"
        stroke="#441CB2"
        strokeWidth="0.018"
      />

      {result.panels.map(panel => (
        <g key={panel.id}>
          <rect
            x={panel.x}
            y={panel.y}
            width={panel.width}
            height={panel.height}
            fill={panelFill[panel.id]}
            stroke="#D9CDF7"
            strokeWidth="0.012"
          />
          {panel.id === 'spine' && hasReadableSpine ? (
            <text
              x={panel.x + (panel.width / 2)}
              y={panel.y + (panel.height / 2)}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(90 ${panel.x + (panel.width / 2)} ${panel.y + (panel.height / 2)})`}
              fill="#441CB2"
              fontFamily="Inter, Arial, sans-serif"
              fontSize={Math.min(fontSize, panel.width * 0.55)}
              fontWeight="700"
            >
              Spine
            </text>
          ) : panel.id === 'spine' ? null : (
            <text
              x={panel.x + (panel.width / 2)}
              y={labelY}
              textAnchor="middle"
              fill="#1B1330"
              fontFamily="Inter, Arial, sans-serif"
              fontSize={fontSize}
              fontWeight="700"
            >
              {panel.label}
            </text>
          )}
        </g>
      ))}

      {result.safeAreas.map(area => (
        <rect
          key={area.id}
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill="none"
          stroke="#8266E0"
          strokeWidth="0.018"
          strokeDasharray="0.08 0.06"
        />
      ))}

      {result.barcodeArea && (
        <g>
          <rect
            x={result.barcodeArea.x}
            y={result.barcodeArea.y}
            width={result.barcodeArea.width}
            height={result.barcodeArea.height}
            rx="0.04"
            fill="#fff"
            stroke="#1B1330"
            strokeWidth="0.018"
          />
          <text
            x={result.barcodeArea.x + (result.barcodeArea.width / 2)}
            y={result.barcodeArea.y + (result.barcodeArea.height / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#4A3F66"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="0.14"
            fontWeight="700"
          >
            Barcode
          </text>
        </g>
      )}

      <rect
        x="0.012"
        y="0.012"
        width={result.fullCoverWidth - 0.024}
        height={result.fullCoverHeight - 0.024}
        fill="none"
        stroke="#B88C3D"
        strokeWidth="0.024"
        strokeDasharray="0.12 0.08"
      />

      <text
        x={result.bleed + 0.08}
        y={result.fullCoverHeight - 0.14}
        fill="#8266E0"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="0.14"
        fontWeight="700"
      >
        outer bleed
      </text>
    </svg>
  );
}

export default function PrintCoverCalculator() {
  const [searchParams] = useSearchParams();
  const initialTrimSize = trimParam(searchParams);
  const initialTrim = TRIM_SIZE_OPTIONS.find(option => option.id === initialTrimSize) || TRIM_SIZE_OPTIONS[2];
  const prefilledFromUpload = searchParams.get('source') === 'upload';
  const [bindingType, setBindingType] = useState(() => choiceParam(searchParams, 'binding', ['paperback', 'hardcover'], 'paperback'));
  const [trimSize, setTrimSize] = useState(() => initialTrimSize);
  const [customWidth, setCustomWidth] = useState(() => numberParam(searchParams, ['trimWidth', 'width'], initialTrim.width));
  const [customHeight, setCustomHeight] = useState(() => numberParam(searchParams, ['trimHeight', 'height'], initialTrim.height));
  const [interiorType, setInteriorType] = useState(() => choiceParam(searchParams, 'interior', ['blackWhite', 'standardColor', 'premiumColor'], 'blackWhite'));
  const [paperType, setPaperType] = useState(() => choiceParam(searchParams, 'paper', ['white', 'cream', 'groundwood'], 'white'));
  const [pageCount, setPageCount] = useState(() => pageCountParam(searchParams, '220'));
  const [readingDirection, setReadingDirection] = useState(() => choiceParam(searchParams, 'direction', ['ltr', 'rtl'], 'ltr'));
  const [copied, setCopied] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const svgRef = useRef(null);

  const selectedTrim = TRIM_SIZE_OPTIONS.find(option => option.id === trimSize) || TRIM_SIZE_OPTIONS[2];
  const trimWidth = trimSize === 'custom' ? customWidth : selectedTrim.width;
  const trimHeight = trimSize === 'custom' ? customHeight : selectedTrim.height;
  const compatiblePaperOptions = useMemo(() => getCompatiblePaperOptions(interiorType), [interiorType]);

  useEffect(() => {
    if (!compatiblePaperOptions.some(option => option.id === paperType)) {
      setPaperType(compatiblePaperOptions[0]?.id || 'white');
    }
  }, [compatiblePaperOptions, paperType]);

  const result = useMemo(() => calculatePrintCover({
    bindingType,
    trimWidth,
    trimHeight,
    interiorType,
    paperType,
    pageCount,
    readingDirection,
  }), [bindingType, trimWidth, trimHeight, interiorType, paperType, pageCount, readingDirection]);

  const summary = [
    {
      label: 'Full cover size',
      value: `${formatInches(result.fullCoverWidth)} x ${formatInches(result.fullCoverHeight)}`,
      detail: 'Back + spine + front + bleed',
    },
    {
      label: 'Spine width',
      value: formatInches(result.spineWidth),
      detail: `${result.pageCount || 0} pages at ${result.spineFactor} in/page`,
    },
    {
      label: `Final export at ${COVER_DPI} DPI`,
      value: `${result.pixelWidth} x ${result.pixelHeight}px`,
      detail: 'Use this for raster exports',
    },
    {
      label: 'Bleed',
      value: formatInches(result.bleed),
      detail: 'Extend background into this area',
    },
  ];

  function downloadSvgGuide() {
    if (!svgRef.current) return;
    const svg = serializeGuideSvg(svgRef.current, result);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    triggerBlobDownload(blob, `${guideFileBase(result)}.svg`);
  }

  async function downloadPngGuide() {
    if (!svgRef.current || downloadStatus) return;
    setDownloadStatus('png');

    const svg = serializeGuideSvg(svgRef.current, result);
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = result.pixelWidth;
      canvas.height = result.pixelHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not prepare PNG canvas.');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pngBlob = await canvasToPngBlob(canvas);
      triggerBlobDownload(pngBlob, `${guideFileBase(result)}-${result.pixelWidth}x${result.pixelHeight}.png`);
    } catch (error) {
      console.error(error);
    } finally {
      URL.revokeObjectURL(svgUrl);
      setDownloadStatus('');
    }
  }

  return (
    <main className="pcc-page">
      <SEO
        title="Print Cover Calculator | IndieConverters"
        description="Calculate paperback full-wrap cover dimensions, spine width, bleed, safe area, and 300 DPI export size for print books."
        path="/tools/print-cover-calculator"
      />

      <section className="pcc-hero">
        <div className="container pcc-hero-inner">
          <div>
            <span className="eyebrow">Publishing tool</span>
            <h1>Print cover calculator</h1>
            <p>
              Calculate full-wrap paperback cover dimensions before you design in Canva, Photoshop, Illustrator, Affinity, or InDesign.
            </p>
          </div>
          <Link to="/upload" className="btn btn-outline">Back to upload</Link>
        </div>
      </section>

      <section className="pcc-tool container" aria-label="Print cover calculator">
        <div className="pcc-input-panel">
          <div className="pcc-panel-head">
            <h2>Book setup</h2>
            <p>Use inches here. The final export size is calculated at 300 DPI.</p>
          </div>

          {prefilledFromUpload && (
            <div className="pcc-prefill-note">
              Prefilled from your upload choices. Adjust anything here before sharing dimensions with a designer.
            </div>
          )}

          <div className="pcc-field-group">
            <span className="pcc-field-label">Binding type</span>
            <div className="pcc-segment-grid">
              {BINDING_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`pcc-choice ${bindingType === option.id ? 'selected' : ''}`}
                  onClick={() => setBindingType(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pcc-field-group">
            <span className="pcc-field-label">Trim size</span>
            <div className="pcc-trim-grid">
              {TRIM_SIZE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`pcc-trim ${trimSize === option.id ? 'selected' : ''}`}
                  onClick={() => setTrimSize(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </div>

          {trimSize === 'custom' && (
            <div className="pcc-row">
              <label className="pcc-field">
                <span>Custom width</span>
                <input
                  type="number"
                  min="1"
                  step="0.001"
                  value={customWidth}
                  onChange={event => setCustomWidth(event.target.value)}
                />
              </label>
              <label className="pcc-field">
                <span>Custom height</span>
                <input
                  type="number"
                  min="1"
                  step="0.001"
                  value={customHeight}
                  onChange={event => setCustomHeight(event.target.value)}
                />
              </label>
            </div>
          )}

          <div className="pcc-row">
            <label className="pcc-field">
              <span>Interior type</span>
              <select value={interiorType} onChange={event => setInteriorType(event.target.value)}>
                {INTERIOR_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="pcc-field">
              <span>Paper type</span>
              <select value={paperType} onChange={event => setPaperType(event.target.value)}>
                {PAPER_OPTIONS.map(option => (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={!option.interiors.includes(interiorType)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pcc-row">
            <label className="pcc-field">
              <span>Page count</span>
              <input
                type="number"
                min="0"
                step="1"
                value={pageCount}
                onChange={event => setPageCount(event.target.value)}
              />
            </label>

            <label className="pcc-field">
              <span>Reading direction</span>
              <select value={readingDirection} onChange={event => setReadingDirection(event.target.value)}>
                {READING_DIRECTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="pcc-result-panel">
          <div className="pcc-summary-grid">
            {summary.map(item => (
              <div key={item.label} className="pcc-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>

          {result.warnings.length > 0 && (
            <div className="pcc-warning-list" aria-live="polite">
              {result.warnings.map(warning => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <div className="pcc-diagram-card">
            <div className="pcc-diagram-head">
              <div>
                <h2>Live cover wireframe</h2>
                <p>Dashed gold is bleed. Purple dashed boxes are safe content areas.</p>
              </div>
              <div className="pcc-diagram-actions">
                <button type="button" className="pcc-mini-btn" onClick={downloadPngGuide} disabled={downloadStatus === 'png'}>
                  {downloadStatus === 'png' ? 'Preparing PNG...' : 'Download PNG guide'}
                </button>
                <button type="button" className="pcc-mini-btn" onClick={downloadSvgGuide}>
                  Download SVG guide
                </button>
              </div>
            </div>
            <div className="pcc-wireframe-wrap">
              <CoverWireframe result={result} svgRef={svgRef} />
            </div>
            <div className="pcc-legend" aria-label="Diagram legend">
              <span><i className="pcc-dot pcc-dot--bleed" /> Bleed</span>
              <span><i className="pcc-dot pcc-dot--trim" /> Trim line</span>
              <span><i className="pcc-dot pcc-dot--safe" /> Safe area</span>
              <span><i className="pcc-dot pcc-dot--barcode" /> Barcode</span>
            </div>
          </div>

          <div className="pcc-helper-card">
            <div>
              <h2>Use these dimensions</h2>
              <p>Set your design canvas to the full cover size, keep important text inside the safe areas, and extend backgrounds into bleed.</p>
            </div>
            <div className="pcc-helper-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => copyText(copyableCoverSummary(result), setCopied, 'summary')}
              >
                {copied === 'summary' ? 'Copied' : 'Copy all dimensions'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => copyText(`${result.pixelWidth} x ${result.pixelHeight}px`, setCopied, 'pixels')}
              >
                {copied === 'pixels' ? 'Copied' : 'Copy pixel size'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
