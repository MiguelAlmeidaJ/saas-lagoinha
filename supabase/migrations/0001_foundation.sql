-- Fase 1: isolamento por igreja, perfis, pessoas, ministérios e auditoria.
create extension if not exists pgcrypto;

create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create type public.church_role as enum ('admin','pastor','financeiro','coordenador','lider_gc','voluntario','membro');
create table public.church_memberships (
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.church_role not null default 'membro',
  created_at timestamptz not null default now(),
  primary key(church_id,user_id)
);
create table public.people (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  email text,
  phone text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique(church_id,id)
);
create index people_church_name_idx on public.people(church_id,full_name);
create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 2 and 100),
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique(church_id,name)
);
create table public.audit_log (
  id bigint generated always as identity primary key,
  church_id uuid,
  table_name text not null,
  row_id uuid,
  operation text not null,
  actor_id uuid,
  occurred_at timestamptz not null default now()
);

-- Security definer evita recursão de RLS na tabela de vínculos.
create or replace function public.has_church_role(target_church uuid, allowed public.church_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(
  select 1 from public.church_memberships cm
  where cm.church_id = target_church and cm.user_id = (select auth.uid()) and cm.role = any(allowed)
) $$;
revoke all on function public.has_church_role(uuid,public.church_role[]) from public, anon;
grant execute on function public.has_church_role(uuid,public.church_role[]) to authenticated;

create or replace function public.is_church_member(target_church uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.church_memberships cm
  where cm.church_id=target_church and cm.user_id=(select auth.uid())) $$;
revoke all on function public.is_church_member(uuid) from public, anon;
grant execute on function public.is_church_member(uuid) to authenticated;

alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.church_memberships enable row level security;
alter table public.people enable row level security;
alter table public.ministries enable row level security;
alter table public.audit_log enable row level security;

create policy churches_read on public.churches for select to authenticated
 using (public.is_church_member(id));
create policy profiles_self_read on public.profiles for select to authenticated
 using (id=(select auth.uid()));
create policy memberships_read on public.church_memberships for select to authenticated
 using (user_id=(select auth.uid()) or public.has_church_role(church_id,array['admin','pastor']::public.church_role[]));
create policy people_read on public.people for select to authenticated
 using(public.is_church_member(church_id));
create policy people_insert on public.people for insert to authenticated
 with check(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]));
create policy people_update on public.people for update to authenticated
 using(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]))
 with check(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]));
create policy ministries_read on public.ministries for select to authenticated
 using(public.is_church_member(church_id));
create policy ministries_insert on public.ministries for insert to authenticated
 with check(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]));
create policy ministries_update on public.ministries for update to authenticated
 using(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]))
 with check(public.has_church_role(church_id,array['admin','pastor']::public.church_role[]));
-- Audit log is append-only via trigger, not readable by application users in phase 1.
create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.audit_log(church_id,table_name,row_id,operation,actor_id)
 values (coalesce(new.church_id,old.church_id),TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,(select auth.uid()));
 return coalesce(new,old);
end;
$$;
create trigger people_audit after insert or update or delete on public.people
 for each row execute function public.write_audit_log();
create trigger ministries_audit after insert or update or delete on public.ministries
 for each row execute function public.write_audit_log();

insert into public.churches(name,slug) values ('Lagoinha Além Paraíba','lagoinha-alem-paraiba')
on conflict(slug) do nothing;
