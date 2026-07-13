-- create_sales_from_paid_order() runs in response to a buyer's own client
-- updating their own order to 'paid', but it needs to insert into
-- public.sales, which authenticated users have no INSERT policy for by
-- design (sales writes are meant to be service-role/trigger-only). Without
-- SECURITY DEFINER the insert runs as the calling user and RLS rejects it
-- with "new row violates row-level security policy for table sales".
alter function public.create_sales_from_paid_order() security definer;
