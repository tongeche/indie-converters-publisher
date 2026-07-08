import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import RevenueCalculator from '../components/RevenueCalculator';
import './RevenueCalculatorPage.css';

export default function RevenueCalculatorPage() {
  return (
    <main className="rcp-page">
      <SEO
        title="Revenue Calculator | IndieConverters"
        description="Estimate your indie book's monthly and annual royalty earnings across Amazon KDP, Apple Books, Kobo, Barnes & Noble, and Draft2Digital."
        path="/tools/revenue-calculator"
      />

      <section className="rcp-hero">
        <div className="container rcp-hero-inner">
          <div>
            <span className="eyebrow">Publishing tool</span>
            <h1>Revenue calculator</h1>
            <p>See what your book could really earn before you publish, and compare terms across retailers.</p>
          </div>
          <Link to="/upload" className="btn btn-outline">Back to upload</Link>
        </div>
      </section>

      <section className="container rcp-tool">
        <RevenueCalculator />
      </section>
    </main>
  );
}
