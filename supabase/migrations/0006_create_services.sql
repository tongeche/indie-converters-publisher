-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  icon_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5.0),
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- Add comments
COMMENT ON TABLE services IS 'Publishing service packages and bundles';
COMMENT ON COLUMN services.name IS 'Service package name';
COMMENT ON COLUMN services.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN services.short_description IS 'Brief description for cards';
COMMENT ON COLUMN services.description IS 'Full description with details';
COMMENT ON COLUMN services.icon_url IS 'Service icon/image URL';
COMMENT ON COLUMN services.price IS 'Current price';
COMMENT ON COLUMN services.original_price IS 'Original price (for discount display)';
COMMENT ON COLUMN services.rating IS 'Average rating 0.0 to 5.0';
COMMENT ON COLUMN services.review_count IS 'Number of reviews';
COMMENT ON COLUMN services.is_active IS 'Whether service is currently available';
COMMENT ON COLUMN services.display_order IS 'Order for display (lower numbers first)';
COMMENT ON COLUMN services.features IS 'JSON array of feature descriptions';

-- Insert sample services
INSERT INTO services (name, slug, short_description, description, price, original_price, rating, review_count, display_order, features)
VALUES 
(
  'Complete Publishing Package',
  'complete-publishing-package',
  'All-in-one solution: cover design, editing, formatting, ISBN, and global distribution',
  'Our most comprehensive package includes everything you need to publish professionally. From manuscript to market, we handle cover design, professional editing, interior formatting, ISBN registration, eBook conversion, and distribution to all major retailers worldwide.',
  899.00,
  1299.00,
  4.8,
  24,
  1,
  '["Professional cover design", "Developmental editing", "Copy editing & proofreading", "Interior formatting (print & eBook)", "ISBN registration", "EPUB & MOBI conversion", "Global distribution", "Marketing materials kit", "Author website setup", "3 rounds of revisions", "Dedicated project manager", "Priority support"]'::jsonb
),
(
  'Cover Design & Branding Bundle',
  'cover-design-branding',
  'Custom cover design, author branding, and promotional graphics for social media',
  'Stand out with professional design that captures your story. Includes custom book cover for print and eBook, author logo, social media graphics, bookmarks, and promotional materials. Unlimited revisions until you love it.',
  349.00,
  499.00,
  4.9,
  45,
  2,
  '["Custom cover design", "eBook & print versions", "Author branding package", "Social media templates", "Promotional graphics", "Bookmark design", "Business card design", "Unlimited revisions", "Print-ready files", "5-day turnaround"]'::jsonb
),
(
  'Editorial Services Package',
  'editorial-services',
  'Professional editing: developmental, copy editing, and proofreading services',
  'Comprehensive editorial support to polish your manuscript. Our experienced editors provide developmental feedback, line editing, copy editing, and final proofreading to ensure your book is publication-ready.',
  499.00,
  NULL,
  4.7,
  31,
  3,
  '["Developmental editing", "Manuscript assessment", "Copy editing", "Line editing", "Proofreading", "Style guide adherence", "Fact-checking", "Two rounds of revisions", "Editorial report", "Track changes document", "10-15 day turnaround"]'::jsonb
),
(
  'Print-on-Demand Setup',
  'print-on-demand',
  'Professional print formatting, ISBN, and setup with major POD platforms',
  'Get your book in print without inventory costs. Includes interior formatting for paperback and hardcover, ISBN assignment, barcode creation, and complete setup with Amazon KDP, IngramSpark, and other POD platforms.',
  279.00,
  399.00,
  4.6,
  18,
  4,
  '["Interior formatting (paperback)", "Hardcover formatting", "ISBN & barcode", "KDP print setup", "IngramSpark setup", "Print file optimization", "Bleed & trim setup", "Cover spine calculation", "Proof review", "Distribution to bookstores"]'::jsonb
),
(
  'eBook Conversion & Distribution',
  'ebook-conversion',
  'EPUB & MOBI formatting with distribution to Amazon, Apple Books, Kobo, and more',
  'Reach digital readers worldwide. Professional EPUB and MOBI conversion with interactive table of contents, proper formatting, and distribution to Amazon Kindle, Apple Books, Kobo, Google Play, and 40+ retailers.',
  199.00,
  NULL,
  4.8,
  52,
  5,
  '["EPUB 3.0 conversion", "Kindle (MOBI) format", "Interactive TOC", "Image optimization", "Metadata setup", "Amazon KDP distribution", "Apple Books distribution", "Kobo distribution", "Google Play Books", "Multi-device testing", "DRM options"]'::jsonb
),
(
  'Marketing & Launch Package',
  'marketing-launch',
  'Book launch strategy, press releases, promotional materials, and marketing consultation',
  'Launch your book with impact. Includes pre-launch strategy consultation, press release writing and distribution, Amazon optimization, social media campaign templates, email marketing templates, and 3 months of promotional support.',
  449.00,
  649.00,
  4.5,
  12,
  6,
  '["Launch strategy consultation", "Press release writing", "Media kit creation", "Amazon optimization", "Social media campaign", "Email marketing templates", "Book trailer script", "Reviewer outreach list", "Launch timeline", "Analytics setup", "3 months support"]'::jsonb
),
(
  'Author Website Builder',
  'author-website',
  'Professional author website with blog, book showcase, and email signup integration',
  'Establish your online presence with a custom author website. Includes responsive design, book showcase pages, blog setup, contact forms, email list integration, and SEO optimization.',
  399.00,
  NULL,
  NULL,
  0,
  7,
  '["Custom website design", "Responsive layout", "Book showcase pages", "Blog integration", "Contact form", "Email signup", "Social media links", "SEO optimization", "Domain setup assistance", "1 year hosting included", "Content management training"]'::jsonb
),
(
  'Manuscript Analysis & Consultation',
  'manuscript-analysis',
  'Detailed manuscript evaluation with developmental feedback and publishing roadmap',
  'Get expert feedback before investing in full editing. Comprehensive manuscript analysis includes plot/structure evaluation, character development review, pacing assessment, market positioning advice, and personalized publishing recommendations.',
  149.00,
  NULL,
  4.9,
  28,
  8,
  '["Manuscript evaluation", "Plot & structure analysis", "Character development review", "Pacing assessment", "Genre positioning", "Market analysis", "Competitive comparison", "Publishing recommendations", "Detailed written report", "30-minute consultation call", "7-day turnaround"]'::jsonb
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for services table
CREATE TRIGGER trigger_update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();
