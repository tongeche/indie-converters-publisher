import { Link } from 'react-router-dom';
import allAuthorsImg from '../assets/all-authors.png';
import './OurStorySection.css';

export default function OurStorySection() {
  return (
    <section className="story-section" aria-labelledby="story-heading">
      <div className="container story-grid">
        <div className="story-left">
          <h2 id="story-heading">Every story deserves a chance to be told.</h2>

          <div className="story-block">
            <span className="story-block-label">Challenge</span>
            <p>
              Traditional publishing decides whose stories get told. For many writers, reaching
              readers means finding an agent, waiting months for a response and competing for
              limited attention. Most manuscripts are rejected, leaving authors unsure what to do
              next.
            </p>
            <p>
              The process can feel distant, slow and difficult to navigate. Writers may be asked to
              change their work, give up part of their rights or wait years before their book
              reaches the market. Many personal stories never move beyond the manuscript because
              they do not fit what publishers are looking for at that moment.
            </p>
          </div>

          <div className="story-block">
            <span className="story-block-label">Solution</span>
            <p>
              We give authors a simpler way forward. Upload your manuscript, prepare it for print
              and eBook, and publish in just a few clicks. You keep ownership of your work, make
              the final decisions and share your story when you are ready.
            </p>
          </div>

          <Link to="/upload" className="story-cta">
            Start your book upload <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="story-right">
          <p className="story-intro">
            We're a free, open publishing platform that turns your manuscript into a real,
            published book — no agent, no rights deal, no permission needed.
          </p>

          <div className="story-card">
            <img src={allAuthorsImg} alt="" className="story-card-img" />
          </div>
        </div>
      </div>
    </section>
  );
}
