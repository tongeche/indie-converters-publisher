import SEO from '../components/SEO';
import './Legal.css';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <SEO
        title="Privacy Policy | IndieConverters"
        description="How IndieConverters collects, uses, and protects your data."
        path="/privacy"
      />
      <div className="legal-container">
        <div className="eyebrow">Legal</div>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated 15 July 2026</p>

        <div className="legal-disclaimer">
          <strong>Draft notice:</strong> this is a placeholder policy written to describe our current data practices in plain language. It has not been reviewed by a lawyer and should not be relied on as final legal compliance — have it reviewed before launch.
        </div>

        <div className="legal-body">
          <h2>What we collect</h2>
          <p>When you use IndieConverters, we collect:</p>
          <ul>
            <li><strong>Account information</strong> — your email address and authentication details, handled by our backend provider, Supabase.</li>
            <li><strong>Uploaded manuscripts and files</strong> — stored securely and used only to generate your EPUB/PDF and power your listing.</li>
            <li><strong>Author and freelancer profile data</strong> — bio, photo, links, rates, and skills you choose to add to a public profile.</li>
            <li><strong>Hire briefs</strong> — the details you submit when posting or responding to a freelance job brief.</li>
            <li><strong>Assistant and support messages</strong> — messages you send to our virtual assistant and, if you ask for a human reply, your email address, optional first name, support message, and a request category inferred from the conversation.</li>
            <li><strong>Anonymous usage analytics</strong> — via Plausible, a cookieless analytics tool that does not collect personal data or track you across sites.</li>
          </ul>

          <h2>How we use it</h2>
          <p>We use your data to operate the core features of the site: hosting your book listings and author profile, converting and storing your manuscript files, connecting authors with freelancers, answering assistant and support requests, and understanding aggregate site usage so we can improve it. We do not sell your data.</p>

          <h2>Who we share it with</h2>
          <p>We don't share your personal data with third parties beyond the providers needed to run the site, including Supabase for authentication, database, and storage; Netlify for hosting and server functions; and OpenAI for generating virtual-assistant replies. Contact details entered during the guided human-support steps in the chat are sent only to our support-request service, not to OpenAI or the virtual-assistant message history. Freelancers and authors arrange their own working relationships and payment directly with each other — IndieConverters is not a party to those agreements and does not process payments on your behalf.</p>

          <h2>Your rights</h2>
          <p>You can access, update, or delete your account data at any time from your dashboard, or by emailing us. If you'd like your data exported or fully removed, contact <a href="mailto:info@indieconverters.uk">info@indieconverters.uk</a> and we'll take care of it.</p>

          <h2>Contact</h2>
          <p>Questions about this policy can go to <a href="mailto:info@indieconverters.uk">info@indieconverters.uk</a>.</p>
        </div>
      </div>
    </div>
  );
}
