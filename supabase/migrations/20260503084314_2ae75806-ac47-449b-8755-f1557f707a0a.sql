create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active = true
  )
);

drop policy if exists "Admins manage product_images" on public.product_images;
create policy "Admins manage product_images"
on public.product_images for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.product_images_enforce_single_primary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_primary then
    update public.product_images
      set is_primary = false
      where product_id = NEW.product_id and id <> NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_product_images_single_primary on public.product_images;
create trigger trg_product_images_single_primary
after insert or update of is_primary on public.product_images
for each row when (NEW.is_primary)
execute function public.product_images_enforce_single_primary();