-- blogs table
-- Covers Blogs & News content from the editorial sheet (BN-xxx IDs)

CREATE TABLE blogs (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id        text        UNIQUE,                        -- BN-001, BN-002 …
  type              text        NOT NULL DEFAULT 'blog'
                    CHECK (type IN ('blog', 'news')),
  status            text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('idea', 'draft', 'ready', 'published')),
  published_at      timestamptz,                               -- set when status → published

  -- Content
  title             text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  pillar            text,                                      -- content pillar / category
  audience          text,
  excerpt           text,                                      -- public teaser shown on cards
  body              text,                                      -- full markdown body
  hero_image_url    text,

  -- SEO
  primary_keyword   text,
  secondary_keywords text[]     DEFAULT '{}',
  meta_title        text,
  meta_description  text,
  internal_links    text[]      DEFAULT '{}',

  -- Editorial / production (not public-facing)
  intro_hook        text,
  key_sections      text,
  cta               text,
  related_tool      text,
  social_asset_idea text,
  source_reference  text,
  hero_image_brief  text,
  notes             text,
  revision_notes    text,

  -- Metrics
  view_count        integer     NOT NULL DEFAULT 0,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Increment view count (fire-and-forget from client)
CREATE OR REPLACE FUNCTION increment_blog_view(blog_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE blogs SET view_count = view_count + 1
  WHERE slug = blog_slug AND status = 'published';
END;
$$;

-- RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "public_read_published_blogs" ON blogs
  FOR SELECT USING (status = 'published');

-- Authenticated users (admins) can do everything
CREATE POLICY "auth_manage_blogs" ON blogs
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Index for listing and lookup
CREATE INDEX ON blogs (status, published_at DESC);
CREATE INDEX ON blogs (slug);
CREATE INDEX ON blogs (type, status);
