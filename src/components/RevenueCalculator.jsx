import { useEffect, useState } from 'react';
import {
  FORMAT_OPTIONS,
  PLATFORM_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  SALES_MAX,
  SALES_MIN,
  calculateRevenue,
  firstSupportedPlatform,
  formatCurrency,
  formatPercent,
  platformSupportsFormat,
} from '../lib/revenueCalculator';
import './RevenueCalculator.css';

export default function RevenueCalculator({ className = '' }) {
  const [format, setFormat] = useState('ebook');
  const [price, setPrice] = useState(0.99);
  const [monthlySales, setMonthlySales] = useState(120);
  const [platformId, setPlatformId] = useState('amazon');

  useEffect(() => {
    if (!platformSupportsFormat(platformId, format)) {
      setPlatformId(firstSupportedPlatform(format));
    }
  }, [format, platformId]);

  const result = calculateRevenue({ price, monthlySales, format, platformId });

  return (
    <div className={`rc-calculator ${className}`}>
      <span className="rc-eyebrow">Revenue calculator</span>
      <h2 className="rc-heading">See what your book could really earn</h2>
      <p className="rc-sub">Move the sliders — the receipt updates live.</p>

      <div className="rc-grid">
        <div className="rc-inputs">
          <div className="rc-field-group">
            <span className="rc-label">Format</span>
            <div className="rc-pill-row">
              {FORMAT_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`rc-pill${format === option.id ? ' rc-pill--active' : ''}`}
                  onClick={() => setFormat(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rc-field-group">
            <div className="rc-slider-head">
              <span className="rc-label">List price</span>
              <span className="rc-slider-value">{formatCurrency(price)}</span>
            </div>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step="0.01"
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              className="rc-slider"
              aria-label="List price"
            />
          </div>

          <div className="rc-field-group">
            <div className="rc-slider-head">
              <span className="rc-label">Monthly sales</span>
              <span className="rc-slider-value">{monthlySales.toLocaleString('en-US')}</span>
            </div>
            <input
              type="range"
              min={SALES_MIN}
              max={SALES_MAX}
              step="1"
              value={monthlySales}
              onChange={e => setMonthlySales(Number(e.target.value))}
              className="rc-slider"
              aria-label="Monthly sales"
            />
          </div>

          <div className="rc-field-group">
            <span className="rc-label">Platform</span>
            <div className="rc-platform-grid">
              {PLATFORM_OPTIONS.map(option => {
                const disabled = !platformSupportsFormat(option.id, format);
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    className={`rc-pill rc-pill--block${platformId === option.id ? ' rc-pill--active' : ''}`}
                    onClick={() => setPlatformId(option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rc-receipt">
          <div className="rc-receipt-title">Royalty receipt</div>

          {result.breakdown.map(line => (
            <div className="rc-receipt-block" key={line.label}>
              {result.breakdown.length > 1 && <div className="rc-receipt-sublabel">{line.label}</div>}
              <div className="rc-receipt-row">
                <span>List price</span>
                <span>{formatCurrency(result.price)}</span>
              </div>
              <div className="rc-receipt-row">
                <span>Platform</span>
                <span>{result.platform.label}</span>
              </div>
              <div className="rc-receipt-row">
                <span>Platform cut ({formatPercent(1 - line.rate)})</span>
                <span>−{formatCurrency(line.platformCut)}</span>
              </div>
              {line.processingFee > 0 && (
                <div className="rc-receipt-row">
                  <span>Payment processing</span>
                  <span>−{formatCurrency(line.processingFee)}</span>
                </div>
              )}
              {line.printingCost > 0 && (
                <div className="rc-receipt-row">
                  <span>Printing cost</span>
                  <span>−{formatCurrency(line.printingCost)}</span>
                </div>
              )}
              <div className="rc-receipt-row rc-receipt-row--strong">
                <span>Your royalty / sale</span>
                <span>{formatCurrency(line.royalty)}</span>
              </div>
              <div className="rc-receipt-row">
                <span>x Monthly sales</span>
                <span>{line.sales.toLocaleString('en-US')} copies</span>
              </div>
            </div>
          ))}

          <div className="rc-receipt-divider" />

          <div className="rc-receipt-total">
            <span>Estimated monthly earnings</span>
            <strong>{formatCurrency(result.monthlyEarnings)}</strong>
          </div>
          <div className="rc-receipt-annual">
            <span>Estimated annual</span>
            <strong>{formatCurrency(result.annualEarnings)}</strong>
          </div>
        </div>
      </div>

      <p className="rc-disclaimer">
        Estimates use typical published royalty terms. Actual payouts vary by promotions, page count, and returns.
      </p>
    </div>
  );
}
