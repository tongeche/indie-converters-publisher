-- Baseline commerce lookup rows for the hybrid direct-sales schema.
-- Rates are defaults only; sales still capture distributor_cut_percentage per sale,
-- and payment_methods can be edited as provider fees change.

insert into public.distributors (name, default_commission_rate, notification_email_format)
values
  ('Indie Converters Shop', 0.10000, 'indie_converters_shop_v1'),
  ('Draft2Digital', 0.10000, 'draft2digital_email_v1'),
  ('Amazon', 0.30000, 'amazon_kdp_report_v1'),
  ('Apple Books', 0.30000, 'apple_books_report_v1'),
  ('Kobo', 0.30000, 'kobo_report_v1'),
  ('Google Play Books', 0.30000, 'google_play_books_report_v1')
on conflict (name) do update
set default_commission_rate = excluded.default_commission_rate,
    notification_email_format = excluded.notification_email_format;

insert into public.payment_methods (name, fee_type, flat_fee_amount, percentage_fee)
values
  ('Stripe', 'hybrid', 0.30, 0.02900),
  ('PayPal', 'hybrid', 0.49, 0.03490),
  ('Bank Transfer', 'flat', 0.00, 0.00000),
  ('Wise', 'hybrid', 0.50, 0.00600)
on conflict (name) do update
set fee_type = excluded.fee_type,
    flat_fee_amount = excluded.flat_fee_amount,
    percentage_fee = excluded.percentage_fee;

comment on table public.distributors is 'Sales/reporting channels used to identify distributor cuts and parse incoming sale notifications. Seeded defaults are editable.';
comment on table public.payment_methods is 'Available author payout methods and their fee formulas. Seeded defaults should be reviewed against current provider fees before launch.';
