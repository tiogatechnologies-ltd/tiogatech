-- Master Price List column P, verified 27 October 2026.
-- Exact model matches only. Historical orders and crossed-out prices are unchanged.
begin;
update public.products set price = '₦1,398,800', updated_at = now()
where id = '11111111-1111-1111-1111-111111111003'
  and name = 'Felicity Solar 5kWh LiFePO4 Lithium Battery (FL-LPBF48100)';
update public.products set price = '₦2,226,900', updated_at = now()
where id = '11111111-1111-1111-1111-111111111004'
  and name = 'Felicity Solar 10kWh LiFePO4 Lithium Battery Wall-Mount (FL-LPBF48200)';
commit;
-- Persist the same three confirmed prices in configured promotional banners.
update public.landing_content
set content = jsonb_set(content, '{slides}', (
  select jsonb_agg(case slide->>'id'
    when 'srne-20kw-commercial' then jsonb_set(slide - 'promo_price_ngn', '{price_ngn}', '3517800'::jsonb)
    when 'd3bb2b96-ed2f-4dd3-9c59-8130dab9cd35' then jsonb_set(slide - 'promo_price_ngn', '{price_ngn}', '1144000'::jsonb)
    when 'afd8dd9c-3bd2-4e6a-bc2d-3fc64e87571b' then jsonb_set(slide - 'promo_price_ngn', '{price_ngn}', '1136100'::jsonb)
    else slide end order by position)
  from jsonb_array_elements(content->'slides') with ordinality as entry(slide,position)
))
where section_key = 'retail_hero' and jsonb_typeof(content->'slides') = 'array';
select id, name, price from public.products
where id in ('11111111-1111-1111-1111-111111111003','11111111-1111-1111-1111-111111111004');
