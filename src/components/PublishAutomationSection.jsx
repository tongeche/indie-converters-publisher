import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBullseye, faChartLine } from '@fortawesome/free-solid-svg-icons';
import feature1Dashboard from '../assets/feature1-dashboard.webp';
import feature2Invoice from '../assets/feature2-invoice.webp';
import featurePublishNow from '../assets/feauture-publishnow.webp';
import './PublishAutomationSection.css';

const CARDS = [
  {
    label: 'Convert',
    icon: faArrowsRotate,
    body: 'Turn your manuscript into polished EPUB and print-ready PDF files automatically — no design software needed.',
  },
  {
    label: 'Control',
    icon: faBullseye,
    accent: true,
    body: 'Keep full ownership of your rights, publish on your own timeline, and sell wherever you choose — no exclusivity required.',
  },
  {
    label: 'Earn',
    icon: faChartLine,
    body: 'Track sales and royalties across every retailer in one dashboard, so you always know what’s working.',
  },
];

export default function PublishAutomationSection() {
  return (
    <section className="pub-showcase">
      <div className="pub-showcase-stage">
        <img src={feature2Invoice} alt="" className="pub-showcase-side pub-showcase-side--left" />
        <img src={feature1Dashboard} alt="" className="pub-showcase-center" />
        <img src={featurePublishNow} alt="" className="pub-showcase-side pub-showcase-side--right" />
      </div>

      <div className="container pub-showcase-copy">
        <h2>Automate every step of your publishing process</h2>
        <p>
          A simple platform that formats, converts, and distributes your book — helping you
          publish faster and reach more readers.
        </p>
      </div>

      <div className="container pub-showcase-cards">
        {CARDS.map(({ label, icon, body, accent }) => (
          <article className={`pub-showcase-card${accent ? ' pub-showcase-card--accent' : ''}`} key={label}>
            <span className="pub-showcase-card-label">{label}</span>
            <div className="pub-showcase-card-icon"><FontAwesomeIcon icon={icon} /></div>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
