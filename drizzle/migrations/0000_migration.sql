
create type public.app_role as enum ('admin','user');
create type public.job_status as enum ('queued','processing','completed','failed','refunded');
create type public.payment_status as enum ('created','paid','failed');
create type public.ledger_kind as enum ('signup_bonus','purchase','reserve','refund','admin_adjust');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, avatar_url text, email text,
  preferred_script text not null default 'telugu',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- wallets (writes only via security definer functions)
create table public.credit_wallets (
  user_id uuid primary key,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.credit_wallets to authenticated;
grant all on public.credit_wallets to service_role;
alter table public.credit_wallets enable row level security;
create policy "own wallet" on public.credit_wallets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger wallets_touch before update on public.credit_wallets for each row execute function public.touch_updated_at();

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind ledger_kind not null,
  amount integer not null,
  balance_after integer not null,
  reference text,
  note text,
  created_at timestamptz not null default now(),
  unique (kind, reference)
);
create index on public.credit_ledger(user_id, created_at desc);
grant select on public.credit_ledger to authenticated;
grant all on public.credit_ledger to service_role;
alter table public.credit_ledger enable row level security;
create policy "own ledger" on public.credit_ledger for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- core credit mutation: idempotent on (kind, reference)
create or replace function public.apply_credit(_user_id uuid, _kind ledger_kind, _amount integer, _reference text, _note text default null)
returns integer language plpgsql security definer set search_path=public as $$
declare new_bal integer;
begin
  if _reference is not null and exists(select 1 from credit_ledger where kind=_kind and reference=_reference) then
    select balance into new_bal from credit_wallets where user_id=_user_id; return new_bal;
  end if;
  insert into credit_wallets(user_id, balance) values (_user_id, 0) on conflict do nothing;
  update credit_wallets set balance = balance + _amount where user_id=_user_id returning balance into new_bal;
  if new_bal < 0 then raise exception 'INSUFFICIENT_CREDITS'; end if;
  insert into credit_ledger(user_id, kind, amount, balance_after, reference, note) values (_user_id,_kind,_amount,new_bal,_reference,_note);
  return new_bal;
end $$;
revoke all on function public.apply_credit(uuid, ledger_kind, integer, text, text) from public, anon, authenticated;
grant execute on function public.apply_credit(uuid, ledger_kind, integer, text, text) to service_role;

-- packages
create table public.credit_packages (
  id text primary key, name text not null, credits integer not null, price_inr integer not null,
  tagline text, highlighted boolean not null default false, active boolean not null default true, sort integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.credit_packages to anon, authenticated;
grant all on public.credit_packages to service_role;
alter table public.credit_packages enable row level security;
create policy "public packages" on public.credit_packages for select to anon, authenticated using (active);
insert into public.credit_packages(id,name,credits,price_inr,tagline,highlighted,sort) values
 ('starter','Starter',30,199,'For trying things out',false,1),
 ('creator','Creator',120,599,'For weekly creators',true,2),
 ('pro','Pro',400,1499,'For daily publishers',false,3);

-- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, package_id text not null references public.credit_packages(id),
  razorpay_order_id text unique not null, razorpay_payment_id text unique,
  amount_inr integer not null, credits integer not null,
  status payment_status not null default 'created',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "own payments" on public.payments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, title text not null,
  storage_path text, duration_seconds numeric, language text not null default 'te',
  style_preset text not null default 'bold-pop',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.projects(user_id, created_at desc);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "own projects select" on public.projects for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own projects insert" on public.projects for insert to authenticated with check (user_id = auth.uid());
create policy "own projects update" on public.projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own projects delete" on public.projects for delete to authenticated using (user_id = auth.uid());
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();

create table public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null, provider text not null default 'lovable-ai',
  status job_status not null default 'queued', credits_reserved integer not null default 0,
  error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.transcription_jobs to authenticated;
grant all on public.transcription_jobs to service_role;
alter table public.transcription_jobs enable row level security;
create policy "own jobs" on public.transcription_jobs for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger jobs_touch before update on public.transcription_jobs for each row execute function public.touch_updated_at();

create table public.transcripts (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id uuid not null,
  language text not null default 'te',
  segments jsonb not null default '[]'::jsonb,
  romanized_segments jsonb,
  timing_source text not null default 'provider',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, update on public.transcripts to authenticated;
grant all on public.transcripts to service_role;
alter table public.transcripts enable row level security;
create policy "own transcripts select" on public.transcripts for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own transcripts update" on public.transcripts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger transcripts_touch before update on public.transcripts for each row execute function public.touch_updated_at();

-- new user: profile, role, wallet + 10 free credits
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id, email, display_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into user_roles(user_id, role) values (new.id, 'user');
  perform apply_credit(new.id, 'signup_bonus', 10, new.id::text, 'Welcome credits');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
