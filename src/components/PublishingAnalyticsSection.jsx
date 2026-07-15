import bookAnalysisImg from '../assets/book-analysis.png';
import './PublishingAnalyticsSection.css';

export default function PublishingAnalyticsSection() {
  return (
    <section className="analytics-section">
      <div className="container analytics-grid">
        <div className="analytics-copy">
          <h2>Analytics for smarter publishing decisions</h2>
          <p>
            Track sales, royalties, and reader interest across every retailer in one place. Spot
            what's working, catch issues early, and make confident decisions about your catalogue.
          </p>
        </div>

        <div className="analytics-visual">
          <img src={bookAnalysisImg} alt="" />
        </div>
      </div>
    </section>
  );
}
