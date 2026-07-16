import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import SEO from '../components/SEO';
import OurStorySection from '../components/OurStorySection';
import MissionCardSection from '../components/MissionCardSection';
import PublishAutomationSection from '../components/PublishAutomationSection';
import PublishingAnalyticsSection from '../components/PublishingAnalyticsSection';
import EndPageCta from '../components/EndPageCta';
import { trackEvent } from '../lib/analytics';
import {
  createAssistantSession,
  fetchBooks,
  fetchLandingQuotes,
  getAssistantVisitorId,
  saveAssistantMessage,
  submitAssistantHandoff,
} from '../lib/api';
import {
  ASSISTANT_PROMPTS,
  createWelcomeMessage,
  formatAssistantTime,
  getAssistantPageContext,
  isHumanSupportIntent,
  requestAssistantReply,
} from '../lib/assistant';
import { useAuth } from '../context/AuthContext';
import mainHeroImg    from '../assets/main-hero.webp';
import imgAche   from '../assets/moods/Ache.webp';
import imgDrift  from '../assets/moods/Drift.webp';
import imgHaunt  from '../assets/moods/haunt.webp';
import imgGasp   from '../assets/moods/Gasp.webp';
import imgBurn   from '../assets/moods/Burn.webp';
import imgWonder from '../assets/moods/Wonder.webp';
import imgEscape from '../assets/moods/Escape.webp';
import './Landing.css';

const DISTRIBUTION_CHANNELS = [
  { id: 'apple', label: 'Apple Books' },
  { id: 'kobo', label: 'Rakuten Kobo' },
  { id: 'google', label: 'Google Play' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'bn', label: 'Barnes & Noble' },
  { id: 'scribd', label: 'Scribd' },
  { id: 'overdrive', label: 'OverDrive' },
  { id: 'hoopla', label: 'Hoopla' },
  { id: 'baker', label: 'Baker & Taylor' },
  { id: 'tolino', label: 'Tolino' },
  { id: 'vivlio', label: 'Vivlio' },
  { id: 'smashwords', label: 'Smashwords' },
  { id: 'fable', label: 'Fable' },
  { id: 'kobo-plus', label: 'Kobo Plus' },
  { id: 'cloudlibrary', label: 'cloudLibrary' },
  { id: 'odilo', label: 'Odilo' },
  { id: 'borrowbox', label: 'BorrowBox' },
  { id: 'fnac', label: 'Fnac' },
  { id: 'wook', label: 'Wook' },
  { id: 'thalia', label: 'Thalia' },
  { id: 'gardner', label: 'Gardner' },
];

const DISTRIBUTION_ROWS = [DISTRIBUTION_CHANNELS];

function DistributionLogo({ channel }) {
  if (channel.id === 'apple') {
    return (
      <span className="dl-logo dl-logo--apple" aria-label={channel.label}>
        <svg viewBox="0 0 42 42" aria-hidden="true">
          <rect x="6" y="7" width="30" height="28" rx="7" />
          <path d="M14 16.5c2.9-1.5 5.3-.9 7 1.2 1.7-2.1 4.1-2.7 7-1.2v12.8c-3-1.5-5.4-.9-7 1.1-1.6-2-4-2.6-7-1.1Z" />
          <path d="M21 18.1v12.2" />
        </svg>
        <strong>Apple Books</strong>
      </span>
    );
  }

  if (channel.id === 'google') {
    return (
      <span className="dl-logo dl-logo--google" aria-label={channel.label}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M10 7.5 31 20 10 32.5Z" />
          <path d="m10 7.5 12.7 12.6L10 32.5Z" />
        </svg>
        <strong>Google Play</strong>
      </span>
    );
  }

  if (channel.id === 'amazon') {
    return (
      <span className="dl-logo dl-logo--amazon" aria-label={channel.label}>
        <strong>amazon</strong>
        <svg viewBox="0 0 96 16" aria-hidden="true">
          <path d="M12 7.5c15.5 8.7 45.4 8.7 65.7.2" />
          <path d="M71.5 5.2 79 7.3l-4.4 5.9" />
        </svg>
      </span>
    );
  }

  if (channel.id === 'bn') {
    return (
      <span className="dl-logo dl-logo--bn" aria-label={channel.label}>
        <strong>B&amp;N</strong>
        <span>Barnes &amp; Noble</span>
      </span>
    );
  }

  return (
    <span className={`dl-logo dl-logo--${channel.id}`} aria-label={channel.label}>
      <strong>{channel.label}</strong>
    </span>
  );
}

const HERO_SERVICES = [
  { to: '/upload', icon: 'formatting', title: 'Book Formatting', body: 'Polished, credible interiors ready for print.' },
  { to: '/upload', icon: 'epub', title: 'EPUB Conversion', body: 'Clean, responsive files for every e-reader.' },
  { to: '/tools/print-cover-calculator', icon: 'cover', title: 'Publishing Tools', body: 'Cover dimensions and tools for your workflow.' },
  { to: '/publish', icon: 'distribution', title: 'Distribution', body: 'Reach retailers, bookstores and libraries.' },
  { to: '/shop', icon: 'storefront', title: 'Author Storefront', body: 'One space to showcase and sell your books.' },
  { to: '/hire', icon: 'experts', title: 'Professionals', body: 'Editors, designers, illustrators and writers.' },
  { to: '/upload', icon: 'manuscript', title: 'Manuscript', body: 'Refine your manuscript from draft to final file.' },
  { to: '/check', icon: 'review', title: 'File Review', body: 'Catch formatting issues before you upload.' },
  { to: '/help', icon: 'resources', title: 'Resources', body: 'Guides, templates and tools for every stage.' },
];

