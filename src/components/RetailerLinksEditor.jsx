import './RetailerLinksEditor.css';

export const RETAILER_OPTIONS = [
  { slug: 'own',      label: 'My own website' },
  { slug: 'gumroad',  label: 'Gumroad' },
  { slug: 'payhip',   label: 'Payhip' },
  { slug: 'amazon',   label: 'Amazon' },
  { slug: 'bookshop', label: 'Bookshop.org' },
  { slug: 'other',    label: 'Other' },
];

export default function RetailerLinksEditor({ links, onChange, label = 'Where to buy', hint }) {
  function updateRow(i, patch) {
    const next = [...links];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function removeRow(i) {
    onChange(links.filter((_, j) => j !== i));
  }
  function addRow() {
    onChange([...links, { retailer: 'own', url: '', price: '' }]);
  }

  return (
    <div className="rle-field">
      {label && <label className="rle-label">{label}</label>}
      {hint && <p className="rle-hint">{hint}</p>}
      <div className="rle-list">
        {links.map((rl, i) => (
          <div key={i} className="rle-row">
            <select value={rl.retailer} onChange={e => updateRow(i, { retailer: e.target.value })}>
              {RETAILER_OPTIONS.map(o => <option key={o.slug} value={o.slug}>{o.label}</option>)}
            </select>
            <input
              type="url"
              className="rle-url"
              placeholder="https://…"
              value={rl.url}
              onChange={e => updateRow(i, { url: e.target.value })}
            />
            <input
              type="number"
              className="rle-price"
              min="0"
              step="0.01"
              placeholder="Price (optional)"
              value={rl.price}
              onChange={e => updateRow(i, { price: e.target.value })}
            />
            <button type="button" className="rle-remove-btn" onClick={() => removeRow(i)} aria-label="Remove this retailer link">✕</button>
          </div>
        ))}
        <button type="button" className="rle-add-btn" onClick={addRow}>+ Add a place to buy</button>
      </div>
    </div>
  );
}
