import SEO from '../components/SEO';
import './Legal.css';

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <SEO
        title="Terms of Service | IndieConverters"
        description="The terms governing your use of IndieConverters."
        path="/terms"
      />
      <div className="legal-container">
        <div className="eyebrow">Legal</div>
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated 6 July 2026</p>

        <div className="legal-disclaimer">
          <strong>Draft notice:</strong> this is a placeholder set of terms written to describe how the platform currently works. It has not been reviewed by a lawyer and should not be relied on as final legal compliance — have it reviewed before launch.
        </div>

        <div className="legal-body">
          <h2>Your content, your rights</h2>
          <p>You retain full copyright over any book, manuscript, or other work you publish through IndieConverters. We make no claim of ownership over your work, and you may remove your listing at any time.</p>

          <h2>Acceptable use</h2>
          <p>Don't upload content you don't have the rights to publish, and don't use the platform to harass, defraud, or mislead other users. We reserve the right to remove listings, profiles, or briefs that violate this.</p>

          <h2>Freelancers and hiring</h2>
          <p>IndieConverters is a directory and introduction service connecting authors with freelancers — cover designers, editors, ghostwriters, and formatters. We are not a party to any agreement, payment, or dispute between an author and a freelancer, and we don't guarantee the quality, availability, or outcome of any freelance work arranged through the site.</p>

          <h2>Book sales</h2>
          <p>We list your book and link readers to wherever you already sell it. We don't process book sales or take a cut of your pricing — you keep control of your sales channels and pricing.</p>

          <h2>Availability</h2>
          <p>IndieConverters is provided during an early-access period and may change, and features may be added or removed, as the product develops. We'll do our best to give notice of any change that affects your published listings.</p>

          <h2>Contact</h2>
          <p>Questions about these terms can go to <a href="mailto:info@indieconverters.uk">info@indieconverters.uk</a>.</p>
        </div>
      </div>
    </div>
  );
}