function ServiceIcon({ name }) {
  const paths = {
    formatting: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
      </>
    ),
    epub: (
      <>
        <path d="M7 2.75h7l4 4V21.25H7z" />
        <path d="M14 2.75v4h4M10 11h5M10 14h5M10 17h3" />
      </>
    ),
    cover: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="1" />
        <path d="M8.5 4v16M3 7h2M3 12h2M3 17h2M19 7h2M19 12h2M19 17h2" />
      </>
    ),
    distribution: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9s-1.2 6.5-3.5 9c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3" />
      </>
    ),
    storefront: (
      <>
        <path d="M4 10v10h16V10M3 4h18l-1 6a3 3 0 0 1-4 1.5A3 3 0 0 1 12 10a3 3 0 0 1-4 1.5A3 3 0 0 1 4 10z" />
        <path d="M9 20v-5h6v5" />
      </>
    ),
    experts: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 3.5 4.75V20" />
      </>
    ),
    manuscript: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </>
    ),
    review: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m21 21-4.35-4.35" />
        <path d="M7 10l2 2 4-4" />
      </>
    ),
    resources: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function HeroSwirl() {
  const rays = Array.from({ length: 108 }, (_, index) => {
    const progress = index / 107;
    const spread = (progress - 0.5) * 1080;
    const drift = Math.sin(index * 2.17) * 24;
    const height = 150 + ((index * 83) % 500);
    const startX = 600 + Math.sin(index * 1.41) * 20;
    const endX = 600 + spread + drift;
    const opacity = 0.2 + ((index * 17) % 55) / 100;

    return {
      id: index,
      x1: startX,
      x2: endX,
      y2: height,
      opacity,
      delay: `${-((index * 0.13) % 4.8).toFixed(2)}s`,
      duration: `${(4.8 + ((index * 11) % 30) / 10).toFixed(1)}s`,
      radius: 1.3 + (index % 4) * 0.35,
    };
  });

  return (
    <div className="hero-swirl" aria-hidden="true">
      <div className="hero-swirl-glow" />
      <svg className="hero-swirl-rays" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="hero-ray-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5b2be0" />
            <stop offset="46%" stopColor="#d946b8" />
            <stop offset="100%" stopColor="#ff6f7d" />
          </linearGradient>
        </defs>
        <g>
          {rays.map(ray => (
            <g
              key={ray.id}
              className="hero-swirl-ray"
              style={{ '--ray-delay': ray.delay, '--ray-duration': ray.duration, '--ray-opacity': ray.opacity }}
            >
              <line x1={ray.x1} y1="930" x2={ray.x2} y2={ray.y2} />
              <circle cx={ray.x2} cy={ray.y2} r={ray.radius} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

const FALLBACK_QUOTES = [
  {
    quote: 'Every book deserves a clean file, a real cover, and a chance to be found.',
    author: 'Indie Converters',
    role: 'Publishing principle',
  },
  {
    quote: "Self-publishing isn't a compromise. It is a different kind of craft.",
    author: 'Indie Converters',
    role: 'For authors',
  },
  {
    quote: 'The best publishing tools get out of the way and let the writing lead.',
    author: 'Indie Converters',
    role: 'Product note',
  },
  {
    quote: 'An indie author with the right files can reach any reader, anywhere.',
    author: 'Indie Converters',
    role: 'Distribution belief',
  },
];

function quoteSizeClass(text) {
  const len = text.length;
  if (len > 170) return ' quote-text--xxlong';
  if (len > 120) return ' quote-text--xlong';
  if (len > 70)  return ' quote-text--long';
  return '';
}

function QuoteRotator({ quotes = FALLBACK_QUOTES }) {
  const quoteItems = (quotes?.length ? quotes : FALLBACK_QUOTES)
    .map(item => typeof item === 'string'
      ? { quote: item, author: 'Indie Converters', role: '' }
      : {
          quote: item.quote || item.text || '',
          author: item.author || 'Indie Converters',
          role: item.role || '',
        })
    .filter(item => item.quote);

  const [idx, setIdx]     = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'exit' | 'enter'
  const nextIdxRef = useRef(0);
  const rafRef     = useRef(0);
  const activeQuote = quoteItems[idx] || quoteItems[0];

  useEffect(() => {
    if (idx >= quoteItems.length) setIdx(0);
  }, [idx, quoteItems.length]);

  useEffect(() => {
    if (quoteItems.length < 2 || phase !== 'idle') return undefined;
    const id = setInterval(() => {
      nextIdxRef.current = (idx + 1) % quoteItems.length;
      setPhase('exit');
    }, 5000);
    return () => clearInterval(id);
  }, [idx, phase, quoteItems.length]);

  // After the outgoing slide finishes sliding out, swap content and jump it
  // to the entry position with transitions disabled, then release into the
  // entry transition on the next two frames (avoids the browser collapsing
  // the "jump" and the "animate in" into a single, wrong-direction tween).
  useEffect(() => {
    if (phase !== 'enter') return undefined;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setPhase('idle'));
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  function onTransitionEnd(e) {
    if (e.propertyName !== 'opacity' || phase !== 'exit') return;
    setIdx(nextIdxRef.current);
    setPhase('enter');
  }

  function goTo(i) {
    if (i === idx || phase !== 'idle') return;
    nextIdxRef.current = i;
    setPhase('exit');
  }

  if (!activeQuote) return null;

  return (
    <div className="quote-card">
      <div
        className={`quote-slide${phase === 'exit' ? ' quote-slide--exit' : ''}${phase === 'enter' ? ' quote-slide--enter' : ''}`}
        onTransitionEnd={onTransitionEnd}
      >
        <span className="quote-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-4v-10h10z" />
          </svg>
        </span>
        <blockquote className={`quote-text${quoteSizeClass(activeQuote.quote)}`}>
          {activeQuote.quote}
        </blockquote>
        <div className="quote-attribution">
          <strong className="quote-author">{activeQuote.author}</strong>
          {activeQuote.role && <span className="quote-role">{activeQuote.role}</span>}
        </div>
      </div>
      <div className="quote-controls" aria-label="Quote navigation">
        {quoteItems.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`quote-dot${i === idx ? ' quote-dot--active' : ''}`}
            aria-label={`Show quote ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

const MOODS = [
  { verb: 'Ache',   label: 'Dark family tension',    desc: 'Books that pull at the fraying edges of the people closest to us.',                          accent: '#C084FC', img: imgAche,   genre: 'literary-fiction' },
  { verb: 'Drift',  label: 'Quiet strange worlds',   desc: 'Stories where the uncanny sits just below the surface of the ordinary.',                     accent: '#67E8F9', img: imgDrift,  genre: 'science-fiction' },
  { verb: 'Haunt',  label: 'Gothic but readable',    desc: 'All the atmosphere, none of the impenetrable Victorian prose.',                              accent: '#FDA4AF', img: imgHaunt,  genre: 'horror' },
  { verb: 'Gasp',   label: 'Psychological thrillers',desc: 'Untrustworthy narrators, bad decisions, and endings you didn\'t see coming.',                accent: '#93C5FD', img: imgGasp,   genre: 'thriller' },
  { verb: 'Burn',   label: 'Women under pressure',   desc: 'Characters holding too much together for too long — until they can\'t.',                     accent: '#FCA5A5', img: imgBurn,   genre: 'literary-fiction' },
  { verb: 'Wonder', label: 'Mind-bending nonfiction',desc: 'Science, psychology, and human behaviour explained through story.',                          accent: '#86EFAC', img: imgWonder, genre: 'nonfiction' },
  { verb: 'Escape', label: 'Adventure & discovery',  desc: 'Books that pull you out of your life and drop you somewhere better.',                        accent: '#FCD34D', img: imgEscape, genre: 'fiction' },
  { verb: 'Grieve', label: 'Quiet loss & resilience',desc: 'Stories that sit with grief honestly, without rushing toward resolution.',                   accent: '#94A3B8', accentDark: '#334155', genre: 'literary-fiction' },
];

const ASSISTANT_CONSENT_STORAGE_KEY = 'ic_assistant_consent';
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function assistantContactName(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || '';
}

function createAssistantHandoffDraft() {
  return {
    contactName: '',
    contactEmail: '',
    contextMessage: '',
    note: '',
    verification: '',
    formStartedAt: Date.now(),
  };
}

function createInlineAssistantMessage(role, text, options = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    time: formatAssistantTime(),
    ...options,
  };
}

function latestHandoffContext(messages = []) {
  return [...messages]
    .reverse()
    .find(message => (
      message.role === 'user'
      && !message.handoffFlow
      && !message.handoffSensitive
      && message.text?.trim().length >= 10
      && !isHumanSupportIntent(message.text)
    ))?.text?.trim() || '';
}

function humanRequestContext(message) {
  const value = message.trim();
  if (value.length < 24) return '';
  return /\b(book|manuscript|upload|publish|format|cover|isbn|price|retailer|order|account|login|profile|editor|designer|error|issue|problem|failed|help with)\b/i.test(value)
    ? value
    : '';
}

function inferHandoffTopic(message, pathname = '/') {
  const value = message.toLowerCase();
  const path = pathname.toLowerCase();
  if (/\b(error|bug|broken|technical|failed|failure|not working)\b/.test(value)) return 'technical';
  if (/\b(account|sign in|login|password|profile|dashboard|access)\b/.test(value)) return 'account';
  if (/\b(hire|hiring|editor|designer|illustrator|freelancer|creative expert)\b/.test(value)) return 'hiring';
  if (/\b(upload|publish|publishing|manuscript|isbn|cover|format|epub|distribution)\b/.test(value)) return 'publishing';
  if (/\b(find|discover|shop|buy|book|author|genre|retailer)\b/.test(value)) return 'book_discovery';
  if (/^\/(?:upload|publish)/.test(path)) return 'publishing';
  if (/^\/(?:shop|book|browse|collections)/.test(path)) return 'book_discovery';
  if (/^\/dashboard/.test(path)) return 'account';
  return 'other';
}

function buildHandoffMessage(draft) {
  const context = draft.contextMessage.trim();
  const note = draft.note.trim();
  if (context && note) return `Earlier question: ${context}\n\nAdditional details: ${note}`.slice(0, 1000);
  return (context || note).slice(0, 1000);
}

function handoffComposerPlaceholder(step) {
  if (step === 'name') return 'Type your name, or choose Skip';
  if (step === 'email') return 'Enter your email address';
  if (step === 'details') return 'Tell the team how they can help';
  if (step === 'submitting') return 'Sending your request…';
  return 'Ask about publishing or books...';
}

function readAssistantConsent() {
  if (typeof window === 'undefined') return { messages: false, storage: false };
  try {
    const saved = window.localStorage.getItem(ASSISTANT_CONSENT_STORAGE_KEY);
    if (!saved) return { messages: false, storage: false };
    const parsed = JSON.parse(saved);
    return {
      messages: Boolean(parsed.messages),
      storage: Boolean(parsed.storage),
      acceptedAt: parsed.acceptedAt || null,
    };
  } catch {
    return { messages: false, storage: false };
  }
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState([]);
  const [assistantBooks, setAssistantBooks] = useState([]);
  const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
  const [moodActive,      setMoodActive]      = useState(null);
  const [moodScrollState, setMoodScrollState] = useState({ atStart: true, atEnd: false });
  const [featuredScrollState, setFeaturedScrollState] = useState({ atStart: true, atEnd: false });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantPending, setAssistantPending] = useState(false);
  const [assistantConsent, setAssistantConsent] = useState(() => readAssistantConsent());
  const [assistantMessages, setAssistantMessages] = useState(() => [createWelcomeMessage(user)]);
  const [handoffStep, setHandoffStep] = useState('idle');
  const [handoffDraft, setHandoffDraft] = useState(() => createAssistantHandoffDraft());
  const [handoffPending, setHandoffPending] = useState(false);
  const [activeHumanOfferId, setActiveHumanOfferId] = useState(null);
  const [humanOfferShown, setHumanOfferShown] = useState(false);
  const moodTrackRef = useRef(null);
  const featuredTrackRef = useRef(null);
  const assistantMessagesRef = useRef(null);
  const assistantSessionIdRef = useRef(null);
  const assistantSessionPromiseRef = useRef(null);
  const assistantSessionGenerationRef = useRef(0);
  const assistantReplyRequestIdRef = useRef(0);
  const handoffRequestIdRef = useRef(0);
  const handoffSubmittingRef = useRef(false);
  const assistantPanelRef = useRef(null);
  const assistantInputRef = useRef(null);
  const assistantToggleRef = useRef(null);
  const assistantDragStartRef = useRef(null);

  const clearHandoffState = useCallback(() => {
    setHandoffStep('idle');
    setHandoffDraft(createAssistantHandoffDraft());
    setHandoffPending(false);
    handoffSubmittingRef.current = false;
    setActiveHumanOfferId(null);
  }, []);

  const closeAssistant = useCallback(() => {
    assistantReplyRequestIdRef.current += 1;
    handoffRequestIdRef.current += 1;
    setAssistantOpen(false);
    setAssistantCollapsed(false);
    setAssistantPending(false);
    setAssistantInput('');
    setAssistantMessages(messages => messages.filter(message => (
      !message.handoffFlow
      && !message.handoffSensitive
      && message.kind !== 'human-offer'
    )));
    clearHandoffState();
    window.requestAnimationFrame(() => assistantToggleRef.current?.focus());
  }, [clearHandoffState]);

  useEffect(() => {
    fetchBooks({ limit: 48, indieOnly: true }).then(({ books }) => setAllBooks(books));
    fetchBooks({ limit: 120 }).then(({ books }) => setAssistantBooks(books));
    fetchLandingQuotes().then(fetchedQuotes => {
      if (fetchedQuotes.length) setQuotes(fetchedQuotes);
    });
  }, []);

  function updateMoodScrollState() {
    const track = moodTrackRef.current;
    if (!track) return;
    setMoodScrollState({
      atStart: track.scrollLeft <= 2,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
  }

  function scrollMoods(direction) {
    const track = moodTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.mood-lcard');
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 10;
    const step = (card?.getBoundingClientRect().width || track.clientWidth / 3) + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  useEffect(() => {
    updateMoodScrollState();
    window.addEventListener('resize', updateMoodScrollState);
    return () => window.removeEventListener('resize', updateMoodScrollState);
  }, []);

  useEffect(() => {
    if (!assistantOpen || !assistantMessagesRef.current) return;
    assistantMessagesRef.current.scrollTop = assistantMessagesRef.current.scrollHeight;
  }, [assistantMessages, assistantOpen, assistantPending, handoffPending]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 560 || !assistantOpen || assistantCollapsed) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [assistantOpen, assistantCollapsed]);

  useEffect(() => {
    if (!assistantOpen) return undefined;

    const focusFrame = window.requestAnimationFrame(() => {
      const panel = assistantPanelRef.current;
      const viewHeading = panel?.querySelector('[data-assistant-view-focus]');
      const closeButton = panel?.querySelector('.landing-assistant-close');
      (viewHeading || closeButton)?.focus();
    });

    const handleDialogKeydown = event => {
      if (event.key === 'Escape') {
        closeAssistant();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = assistantPanelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter(element => element.getClientRects().length > 0);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (!focusable.includes(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleDialogKeydown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleDialogKeydown);
    };
  }, [assistantOpen, closeAssistant]);

  useEffect(() => {
    if (!assistantOpen) return undefined;
    if (!['name', 'email', 'details', 'review', 'error'].includes(handoffStep)) return undefined;

    const focusFrame = window.requestAnimationFrame(() => {
      if (['name', 'email', 'details'].includes(handoffStep)) {
        assistantInputRef.current?.focus();
        return;
      }
      const actionButtons = assistantPanelRef.current?.querySelectorAll('.landing-assistant-message-actions button');
      actionButtons?.[actionButtons.length - 2]?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [assistantOpen, handoffStep]);

  useEffect(() => {
    setAssistantMessages([createWelcomeMessage(user)]);
    assistantReplyRequestIdRef.current += 1;
    handoffRequestIdRef.current += 1;
    setAssistantPending(false);
    setAssistantInput('');
    setHumanOfferShown(false);
    clearHandoffState();
    assistantSessionGenerationRef.current += 1;
    assistantSessionIdRef.current = null;
    assistantSessionPromiseRef.current = null;
  }, [user, clearHandoffState]);

  const withCovers = allBooks.filter(b => b.coverUrl);
  const featured = withCovers.slice(0, 12);

  function updateFeaturedScrollState() {
    const track = featuredTrackRef.current;
    if (!track) return;
    setFeaturedScrollState({
      atStart: track.scrollLeft <= 2,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
  }

  function scrollFeatured(direction) {
    const track = featuredTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.featured-card');
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 10;
    const step = (card?.getBoundingClientRect().width || track.clientWidth / 3) + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  useEffect(() => {
    updateFeaturedScrollState();
    window.addEventListener('resize', updateFeaturedScrollState);
    return () => window.removeEventListener('resize', updateFeaturedScrollState);
    // `featured` is a new array reference every render (derived inline from
    // allBooks) -- depending on it directly reruns this effect every render,
    // which calls setState and forces another render, forever. Depend on the
    // length instead: a stable primitive that only changes once the books
    // actually finish loading.
  }, [featured.length]);

  function scrollToValueProps(e) {
    e.preventDefault();
    const el = document.getElementById('why-indie-converters');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  async function ensureAssistantSession(consent = assistantConsent) {
    if (assistantSessionIdRef.current) return assistantSessionIdRef.current;
    if (assistantSessionPromiseRef.current) return assistantSessionPromiseRef.current;

    const acceptedAt = consent.acceptedAt || new Date().toISOString();
    const generation = assistantSessionGenerationRef.current;
    const sessionPromise = (async () => {
      const sessionId = await createAssistantSession({
        userId: user?.id || null,
        visitorId: user ? null : getAssistantVisitorId(),
        consentAcceptedAt: acceptedAt,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '/',
      });

      if (assistantSessionGenerationRef.current !== generation) return null;
      assistantSessionIdRef.current = sessionId;

      const welcome = assistantMessages.find(message => message.id === 'welcome');
      if (welcome) {
        await saveAssistantMessage({
          sessionId,
          userId: user?.id || null,
          visitorId: user ? null : getAssistantVisitorId(),
          role: 'assistant',
          content: welcome.text,
          metadata: { source: 'welcome' },
        });
      }

      if (assistantSessionGenerationRef.current !== generation) return null;
      return sessionId;
    })();
    assistantSessionPromiseRef.current = sessionPromise;

    try {
      return await sessionPromise;
    } finally {
      if (assistantSessionPromiseRef.current === sessionPromise) {
        assistantSessionPromiseRef.current = null;
      }
    }
  }

  async function persistAssistantMessage(message, sessionIdOverride) {
    if (message.handoffFlow || message.handoffSensitive) return;
    try {
      const sessionId = sessionIdOverride || await ensureAssistantSession();
      await saveAssistantMessage({
        sessionId,
        userId: user?.id || null,
        visitorId: user ? null : getAssistantVisitorId(),
        role: message.role,
        content: message.text,
        metadata: {
          client_message_id: message.id,
          has_book_results: Boolean(message.books?.length),
          book_slugs: message.books?.map(book => book.slug) || [],
          assistant_context: message.context || null,
          assistant_sources: message.sources || [],
        },
      });
    } catch (error) {
      console.error('[assistant] failed to persist message:', error?.message || error);
    }
  }

  function acceptAssistantConsent() {
    if (assistantConsent.acceptedAt || typeof window === 'undefined') return assistantConsent;
    const acceptedAt = new Date().toISOString();
    const nextConsent = { messages: true, storage: true, acceptedAt };
    window.localStorage.setItem(ASSISTANT_CONSENT_STORAGE_KEY, JSON.stringify(nextConsent));
    setAssistantConsent(nextConsent);
    return nextConsent;
  }

  function toggleAssistant() {
    if (assistantOpen) {
      closeAssistant();
      return;
    }
    setAssistantCollapsed(false);
    setAssistantOpen(true);
  }

  function startAssistantDrag(event) {
    if (typeof window === 'undefined' || window.innerWidth > 560) return;
    assistantDragStartRef.current = event.touches?.[0]?.clientY ?? null;
  }

  function endAssistantDrag(event) {
    if (assistantDragStartRef.current == null) return;
    const endY = event.changedTouches?.[0]?.clientY ?? assistantDragStartRef.current;
    const distance = endY - assistantDragStartRef.current;
    assistantDragStartRef.current = null;
    if (distance > 64) setAssistantCollapsed(true);
    if (distance < -48) setAssistantCollapsed(false);
  }

  function expandCollapsedAssistant(event) {
    if (!assistantCollapsed || event.target.closest('button')) return;
    setAssistantCollapsed(false);
  }

  function appendHumanOffer({ force = false, source = 'assistant', contextMessage = '' } = {}) {
    if (handoffStep !== 'idle' || activeHumanOfferId || (humanOfferShown && !force)) return;

    assistantReplyRequestIdRef.current += 1;
    setAssistantPending(false);
    const offer = createInlineAssistantMessage(
      'assistant',
      'Would you like to talk with one of our human assistants?',
      {
        kind: 'human-offer',
        handoffContext: contextMessage,
        handoffSensitive: Boolean(contextMessage),
      },
    );
    setAssistantMessages(messages => [...messages, offer]);
    setActiveHumanOfferId(offer.id);
    setHumanOfferShown(true);
    trackEvent('Human Support Offered', { source });
  }

  function beginHumanHandoff() {
    const triggeringContext = assistantMessages.find(message => message.id === activeHumanOfferId)?.handoffContext || '';
    const contextMessage = triggeringContext || latestHandoffContext(assistantMessages);
    const draft = {
      ...createAssistantHandoffDraft(),
      contextMessage,
    };
    setActiveHumanOfferId(null);
    setHandoffDraft(draft);
    setHandoffStep('name');
    setAssistantInput(assistantContactName(user));
    setAssistantMessages(messages => [
      ...messages,
      createInlineAssistantMessage('user', 'Yes, please.', { handoffFlow: true }),
      createInlineAssistantMessage(
        'assistant',
        'Of course. I’ll collect a few details here and pass them to the team. What should we call you?',
        { handoffFlow: true },
      ),
    ]);
    acceptAssistantConsent();
    trackEvent('Human Support Started', { hasConversationContext: Boolean(contextMessage) });
  }

  function dismissHumanOffer() {
    setActiveHumanOfferId(null);
    setAssistantMessages(messages => [
      ...messages,
      createInlineAssistantMessage('user', 'No, keep chatting.', { handoffFlow: true }),
      createInlineAssistantMessage('assistant', 'No problem — we can keep chatting here. What else can I help with?', { handoffFlow: true }),
    ]);
    window.requestAnimationFrame(() => assistantInputRef.current?.focus());
  }

  function cancelHumanHandoff() {
    handoffRequestIdRef.current += 1;
    setAssistantInput('');
    clearHandoffState();
    setAssistantMessages(messages => [
      ...messages.filter(message => (
        !message.handoffFlow
        && !message.handoffSensitive
        && message.kind !== 'human-offer'
      )),
      createInlineAssistantMessage('assistant', 'No problem — I haven’t sent anything. We can keep chatting here.', { handoffFlow: true }),
    ]);
    window.requestAnimationFrame(() => assistantInputRef.current?.focus());
    trackEvent('Human Support Cancelled', { step: handoffStep });
  }

  function appendHandoffPrompt(text, options = {}) {
    setAssistantMessages(messages => {
      const lastMessage = messages.at(-1);
      if (lastMessage?.role === 'assistant' && lastMessage.text === text) return messages;
      return [
        ...messages,
        createInlineAssistantMessage('assistant', text, { handoffFlow: true, ...options }),
      ];
    });
  }

  async function submitHumanHandoff(draftOverride = handoffDraft) {
    if (handoffSubmittingRef.current) return;
    const contactName = draftOverride.contactName.trim();
    const contactEmail = draftOverride.contactEmail.trim().toLowerCase();
    const message = buildHandoffMessage(draftOverride);

    if (!EMAIL_PATTERN.test(contactEmail) || message.length < 10) {
      appendHandoffPrompt('I’m missing a valid email or enough detail to send this request. Please add those details and try again.', { kind: 'handoff-error' });
      setHandoffStep(!EMAIL_PATTERN.test(contactEmail) ? 'email' : 'details');
      return;
    }

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    const topic = inferHandoffTopic(message, pathname);
    const activeConsent = acceptAssistantConsent();
    const requestId = handoffRequestIdRef.current + 1;
    handoffRequestIdRef.current = requestId;
    handoffSubmittingRef.current = true;
    setHandoffStep('submitting');
    setHandoffPending(true);
    setAssistantInput('');

    try {
      let sessionId = assistantSessionIdRef.current;
      try {
        sessionId = sessionId || await ensureAssistantSession(activeConsent);
      } catch (error) {
        console.error('[assistant] failed to create session before handoff:', error?.message || error);
      }

      if (handoffRequestIdRef.current !== requestId) return;

      await submitAssistantHandoff({
        sessionId,
        visitorId: user ? null : getAssistantVisitorId(),
        contactName: contactName || null,
        contactEmail,
        topic,
        message,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '/',
        consentAccepted: Boolean(activeConsent.acceptedAt),
        verification: draftOverride.verification,
        formStartedAt: draftOverride.formStartedAt,
      });
      if (handoffRequestIdRef.current !== requestId) return;

      const name = contactName ? `, ${contactName}` : '';
      setAssistantMessages(messages => [
        ...messages,
        createInlineAssistantMessage(
          'assistant',
          `Thanks${name} — I’ve queued your request for our human support team. Please wait for us to get back to you at ${contactEmail}. You can keep chatting with me in the meantime.`,
          { handoffFlow: true, handoffSensitive: true, kind: 'handoff-success' },
        ),
      ]);
      setHandoffDraft(createAssistantHandoffDraft());
      setHandoffStep('idle');
      setActiveHumanOfferId(null);
      window.requestAnimationFrame(() => assistantInputRef.current?.focus());
      trackEvent('Human Support Request Submitted', { topic });
    } catch (error) {
      if (handoffRequestIdRef.current !== requestId) return;
      setHandoffStep('error');
      appendHandoffPrompt(
        error?.message || 'We could not send your request. Please try again.',
        { kind: 'handoff-error' },
      );
    } finally {
      if (handoffRequestIdRef.current === requestId) {
        handoffSubmittingRef.current = false;
        setHandoffPending(false);
      }
    }
  }

  function handleHandoffAnswer(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (/^(cancel|never mind|nevermind|stop)$/i.test(trimmed)) {
      cancelHumanHandoff();
      return;
    }

    if (handoffStep === 'name') {
      const skipName = /^(skip|prefer not to say|no name)$/i.test(trimmed);
      if (!skipName && trimmed.length > 100) {
        appendHandoffPrompt('Please use 100 characters or fewer for your name.');
        return;
      }
      const contactName = skipName ? '' : trimmed;
      setHandoffDraft(draft => ({ ...draft, contactName }));
      setAssistantMessages(messages => [
        ...messages,
        createInlineAssistantMessage('user', skipName ? 'Skip my name.' : contactName, { handoffFlow: true, handoffSensitive: true }),
        createInlineAssistantMessage('assistant', 'What email address should our team use to reply?', { handoffFlow: true }),
      ]);
      setHandoffStep('email');
      setAssistantInput(user?.email || '');
      return;
    }

    if (handoffStep === 'email') {
      const contactEmail = trimmed.toLowerCase();
      if (!EMAIL_PATTERN.test(contactEmail) || contactEmail.length > 254) {
        appendHandoffPrompt('That email doesn’t look quite right. Please enter a valid email address.');
        return;
      }
      const nextDraft = { ...handoffDraft, contactEmail };
      setHandoffDraft(nextDraft);
      setAssistantInput('');
      setAssistantMessages(messages => [
        ...messages,
        createInlineAssistantMessage('user', contactEmail, { handoffFlow: true, handoffSensitive: true }),
      ]);

      if (nextDraft.contextMessage) {
        const contextPreview = nextDraft.contextMessage.length > 180
          ? `${nextDraft.contextMessage.slice(0, 177)}…`
          : nextDraft.contextMessage;
        appendHandoffPrompt(
          `I’ll include your earlier question: “${contextPreview}” Is there anything else you’d like the team to know?`,
          { kind: 'handoff-review' },
        );
        setHandoffStep('review');
      } else {
        appendHandoffPrompt('In one or two sentences, what would you like help with? Please don’t include passwords or payment details.');
        setHandoffStep('details');
      }
      return;
    }

    if (handoffStep === 'details') {
      if (trimmed.length < 10) {
        appendHandoffPrompt('Please add a little more detail so the team knows how to help.');
        return;
      }
      if (trimmed.length > 1000) {
        appendHandoffPrompt('Please keep the request to 1,000 characters or fewer.');
        return;
      }
      const nextDraft = { ...handoffDraft, note: trimmed };
      setHandoffDraft(nextDraft);
      setAssistantMessages(messages => [
        ...messages,
        createInlineAssistantMessage('user', trimmed, { handoffFlow: true, handoffSensitive: true }),
      ]);
      submitHumanHandoff(nextDraft);
    }
  }

  async function sendAssistantMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (handoffStep !== 'idle') {
      if (!handoffPending && handoffStep !== 'review' && handoffStep !== 'error') {
        setAssistantInput('');
        handleHandoffAnswer(trimmed);
      }
      return;
    }
    if (assistantPending) return;

    if (isHumanSupportIntent(trimmed)) {
      setAssistantInput('');
      setAssistantMessages(messages => [
        ...messages,
        createInlineAssistantMessage('user', trimmed, { handoffFlow: true }),
      ]);
      appendHumanOffer({
        force: true,
        source: 'user-message',
        contextMessage: humanRequestContext(trimmed),
      });
      return;
    }

    const activeConsent = acceptAssistantConsent();
    ensureAssistantSession(activeConsent).catch(error => {
      console.error('[assistant] failed to create session:', error?.message || error);
    });
    const userMessage = createInlineAssistantMessage('user', trimmed);
    const publicHistory = [...assistantMessages, userMessage]
      .filter(message => (
        !message.handoffFlow
        && !message.handoffSensitive
        && ['user', 'assistant'].includes(message.role)
      ));
    const requestId = assistantReplyRequestIdRef.current + 1;
    assistantReplyRequestIdRef.current = requestId;

    setAssistantInput('');
    setAssistantPending(true);
    setAssistantMessages(messages => [...messages, userMessage]);
    persistAssistantMessage(userMessage);

    const searchableBooks = assistantBooks.length ? assistantBooks : allBooks;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const pageContext = getAssistantPageContext(typeof window !== 'undefined' ? window.location.pathname : '/');
    const reply = await requestAssistantReply({
      message: trimmed,
      history: publicHistory,
      books: searchableBooks,
      sessionId: assistantSessionIdRef.current,
      pageUrl,
      pageContext,
    });
    if (assistantReplyRequestIdRef.current !== requestId) return;

    const assistantReply = createInlineAssistantMessage('assistant', reply.text, reply);
    setAssistantMessages(messages => [...messages, assistantReply]);
    setAssistantPending(false);
    persistAssistantMessage(assistantReply);
  }

  function handleAssistantSubmit(event) {
    event.preventDefault();
    sendAssistantMessage(assistantInput);
  }

  function addHandoffNote() {
    setHandoffStep('details');
    setAssistantInput('');
    appendHandoffPrompt('What else would you like the team to know? Please don’t include passwords or payment details.');
  }

  function resetAssistantChat() {
    assistantReplyRequestIdRef.current += 1;
    handoffRequestIdRef.current += 1;
    setAssistantPending(false);
    setAssistantInput('');
    setAssistantMessages([createWelcomeMessage(user)]);
    setHumanOfferShown(false);
    clearHandoffState();
    assistantSessionGenerationRef.current += 1;
    assistantSessionIdRef.current = null;
    assistantSessionPromiseRef.current = null;
  }

  const handoffCollecting = handoffStep !== 'idle';
  const composerDisabled = assistantPending
    || handoffPending
    || ['review', 'submitting', 'error'].includes(handoffStep);
  const lastAssistantMessageId = assistantMessages.at(-1)?.id;

  return (
    <div className="landing">
      <SEO
        title="Indie Converters — Books that deserve to be found."
        description="Curated indie books for readers. A proper publishing tool for authors. No exclusivity, no middlemen."
        path="/"
      />

      {/* ── Hero ── */}
      <section className="hero">
        <HeroSwirl />
        <div className="hero-glow hero-glow--one" aria-hidden="true" />
        <div className="hero-glow hero-glow--two" aria-hidden="true" />

        <div className="hero-inner container">
          <div className="hero-copy">
            <h1 className="hero-heading">Independent publishing, made easier</h1>
            <p className="hero-sub">
              Write, publish, distribute and sell your book—all from one simple platform.
            </p>
            <div className="hero-ctas">
              <Link
                to="/upload"
                className="btn hero-btn-primary"
                onClick={() => trackEvent('Start Publishing Click', { location: 'hero' })}
              >
                Publish your book <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="hero-product" aria-label="Indie Converters publishing workspace preview">
            <div className="hero-feature-visual">
              <img src={mainHeroImg} alt="Independent author using Indie Converters" />
            </div>
            <div className="hero-feature-services">
              <div className="hero-services-heading">
                <span>Services</span>
                <Link to="/publish">Explore all →</Link>
              </div>
              <div className="hero-tool-grid">
                {HERO_SERVICES.map(service => (
                  <Link key={service.title} to={service.to} className="hero-tool-card">
                    <span className="hero-tool-icon"><ServiceIcon name={service.icon} /></span>
                    <strong>{service.title}</strong>
                    <small>{service.body}</small>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <a
          href="#why-indie-converters"
          className="hero-scroll-cue"
          aria-label="Scroll to why Indie Converters"
          onClick={scrollToValueProps}
        >
          <span className="hero-scroll-cue-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M5 9l7 7 7-7" />
            </svg>
          </span>
        </a>
      </section>

      <OurStorySection />

      {/* ── Distribution channels ── */}
      <section className="distribution-strip" aria-labelledby="distribution-heading">
        <div className="container distribution-inner">
          <div className="distribution-copy">
            <h2 id="distribution-heading">Sell your book where readers already are</h2>
            <p>Retailers, libraries, and regional ebookstores authors already trust.</p>
          </div>
          <div className="distribution-marquee" aria-label="Distribution channels">
            {DISTRIBUTION_ROWS.map((channels, rowIndex) => (
              <div
                key={`distribution-row-${rowIndex}`}
                className={`distribution-marquee-row distribution-marquee-row--${rowIndex + 1}`}
              >
                <div className="distribution-marquee-track">
                  {[0, 1].map(copyIndex => (
                    <div
                      key={`distribution-set-${rowIndex}-${copyIndex}`}
                      className="distribution-marquee-set"
                      aria-hidden={copyIndex === 1 ? true : undefined}
                    >
                      {channels.map(channel => (
                        <div key={`${channel.id}-${copyIndex}`} className="distribution-logo-cell">
                          <DistributionLogo channel={channel} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Books ── */}
      <section className="section featured">
        <div className="container">
          <div className="section-header featured-header">
            <div>
              <div className="eyebrow">Featured work</div>
              <h2>Hand-picked indie titles</h2>
            </div>
            <div className="featured-controls">
              <Link to="/browse" className="featured-see-all">
                Browse all books
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
              <div className="featured-arrows">
                <button
                  type="button"
                  className="featured-arrow featured-arrow--prev"
                  onClick={() => scrollFeatured(-1)}
                  disabled={featuredScrollState.atStart}
                  aria-label="Previous books"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M15 6l-6 6 6 6"/></svg>
                </button>
                <button
                  type="button"
                  className="featured-arrow featured-arrow--next"
                  onClick={() => scrollFeatured(1)}
                  disabled={featuredScrollState.atEnd}
                  aria-label="Next books"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 6l6 6-6 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="featured-carousel">
            <div className="featured-track" ref={featuredTrackRef} onScroll={updateFeaturedScrollState}>
              {featured.map(book => (
                <Link to={`/book/${book.slug}`} key={book.slug} className="featured-card">
                  <div className="featured-card-cover">
                    <BookCover title={book.title} author={book.author} colorClass={book.coverColor} coverUrl={book.coverUrl} />
                    <div className="featured-card-overlay">
                      <span className="featured-card-badge">{book.genre}</span>
                      <h3 className="featured-card-title">{book.title}</h3>
                      <span className="featured-card-author">{book.author}</span>
                      {book.blurb && <p className="featured-card-blurb">{book.blurb}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MissionCardSection />

      <PublishingAnalyticsSection />

      {/* ── Mood shelf ── */}
      <section className="section mood-shelf" id="why-indie-converters">
        <div className="container">
          <div className="mood-shelf-hero">
            <div className="mood-shelf-hero-left">
              <h2 className="mood-lheading">Find your next read by feeling</h2>
              <button
                className="btn mood-surprise-btn"
                onClick={() => {
                  const GENRES = ['literary-fiction', 'science-fiction', 'horror', 'thriller', 'nonfiction', 'fiction'];
                  navigate(`/browse?genre=${GENRES[Math.floor(Math.random() * GENRES.length)]}`);
                }}
              >
                Surprise me →
              </button>
            </div>
            <div className="mood-shelf-hero-copy">
              <p className="mood-lsub">Pick a feeling. We'll point you to the right shelf.</p>
              <p className="mood-lsub">From books that ache quietly to stories that burn, escape, haunt, or make you wonder, browse indie titles by the mood they leave behind.</p>
            </div>
          </div>
          <div className="mood-carousel">
            <button
              type="button"
              className="mood-carousel-arrow mood-carousel-arrow--prev"
              onClick={() => scrollMoods(-1)}
              disabled={moodScrollState.atStart}
              aria-label="Previous moods"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M15 6l-6 6 6 6"/></svg>
            </button>

            <div className="mood-carousel-track" ref={moodTrackRef} onScroll={updateMoodScrollState}>
              {MOODS.map(m => (
                <Link
                  to={`/browse?genre=${m.genre}`}
                  key={m.verb}
                  className={`mood-lcard${m.img ? ' mood-lcard--img' : ''}${moodActive?.verb === m.verb ? ' mood-lcard--active' : ''}`}
                  style={!m.img ? { background: m.accentDark } : undefined}
                  onMouseEnter={() => setMoodActive(m)}
	                  onMouseLeave={() => setMoodActive(null)}
	                >
	                  {m.img ? (
                      <img src={m.img} className="mood-lcard-photo" alt="" />
                    ) : (
                      <span className="mood-lcard-photo mood-lcard-photo--fallback" style={{ background: m.accentDark }}>
                        <span>{m.verb}</span>
                      </span>
                    )}
	                  <div className="mood-lcard-body">
	                    <div className="mood-lcard-top">
	                      <span className="mood-lcard-verb" style={{ color: m.accent }}>{m.verb}</span>
	                      <span className="mood-lcard-label">{m.label}</span>
	                    </div>
	                    <p className="mood-lcard-desc">{m.desc}</p>
	                  </div>
	                </Link>
              ))}
            </div>

            <button
              type="button"
              className="mood-carousel-arrow mood-carousel-arrow--next"
              onClick={() => scrollMoods(1)}
              disabled={moodScrollState.atEnd}
              aria-label="Next moods"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </section>

      <PublishAutomationSection />

      {/* ── Quote ── */}
      <section className="section quote-section">
        <div className="quote-section-dots" aria-hidden="true" />
        <div className="container quote-container">
          <QuoteRotator quotes={quotes} />
        </div>
      </section>

      <EndPageCta
        title="Ready to publish independently?"
        subtitle="Create your free account and begin when you are ready."
        actionLabel="Create your free account"
        to="/signup"
        onAction={() => trackEvent('Create Account Click', { location: 'landing-bottom-cta' })}
      />

      <div className={`landing-assistant${assistantOpen ? ' landing-assistant--open' : ''}${assistantCollapsed ? ' landing-assistant--collapsed' : ''}`}>
        {assistantOpen && (
          <aside
            ref={assistantPanelRef}
            className="landing-assistant-panel landing-assistant-panel--chat"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-assistant-dialog-title"
          >
            <div
              className="landing-assistant-brand-row"
              onTouchStart={startAssistantDrag}
              onTouchEnd={endAssistantDrag}
              onClick={expandCollapsedAssistant}
            >
              <div className="landing-assistant-brand">
                <span className="landing-assistant-logo" aria-hidden="true">.in</span>
                <span id="landing-assistant-dialog-title">indie<strong>converters</strong></span>
              </div>
              <div className="landing-assistant-window-actions">
                <button type="button" onClick={resetAssistantChat} aria-label="Start a new chat" title="New chat">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="landing-assistant-close"
                  onClick={closeAssistant}
                  aria-label="Close assistant"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m7 7 10 10" />
                    <path d="M17 7 7 17" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={`landing-assistant-chat${handoffCollecting ? ' landing-assistant-chat--handoff' : ''}`}>
              <div className="landing-assistant-messages" ref={assistantMessagesRef} aria-live="polite">
                {assistantMessages.map(message => {
                  const hasActiveOffer = message.kind === 'human-offer' && message.id === activeHumanOfferId;
                  const hasActiveReview = message.kind === 'handoff-review'
                    && message.id === lastAssistantMessageId
                    && handoffStep === 'review';
                  const hasActiveError = message.kind === 'handoff-error'
                    && message.id === lastAssistantMessageId
                    && handoffStep === 'error';
                  const hasActions = hasActiveOffer || hasActiveReview || hasActiveError;
                  const messageClassName = [
                    'landing-assistant-message',
                    `landing-assistant-message--${message.role}`,
                    hasActions ? 'landing-assistant-message--with-actions' : '',
                    message.kind === 'handoff-success' ? 'landing-assistant-message--success' : '',
                    message.kind === 'handoff-error' ? 'landing-assistant-message--error' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <div key={message.id} className={messageClassName}>
                      {message.kind === 'handoff-error' ? (
                        <div className="landing-assistant-inline-warning" role="alert">
                          <span className="landing-assistant-inline-warning-icon" aria-hidden="true">!</span>
                          <div className="landing-assistant-inline-warning-copy">
                            <p>{message.text}</p>
                            {hasActiveError && (
                              <div className="landing-assistant-inline-warning-actions" aria-label="Support request error options">
                                <button type="button" onClick={() => submitHumanHandoff()}>
                                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /></svg>
                                  Retry
                                </button>
                                <button type="button" onClick={cancelHumanHandoff}>Return to chat</button>
                                <a href="mailto:info@indieconverters.uk">Email support</a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p>{message.text}</p>
                      )}
                      {message.actions?.length > 0 && (
                        <div className="landing-assistant-message-actions" aria-label="Suggested next steps">
                          {message.actions.map(action => (
                            action.type === 'navigate' ? (
                              <Link key={`${action.type}-${action.value}`} to={action.value} className="landing-assistant-action-link">
                                {action.label} <span aria-hidden="true">→</span>
                              </Link>
                            ) : (
                              <button key={`${action.type}-${action.value}`} type="button" onClick={() => sendAssistantMessage(action.value)}>
                                {action.label}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                      {message.kind === 'human-offer' && (
                        <small className="landing-assistant-message-support">Our team will follow up by email.</small>
                      )}
                      {hasActiveOffer && (
                        <div className="landing-assistant-message-actions" aria-label="Human support options">
                          <button type="button" className="landing-assistant-action--primary" onClick={beginHumanHandoff}>Yes, please</button>
                          <button type="button" onClick={dismissHumanOffer}>No, keep chatting</button>
                        </div>
                      )}
                      {hasActiveReview && (
                        <div className="landing-assistant-message-actions" aria-label="Review support request">
                          <button type="button" className="landing-assistant-action--primary" onClick={() => submitHumanHandoff()}>Send this request</button>
                          <button type="button" onClick={addHandoffNote}>Add a note</button>
                        </div>
                      )}
                      {message.books?.length > 0 && (
                        <div className="landing-assistant-books">
                          {message.books.map(book => (
                            <Link key={book.slug} to={`/book/${book.slug}`} className="landing-assistant-book">
                              {book.coverUrl ? (
                                <img src={book.coverUrl} alt="" />
                              ) : (
                                <span className="landing-assistant-book-cover" aria-hidden="true">.in</span>
                              )}
                              <span className="landing-assistant-book-copy">
                                <strong>{book.title}</strong>
                                <small>{book.author}</small>
                                {(book.genreLabel || book.genre || book.formatLabel || book.priceLabel) && (
                                  <span className="landing-assistant-book-meta">
                                    {[book.genreLabel || book.genre, book.formatLabel, book.priceLabel].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(assistantPending || handoffPending) && (
                  <div className="landing-assistant-message landing-assistant-message--assistant landing-assistant-message--typing" aria-label="Indie is typing">
                    <span></span><span></span><span></span>
                  </div>
                )}
              </div>

              {handoffStep === 'idle' && assistantMessages.length === 1 && !assistantPending && !activeHumanOfferId && (
                <div className="landing-assistant-prompts" aria-label="Suggested questions">
                  {ASSISTANT_PROMPTS.map(prompt => (
                    <button key={prompt} type="button" onClick={() => sendAssistantMessage(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {['name', 'email', 'details'].includes(handoffStep) && (
                <div className="landing-assistant-handoff-controls">
                  {handoffStep === 'name' && <button type="button" onClick={() => handleHandoffAnswer('skip')}>Skip name</button>}
                  <button type="button" onClick={cancelHumanHandoff}>Cancel request</button>
                </div>
              )}

              {!['review', 'error'].includes(handoffStep) && (
                <form className="landing-assistant-form" onSubmit={handleAssistantSubmit}>
                  <input
                    ref={assistantInputRef}
                    type={handoffStep === 'email' ? 'email' : 'text'}
                    autoComplete={handoffStep === 'name' ? 'name' : handoffStep === 'email' ? 'email' : 'off'}
                    maxLength={handoffStep === 'name' ? 100 : handoffStep === 'email' ? 254 : handoffStep === 'details' ? 1000 : 600}
                    value={assistantInput}
                    onChange={event => setAssistantInput(event.target.value)}
                    placeholder={handoffComposerPlaceholder(handoffStep)}
                    aria-label={handoffStep === 'idle' ? 'Ask Indie Converters assistant' : handoffComposerPlaceholder(handoffStep)}
                    disabled={composerDisabled}
                  />
                  <button type="submit" disabled={!assistantInput.trim() || composerDisabled} aria-label="Send message">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h13" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                </form>
              )}
              <p className="landing-assistant-chat-consent">
                By sending a message, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </div>
          </aside>
        )}

        <button
          ref={assistantToggleRef}
          type="button"
          className="landing-assistant-toggle"
          aria-label={assistantOpen ? 'Close assistant' : 'Open assistant'}
          aria-expanded={assistantOpen}
          onClick={toggleAssistant}
        >
          {assistantOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5.5 18.5c-1.1-1.2-1.8-2.8-1.8-4.5 0-4 3.7-7.2 8.3-7.2s8.3 3.2 8.3 7.2-3.7 7.2-8.3 7.2c-1 0-2-.2-2.9-.5L5 21l.5-2.5Z" />
              <path d="M8.5 13.5h7" />
              <path d="M8.5 10.5h5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
