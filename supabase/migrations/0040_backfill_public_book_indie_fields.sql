-- Promote private indie/traditional audit classifications into public book fields.
-- Books without a private audit row are marked uncertain so catalogue filters have
-- an explicit review state instead of a silent null.

update public.books as b
set
  indie_status = case
    when c.classification in ('self_published', 'small_press', 'likely_traditional', 'uncertain')
      then c.classification
    else 'uncertain'
  end,
  indie_confidence = case
    when c.classification in ('self_published', 'small_press', 'likely_traditional', 'uncertain')
      then c.confidence
    else 0
  end,
  indie_verified_at = coalesce(c.updated_at, now()),
  indie_source_summary = c.reason,
  indie_evidence_urls = coalesce(c.evidence_urls, '{}'::text[]),
  updated_at = now()
from app_private.book_indie_classification_candidates as c
where c.book_id = b.id;

update public.books as b
set
  indie_status = 'uncertain',
  indie_confidence = 0,
  indie_verified_at = null,
  indie_source_summary = 'No private indie classification audit row was found; marked uncertain pending review.',
  indie_evidence_urls = '{}'::text[],
  updated_at = now()
where b.indie_status is null;
