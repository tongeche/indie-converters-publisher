import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-dots">··</span>indie<strong>converters</strong>
          <p>A platform for independent authors. No exclusivity. No cart. Just your work, properly made.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Discover</h4>
            <Link to="/browse">Browse Books</Link>
            <Link to="/browse?genre=fiction">Fiction</Link>
            <Link to="/browse?genre=memoir">Memoir</Link>
            <Link to="/browse?genre=poetry">Poetry</Link>
          </div>
          <div>
            <h4>Publish</h4>
            <Link to="/publish">For Authors</Link>
            <Link to="/upload">Upload a Manuscript</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Indie Converters</span>
          <span className="footer-dot-mark">··</span>
        </div>
      </div>
    </footer>
  );
}
