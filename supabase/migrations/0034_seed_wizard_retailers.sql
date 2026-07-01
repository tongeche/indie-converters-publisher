-- Seed retailer slugs used by the Upload Wizard pricing step
INSERT INTO public.retailers (slug, label) VALUES
  ('own',     'Own Website'),
  ('gumroad', 'Gumroad'),
  ('payhip',  'Payhip'),
  ('other',   'Other')
ON CONFLICT (slug) DO NOTHING;
