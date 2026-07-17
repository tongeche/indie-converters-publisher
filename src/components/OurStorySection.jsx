import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import allAuthorsImg from '../assets/all-authors.webp';
import hireFreelancerImg from '../assets/hire-freelancer.webp';
import deskPhotosImg from '../assets/desk-photos.webp';
import authorHeroImg from '../assets/author-hero.webp';
import './OurStorySection.css';

const STORY_SLIDES = [
  {
    id: 'challenge',
    eyebrow: 'The challenge',
    text: 'Traditional publishing decides whose stories get told — an agent, months of waiting, and most manuscripts rejected before a reader ever sees them.',
    image: hireFreelancerImg,
  },
  {
    id: 'format',
    eyebrow: 'Format & design',
    text: 'Turn your manuscript into a print-ready interior and a cover that looks professional — no design software required.',
    image: deskPhotosImg,
  },
  {
    id: 'reach',
    eyebrow: 'Reach readers',
    text: 'Publish to eBook and print, and get discovered in a real, browsable catalogue.',
    image: allAuthorsImg,
  },
  {
    id: 'solution',
    eyebrow: 'The solution',
    text: "Upload your manuscript, prepare it for print and eBook, and publish in a few clicks. You keep ownership, make the final decisions, and share your story when you're ready.",
    image: authorHeroImg,
    cta: { to: '/upload', label: 'Start your book upload' },
  },
];

export default function OurStorySection() {
  const [active, setActive] = useState(0);
  const count = STORY_SLIDES.length;
  const goPrev = () => setActive(i => (i - 1 + count) % count);
  const goNext = () => setActive(i => (i + 1) % count);
  const current = STORY_SLIDES[active];
  // The active slide always renders first — otherwise switching slides just
  // widens whichever slot you clicked in place, and the previously-active
  // image is left sitting wide wherever it happened to be instead of
  // collapsing away like Stripe's version does.
  const orderedSlides = STORY_SLIDES.map((slide, i) => ({ ...slide, originalIndex: i }))
    .slice(active)
    .concat(STORY_SLIDES.map((slide, i) => ({ ...slide, originalIndex: i })).slice(0, active));

  // Re-ordering the slides snaps them into their new slot instantly (browsers
  // don't animate flex order/position changes), which is what read as "not
  // smooth" — this is a manual FLIP: measure each slide's position before the
  // reorder, then after React re-renders, offset it right back with a
  // transform and let it transition to zero, so it visually slides into
  // place instead of teleporting.
  const slideRefs = useRef({});
  const prevRects = useRef({});
  useLayoutEffect(() => {
    const nextRects = {};
    Object.entries(slideRefs.current).forEach(([id, el]) => {
      if (el) nextRects[id] = el.getBoundingClientRect();
    });
    Object.entries(nextRects).forEach(([id, rect]) => {
      const el = slideRefs.current[id];
      const prev = prevRects.current[id];
      if (!el || !prev) return;
      const dx = prev.left - rect.left;
      if (!dx) return;
      el.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 480ms cubic-bezier(.4,0,.2,1), flex-grow 480ms cubic-bezier(.4,0,.2,1)';
        el.style.transform = '';
      });
    });
    prevRects.current = nextRects;
  }, [active]);

  return (
    <section className="story-section" aria-labelledby="story-heading">
      <div className="container">
        <div className="story-head">
          <div>
            <h2 id="story-heading">Every story deserves a chance to be told.</h2>
            <p className="story-intro">
              We're a free, open publishing platform that turns your manuscript into a real,
              published book — no agent, no rights deal, no permission needed.
            </p>
          </div>
          <div className="story-arrows">
            <button type="button" onClick={goPrev} aria-label="Previous slide">←</button>
            <button type="button" onClick={goNext} aria-label="Next slide">→</button>
          </div>
        </div>

        <div className="story-accordion">
          {orderedSlides.map((slide, i) => (
            <button
              key={slide.id}
              ref={el => { slideRefs.current[slide.id] = el; }}
              type="button"
              className={`story-slide ${i === 0 ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
              onClick={() => setActive(slide.originalIndex)}
              aria-label={slide.eyebrow}
              aria-current={i === 0}
            />
          ))}
        </div>

        <div className="story-caption">
          <p><strong>{current.eyebrow}.</strong> {current.text}</p>
          {current.cta && (
            <Link to={current.cta.to} className="story-cta">
              {current.cta.label} <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
