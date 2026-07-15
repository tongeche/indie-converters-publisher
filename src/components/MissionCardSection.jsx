import { Link } from 'react-router-dom';
import booksSaleViewImg from '../assets/books-sale-view.png';
import './MissionCardSection.css';

export default function MissionCardSection() {
  return (
    <section className="mission-card-section">
      <div className="container">
        <div className="mission-card">
          <div className="mission-card-copy">
            <h2>Reach out</h2>
            <p>
              Our mission is to make storytelling accessible to everyone. We provide simple tools
              that help people—regardless of writing experience or education—turn their memories
              and experiences into published books and contribute to a stronger reading culture.
            </p>
            <Link to="/upload" className="mission-card-cta">
              Get started <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mission-card-visual">
            <img src={booksSaleViewImg} alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}
