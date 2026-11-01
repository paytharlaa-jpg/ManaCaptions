-- =====================================================
-- ManaCaptions Complete Database Schema & Migrations
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false), ('rendered-videos', 'rendered-videos', false)
ON CONFLICT (id) DO NOTHING;

-- >>> Start 0000_migration.sql <<< --

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

-- >>> End 0000_migration.sql <<< --

-- >>> Start 0001_migration.sql <<< --

create policy "own video upload" on storage.objects for insert to authenticated with check (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own video read" on storage.objects for select to authenticated using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own video delete" on storage.objects for delete to authenticated using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- >>> End 0001_migration.sql <<< --

-- >>> Start 0002_caption_render_admin_foundations.sql <<< --
ALTER TABLE public.projects ADD COLUMN caption_style jsonb, ADD COLUMN source_deleted_at timestamptz, ADD COLUMN media_metadata jsonb;
CREATE TABLE public.account_controls (user_id uuid PRIMARY KEY, suspended boolean NOT NULL DEFAULT false, reason text, changed_by uuid, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.account_controls TO authenticated; GRANT ALL ON public.account_controls TO service_role;
ALTER TABLE public.account_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_account_control ON public.account_controls FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.app_owners (user_id uuid PRIMARY KEY REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_owners TO authenticated; GRANT ALL ON public.app_owners TO service_role;
ALTER TABLE public.app_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_owner_record ON public.app_owners FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.is_app_owner(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.app_owners WHERE user_id=_user_id) $$;
REVOKE ALL ON FUNCTION public.is_app_owner(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_app_owner(uuid) TO authenticated,service_role;
CREATE TABLE public.admin_audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, action text NOT NULL, target text, reason text, previous_value jsonb, new_value jsonb, reference text UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_audit_logs TO authenticated; GRANT SELECT,INSERT ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_audit_read ON public.admin_audit_logs FOR SELECT TO authenticated USING(public.is_app_owner(auth.uid()));
CREATE INDEX audit_created_idx ON public.admin_audit_logs(created_at DESC);
CREATE TABLE public.app_settings (key text PRIMARY KEY, value jsonb NOT NULL, version integer NOT NULL DEFAULT 1, updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_settings TO authenticated; GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_settings_read ON public.app_settings FOR SELECT TO authenticated USING(public.is_app_owner(auth.uid()));
CREATE TABLE public.rendering_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES public.projects(id), status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','completed','failed','cancelled','refunded')), provider text NOT NULL, provider_job_id text, idempotency_key uuid NOT NULL, requested_resolution text NOT NULL, render_configuration jsonb NOT NULL, credits_reserved integer NOT NULL DEFAULT 0 CHECK(credits_reserved>=0), output_storage_path text, error_code text, error_message text, progress_percentage integer CHECK(progress_percentage BETWEEN 0 AND 100), created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, completed_at timestamptz, output_expires_at timestamptz, output_deleted_at timestamptz, lease_expires_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,idempotency_key));
GRANT SELECT ON public.rendering_jobs TO authenticated; GRANT ALL ON public.rendering_jobs TO service_role;
ALTER TABLE public.rendering_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_render_read ON public.rendering_jobs FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
CREATE INDEX render_user_created_idx ON public.rendering_jobs(user_id,created_at DESC); CREATE INDEX render_status_idx ON public.rendering_jobs(status,lease_expires_at);
CREATE TABLE public.user_marketing_preferences (user_id uuid PRIMARY KEY, consent boolean NOT NULL DEFAULT false, consent_source text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.user_marketing_preferences TO authenticated; GRANT ALL ON public.user_marketing_preferences TO service_role;
ALTER TABLE public.user_marketing_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_marketing_read ON public.user_marketing_preferences FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY own_marketing_insert ON public.user_marketing_preferences FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY own_marketing_update ON public.user_marketing_preferences FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.email_suppressions (user_id uuid PRIMARY KEY, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.email_suppressions TO authenticated; GRANT ALL ON public.email_suppressions TO service_role;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_suppression_read ON public.email_suppressions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.email_campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject text NOT NULL, body text NOT NULL, plain_text text NOT NULL, audience text NOT NULL DEFAULT 'subscribers', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','queued','sending','completed','cancelled','failed')), created_by uuid NOT NULL, scheduled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.email_campaigns TO authenticated; GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_campaign_read ON public.email_campaigns FOR SELECT TO authenticated USING(public.is_app_owner(auth.uid()));
CREATE TABLE public.email_campaign_recipients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id), user_id uuid NOT NULL, status text NOT NULL DEFAULT 'queued', attempts integer NOT NULL DEFAULT 0, provider_message_id text, lease_expires_at timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(), error_code text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(campaign_id,user_id));
GRANT SELECT ON public.email_campaign_recipients TO authenticated; GRANT ALL ON public.email_campaign_recipients TO service_role;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_recipient_read ON public.email_campaign_recipients FOR SELECT TO authenticated USING(public.is_app_owner(auth.uid()));
CREATE TABLE public.announcements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL, audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('all','paid','free')), important boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), published_at timestamptz, expires_at timestamptz, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.announcements TO authenticated; GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_announcement_read ON public.announcements FOR SELECT TO authenticated USING(public.is_app_owner(auth.uid()));
CREATE POLICY audience_announcement_read ON public.announcements FOR SELECT TO authenticated USING(status='published' AND published_at<=now() AND (expires_at IS NULL OR expires_at>now()) AND (audience='all' OR (audience='paid' AND EXISTS(SELECT 1 FROM public.payments WHERE user_id=auth.uid() AND status='paid')) OR (audience='free' AND NOT EXISTS(SELECT 1 FROM public.payments WHERE user_id=auth.uid() AND status='paid'))));
CREATE TABLE public.announcement_dismissals (announcement_id uuid NOT NULL REFERENCES public.announcements(id), user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(announcement_id,user_id));
GRANT SELECT,INSERT ON public.announcement_dismissals TO authenticated; GRANT ALL ON public.announcement_dismissals TO service_role;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_dismissal_read ON public.announcement_dismissals FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY own_normal_dismissal ON public.announcement_dismissals FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.announcements WHERE id=announcement_id AND NOT important));
CREATE OR REPLACE FUNCTION public.apply_credit(_user_id uuid,_kind public.ledger_kind,_amount integer,_reference text,_note text DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_bal integer; prior public.credit_ledger;
BEGIN
 IF _user_id IS NULL OR _amount=0 OR _reference IS NULL OR length(_reference)=0 THEN RAISE EXCEPTION 'INVALID_CREDIT_INPUT'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_kind::text||':'||_reference,0));
 SELECT * INTO prior FROM public.credit_ledger WHERE kind=_kind AND reference=_reference;
 IF FOUND THEN
  IF prior.user_id<>_user_id OR prior.amount<>_amount THEN RAISE EXCEPTION 'CREDIT_REFERENCE_CONFLICT'; END IF;
  SELECT balance INTO new_bal FROM public.credit_wallets WHERE user_id=_user_id; RETURN new_bal;
 END IF;
 INSERT INTO public.credit_wallets(user_id,balance) VALUES(_user_id,0) ON CONFLICT DO NOTHING;
 SELECT balance INTO new_bal FROM public.credit_wallets WHERE user_id=_user_id FOR UPDATE;
 IF new_bal+_amount<0 THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
 UPDATE public.credit_wallets SET balance=balance+_amount WHERE user_id=_user_id RETURNING balance INTO new_bal;
 INSERT INTO public.credit_ledger(user_id,kind,amount,balance_after,reference,note) VALUES(_user_id,_kind,_amount,new_bal,_reference,_note);
 RETURN new_bal;
END $$;
REVOKE ALL ON FUNCTION public.apply_credit(uuid,public.ledger_kind,integer,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.apply_credit(uuid,public.ledger_kind,integer,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.owner_adjust_credit(_actor uuid,_user_id uuid,_amount integer,_reason text,_reference text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE balance integer;
BEGIN
 IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF abs(_amount)>10000 OR length(trim(_reason)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'INVALID_ADJUSTMENT'; END IF;
 balance:=public.apply_credit(_user_id,'admin_adjust',_amount,_reference,_reason);
 INSERT INTO public.admin_audit_logs(actor_id,action,target,reason,new_value,reference) VALUES(_actor,'credit_adjust',_user_id::text,_reason,jsonb_build_object('amount',_amount,'balance',balance),_reference) ON CONFLICT(reference) DO NOTHING;
 RETURN balance;
END $$;
REVOKE ALL ON FUNCTION public.owner_adjust_credit(uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_adjust_credit(uuid,uuid,integer,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.owner_refund_transcription(_actor uuid,_job_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.transcription_jobs;
BEGIN
 IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 SELECT * INTO j FROM public.transcription_jobs WHERE id=_job_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
 IF j.status='refunded' THEN RETURN true; END IF;
 IF j.status<>'failed' OR j.credits_reserved<=0 OR NOT EXISTS(SELECT 1 FROM public.credit_ledger WHERE user_id=j.user_id AND kind='reserve' AND reference=j.id::text AND amount=-j.credits_reserved) THEN RAISE EXCEPTION 'NOT_REFUNDABLE'; END IF;
 PERFORM public.apply_credit(j.user_id,'refund',j.credits_reserved,j.id::text,'Refund by owner');
 UPDATE public.transcription_jobs SET status='refunded' WHERE id=j.id;
 INSERT INTO public.admin_audit_logs(actor_id,action,target,reason,reference) VALUES(_actor,'transcription_refund',j.id::text,'Failed job refund','refund:'||j.id::text) ON CONFLICT(reference) DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.owner_refund_transcription(uuid,uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_refund_transcription(uuid,uuid) TO service_role;
-- >>> End 0002_caption_render_admin_foundations.sql <<< --

-- >>> Start 0003_owner_audited_operations.sql <<< --
CREATE OR REPLACE FUNCTION public.owner_set_account_status(_actor uuid,_user_id uuid,_suspended boolean,_reason text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE old_value jsonb; BEGIN IF NOT public.is_app_owner(_actor) OR _actor=_user_id OR public.is_app_owner(_user_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; IF length(trim(_reason)) NOT BETWEEN 1 AND 200 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user_id) THEN RAISE EXCEPTION 'INVALID_ACCOUNT'; END IF; PERFORM pg_advisory_xact_lock(hashtextextended('account:'||_user_id::text,0)); SELECT to_jsonb(a) INTO old_value FROM public.account_controls a WHERE user_id=_user_id; INSERT INTO public.account_controls(user_id,suspended,reason,changed_by) VALUES(_user_id,_suspended,_reason,_actor) ON CONFLICT(user_id) DO UPDATE SET suspended=_suspended,reason=_reason,changed_by=_actor,updated_at=now(); INSERT INTO public.admin_audit_logs(actor_id,action,target,reason,previous_value,new_value) VALUES(_actor,CASE WHEN _suspended THEN 'account_suspend' ELSE 'account_reactivate' END,_user_id::text,_reason,old_value,jsonb_build_object('suspended',_suspended)); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.owner_set_account_status(uuid,uuid,boolean,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_set_account_status(uuid,uuid,boolean,text) TO service_role;
CREATE OR REPLACE FUNCTION public.owner_save_settings(_actor uuid,_value jsonb,_version integer,_reason text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE old_value public.app_settings; BEGIN IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; IF length(trim(_reason)) NOT BETWEEN 1 AND 200 OR (_value->>'maxVideoSeconds')::integer NOT BETWEEN 1 AND 300 OR (_value->>'transcriptionCreditsPerMinute')::integer NOT BETWEEN 1 AND 100 OR _value->>'renderPricingApproved'<>'false' OR _value->>'renderingProvider'<>'unconfigured' OR _value->>'emailProvider'<>'unconfigured' OR _value->>'sourceRetentionHours'<>'72' OR _value->>'outputRetentionHours'<>'24' OR _value->>'freeResolution'<>'1080p' OR _value->>'paidResolution'<>'4k' THEN RAISE EXCEPTION 'INVALID_SETTINGS'; END IF; PERFORM pg_advisory_xact_lock(hashtextextended('settings:product',0)); SELECT * INTO old_value FROM public.app_settings WHERE key='product'; IF coalesce(old_value.version,0)<>_version THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF; INSERT INTO public.app_settings(key,value,version,updated_by) VALUES('product',_value,_version+1,_actor) ON CONFLICT(key) DO UPDATE SET value=_value,version=_version+1,updated_by=_actor,updated_at=now(); INSERT INTO public.admin_audit_logs(actor_id,action,target,reason,previous_value,new_value) VALUES(_actor,'settings_change','product',_reason,old_value.value,_value); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.owner_save_settings(uuid,jsonb,integer,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_save_settings(uuid,jsonb,integer,text) TO service_role;
CREATE OR REPLACE FUNCTION public.owner_save_announcement(_actor uuid,_id uuid,_value jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE prior jsonb; BEGIN IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; SELECT to_jsonb(a) INTO prior FROM public.announcements a WHERE id=_id; INSERT INTO public.announcements(id,title,body,audience,important,status,published_at,expires_at,created_by) VALUES(_id,_value->>'title',_value->>'body',_value->>'audience',(_value->>'important')::boolean,_value->>'status',(_value->>'published_at')::timestamptz,(_value->>'expires_at')::timestamptz,_actor) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,audience=excluded.audience,important=excluded.important,status=excluded.status,published_at=excluded.published_at,expires_at=excluded.expires_at,updated_at=now(); INSERT INTO public.admin_audit_logs(actor_id,action,target,previous_value,new_value) VALUES(_actor,'announcement_save',_id::text,prior,_value); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.owner_save_announcement(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_save_announcement(uuid,uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.owner_save_campaign(_actor uuid,_subject text,_body text,_audience text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE campaign_id uuid; BEGIN IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; IF length(trim(_subject)) NOT BETWEEN 1 AND 150 OR length(trim(_body)) NOT BETWEEN 1 AND 20000 OR _audience NOT IN ('subscribers','paid','free','recent','transcription','rendering') THEN RAISE EXCEPTION 'INVALID_CAMPAIGN'; END IF; INSERT INTO public.email_campaigns(subject,body,plain_text,audience,created_by) VALUES(_subject,_body,_body,_audience,_actor) RETURNING id INTO campaign_id; INSERT INTO public.admin_audit_logs(actor_id,action,target,new_value) VALUES(_actor,'campaign_draft',campaign_id::text,jsonb_build_object('subject',_subject,'audience',_audience)); RETURN campaign_id; END $$;
REVOKE ALL ON FUNCTION public.owner_save_campaign(uuid,text,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_save_campaign(uuid,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.account_is_active(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NOT EXISTS(SELECT 1 FROM public.account_controls WHERE user_id=_user_id AND suspended) $$;
REVOKE ALL ON FUNCTION public.account_is_active(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.account_is_active(uuid) TO authenticated,service_role;
CREATE POLICY active_projects ON public.projects AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_is_active(auth.uid())) WITH CHECK(public.account_is_active(auth.uid()));
CREATE POLICY active_transcripts ON public.transcripts AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_is_active(auth.uid())) WITH CHECK(public.account_is_active(auth.uid()));
CREATE POLICY active_profile ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_is_active(auth.uid())) WITH CHECK(public.account_is_active(auth.uid()));
REVOKE UPDATE ON public.profiles FROM authenticated; GRANT UPDATE(display_name,avatar_url,preferred_script) ON public.profiles TO authenticated;
ALTER POLICY "own profile read" ON public.profiles USING(id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own wallet" ON public.credit_wallets USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own ledger" ON public.credit_ledger USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own payments" ON public.payments USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own roles" ON public.user_roles USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own jobs" ON public.transcription_jobs USING(user_id=auth.uid() OR public.is_app_owner(auth.uid()));
ALTER POLICY "own projects select" ON public.projects USING(user_id=auth.uid());
ALTER POLICY "own transcripts select" ON public.transcripts USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.fulfill_verified_payment(_order_id text,_payment_id text) RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.payments; BEGIN SELECT * INTO p FROM public.payments WHERE razorpay_order_id=_order_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF; IF p.razorpay_payment_id IS NOT NULL AND p.razorpay_payment_id<>_payment_id THEN RAISE EXCEPTION 'PAYMENT_CONFLICT'; END IF; PERFORM public.apply_credit(p.user_id,'purchase',p.credits,_payment_id,'Purchased credits'); UPDATE public.payments SET status='paid',razorpay_payment_id=_payment_id WHERE id=p.id RETURNING * INTO p; RETURN p; END $$;
REVOKE ALL ON FUNCTION public.fulfill_verified_payment(text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.fulfill_verified_payment(text,text) TO service_role;
-- >>> End 0003_owner_audited_operations.sql <<< --

-- >>> Start 0004_render_reservations_and_retention.sql <<< --
ALTER TABLE public.projects ADD COLUMN source_cleanup_claimed_at timestamptz;
CREATE OR REPLACE FUNCTION public.reserve_render_job(_user_id uuid,_project_id uuid,_idempotency uuid,_resolution text,_configuration jsonb,_credits integer,_provider text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.projects; job_id uuid; setting jsonb; BEGIN IF NOT public.account_is_active(_user_id) THEN RAISE EXCEPTION 'SUSPENDED'; END IF; SELECT * INTO p FROM public.projects WHERE id=_project_id AND user_id=_user_id FOR UPDATE; IF NOT FOUND OR p.storage_path IS NULL OR p.source_deleted_at IS NOT NULL OR p.source_cleanup_claimed_at IS NOT NULL OR p.created_at+interval '3 days'<=now() THEN RAISE EXCEPTION 'SOURCE_UNAVAILABLE'; END IF; SELECT id INTO job_id FROM public.rendering_jobs WHERE user_id=_user_id AND idempotency_key=_idempotency; IF FOUND THEN RETURN job_id; END IF; SELECT value INTO setting FROM public.app_settings WHERE key='product'; IF setting IS NULL OR setting->>'renderPricingApproved'<>'true' OR _provider='unconfigured' OR _provider<>setting->>'renderingProvider' THEN RAISE EXCEPTION 'RENDER_NOT_CONFIGURED'; END IF; IF p.duration_seconds<=0 OR p.duration_seconds>300 OR _resolution NOT IN ('720p','1080p','4k') THEN RAISE EXCEPTION 'INVALID_RENDER'; END IF; IF _resolution='4k' AND NOT EXISTS(SELECT 1 FROM public.payments WHERE user_id=_user_id AND status='paid') THEN RAISE EXCEPTION 'RESOLUTION_LOCKED'; END IF; IF _credits<>ceil(p.duration_seconds/60)*((setting->'renderingCreditsPerMinute'->>_resolution)::integer) OR _credits<=0 THEN RAISE EXCEPTION 'INVALID_QUOTE'; END IF; INSERT INTO public.rendering_jobs(user_id,project_id,provider,idempotency_key,requested_resolution,render_configuration,credits_reserved) VALUES(_user_id,_project_id,_provider,_idempotency,_resolution,_configuration,_credits) RETURNING id INTO job_id; PERFORM public.apply_credit(_user_id,'reserve',-_credits,'render:'||job_id::text,'Rendering reservation'); RETURN job_id; END $$;
REVOKE ALL ON FUNCTION public.reserve_render_job(uuid,uuid,uuid,text,jsonb,integer,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.reserve_render_job(uuid,uuid,uuid,text,jsonb,integer,text) TO service_role;
CREATE OR REPLACE FUNCTION public.finish_render_job(_job_id uuid,_success boolean,_output_path text,_error_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE j public.rendering_jobs; BEGIN SELECT * INTO j FROM public.rendering_jobs WHERE id=_job_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF; IF j.status IN ('completed','refunded','cancelled') THEN RETURN true; END IF; IF _success THEN IF _output_path IS NULL OR _output_path NOT LIKE j.user_id::text||'/%' THEN RAISE EXCEPTION 'INVALID_OUTPUT'; END IF; UPDATE public.rendering_jobs SET status='completed',output_storage_path=_output_path,progress_percentage=100,completed_at=now(),output_expires_at=now()+interval '24 hours',updated_at=now() WHERE id=j.id; ELSE PERFORM public.apply_credit(j.user_id,'refund',j.credits_reserved,'render:'||j.id::text,'Rendering failed'); UPDATE public.rendering_jobs SET status='refunded',error_code=_error_code,completed_at=now(),updated_at=now() WHERE id=j.id; END IF; RETURN true; END $$;
REVOKE ALL ON FUNCTION public.finish_render_job(uuid,boolean,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.finish_render_job(uuid,boolean,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_expired_sources() RETURNS TABLE(project_id uuid,user_id uuid,storage_path text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN QUERY WITH candidates AS (SELECT p.id FROM public.projects p WHERE p.created_at<=now()-interval '3 days' AND p.source_deleted_at IS NULL AND p.storage_path IS NOT NULL AND (p.source_cleanup_claimed_at IS NULL OR p.source_cleanup_claimed_at<now()-interval '10 minutes') AND NOT EXISTS(SELECT 1 FROM public.rendering_jobs j WHERE j.project_id=p.id AND j.status IN ('queued','processing')) ORDER BY p.created_at LIMIT 20 FOR UPDATE SKIP LOCKED), claimed AS (UPDATE public.projects p SET source_cleanup_claimed_at=now() FROM candidates c WHERE p.id=c.id RETURNING p.id,p.user_id,p.storage_path) SELECT c.id,c.user_id,c.storage_path FROM claimed c; END $$;
REVOKE ALL ON FUNCTION public.claim_expired_sources() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.claim_expired_sources() TO service_role;
CREATE OR REPLACE FUNCTION public.set_marketing_consent(_user_id uuid,_consent boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.user_marketing_preferences(user_id,consent,consent_source) VALUES(_user_id,_consent,'account_settings') ON CONFLICT(user_id) DO UPDATE SET consent=_consent,consent_source='account_settings',updated_at=now(); IF NOT _consent THEN INSERT INTO public.email_suppressions(user_id,reason) VALUES(_user_id,'unsubscribe') ON CONFLICT(user_id) DO UPDATE SET reason='unsubscribe'; ELSE DELETE FROM public.email_suppressions WHERE user_id=_user_id AND reason='unsubscribe'; END IF; RETURN true; END $$;
REVOKE ALL ON FUNCTION public.set_marketing_consent(uuid,boolean) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.set_marketing_consent(uuid,boolean) TO service_role;
CREATE POLICY active_marketing ON public.user_marketing_preferences AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_is_active(auth.uid())) WITH CHECK(public.account_is_active(auth.uid()));
-- >>> End 0004_render_reservations_and_retention.sql <<< --

-- >>> Start 0005_private_media_retention_policies.sql <<< --
CREATE POLICY own_output_download ON storage.objects FOR SELECT TO authenticated USING(bucket_id='rendered-videos' AND (storage.foldername(name))[1]=auth.uid()::text AND public.account_is_active(auth.uid()) AND EXISTS(SELECT 1 FROM public.rendering_jobs j WHERE j.user_id=auth.uid() AND j.output_storage_path=name AND j.status='completed' AND j.output_expires_at>now() AND j.output_deleted_at IS NULL));
CREATE POLICY active_video_access ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated USING(bucket_id<>'videos' OR public.account_is_active(auth.uid())) WITH CHECK(bucket_id<>'videos' OR public.account_is_active(auth.uid()));
CREATE POLICY unexpired_source_access ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated USING(bucket_id<>'videos' OR NOT EXISTS(SELECT 1 FROM public.projects p WHERE p.storage_path=name AND p.user_id=auth.uid() AND (p.source_deleted_at IS NOT NULL OR (p.created_at+interval '3 days'<=now() AND NOT EXISTS(SELECT 1 FROM public.rendering_jobs j WHERE j.project_id=p.id AND j.status IN ('queued','processing'))))));
CREATE OR REPLACE FUNCTION public.project_caption_schema_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.caption_style IS NOT NULL THEN IF NEW.caption_style->>'presetId' NOT IN ('bold-pop','karaoke','minimal','boxed','neon','cinema','podcast-pro','social-creator','viral-punch') OR (NEW.caption_style->>'fontSize')::numeric NOT BETWEEN 12 AND 120 THEN RAISE EXCEPTION 'INVALID_CAPTION_STYLE'; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER caption_style_guard BEFORE INSERT OR UPDATE OF caption_style ON public.projects FOR EACH ROW EXECUTE FUNCTION public.project_caption_schema_guard();
-- >>> End 0005_private_media_retention_policies.sql <<< --

-- >>> Start 0006_versioned_package_updates.sql <<< --
CREATE OR REPLACE FUNCTION public.owner_update_package(_actor uuid,_id text,_value jsonb,_reason text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE prior public.credit_packages; BEGIN IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; SELECT * INTO prior FROM public.credit_packages WHERE id=_id FOR UPDATE; IF NOT FOUND OR length(trim(_reason)) NOT BETWEEN 1 AND 200 OR (_value->>'credits')::integer NOT BETWEEN 1 AND 100000 OR (_value->>'price_inr')::integer NOT BETWEEN 1 AND 100000 THEN RAISE EXCEPTION 'INVALID_PACKAGE'; END IF; UPDATE public.credit_packages SET name=_value->>'name',price_inr=(_value->>'price_inr')::integer,credits=(_value->>'credits')::integer,active=(_value->>'active')::boolean,highlighted=(_value->>'highlighted')::boolean,sort=(_value->>'sort')::integer,updated_at=now() WHERE id=_id; INSERT INTO public.admin_audit_logs(actor_id,action,target,reason,previous_value,new_value) VALUES(_actor,'package_update',_id,_reason,to_jsonb(prior),_value); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.owner_update_package(uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.owner_update_package(uuid,text,jsonb,text) TO service_role;
-- >>> End 0006_versioned_package_updates.sql <<< --

-- >>> Start 0007_consent_safe_campaign_queue.sql <<< --
CREATE TABLE public.email_unsubscribe_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()); GRANT ALL ON public.email_unsubscribe_tokens TO service_role; ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_unsubscribe_token(_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid; BEGIN SELECT user_id INTO uid FROM public.email_unsubscribe_tokens WHERE token_hash=_hash AND expires_at>now(); IF NOT FOUND THEN RETURN false; END IF; PERFORM public.set_marketing_consent(uid,false); RETURN true; END $$;
REVOKE ALL ON FUNCTION public.consume_unsubscribe_token(text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.consume_unsubscribe_token(text) TO service_role;
CREATE OR REPLACE FUNCTION public.queue_campaign(_actor uuid,_campaign_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.email_campaigns; settings jsonb; recipient_count integer; BEGIN IF NOT public.is_app_owner(_actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF; SELECT value INTO settings FROM public.app_settings WHERE key='product'; IF settings IS NULL OR settings->>'emailProvider'='unconfigured' THEN RAISE EXCEPTION 'EMAIL_NOT_CONFIGURED'; END IF; SELECT * INTO c FROM public.email_campaigns WHERE id=_campaign_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF; IF c.status<>'draft' THEN SELECT count(*) INTO recipient_count FROM public.email_campaign_recipients WHERE campaign_id=c.id; RETURN recipient_count; END IF; INSERT INTO public.email_campaign_recipients(campaign_id,user_id) SELECT c.id,p.user_id FROM public.user_marketing_preferences p WHERE p.consent AND public.account_is_active(p.user_id) AND NOT EXISTS(SELECT 1 FROM public.email_suppressions s WHERE s.user_id=p.user_id) AND (c.audience='subscribers' OR (c.audience='recent' AND EXISTS(SELECT 1 FROM public.profiles WHERE id=p.user_id AND created_at>=now()-interval '30 days')) OR (c.audience='paid' AND EXISTS(SELECT 1 FROM public.payments WHERE user_id=p.user_id AND status='paid')) OR (c.audience='free' AND NOT EXISTS(SELECT 1 FROM public.payments WHERE user_id=p.user_id AND status='paid')) OR (c.audience='transcription' AND EXISTS(SELECT 1 FROM public.transcription_jobs WHERE user_id=p.user_id)) OR (c.audience='rendering' AND EXISTS(SELECT 1 FROM public.rendering_jobs WHERE user_id=p.user_id))) ON CONFLICT(campaign_id,user_id) DO NOTHING; GET DIAGNOSTICS recipient_count=ROW_COUNT; UPDATE public.email_campaigns SET status='queued',updated_at=now() WHERE id=c.id; INSERT INTO public.admin_audit_logs(actor_id,action,target,new_value) VALUES(_actor,'campaign_queued',c.id::text,jsonb_build_object('recipients',recipient_count)); RETURN recipient_count; END $$;
REVOKE ALL ON FUNCTION public.queue_campaign(uuid,uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.queue_campaign(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_campaign_recipients(_campaign_id uuid) RETURNS SETOF public.email_campaign_recipients LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.email_campaign_recipients r SET status='suppressed' WHERE r.campaign_id=_campaign_id AND r.status IN ('queued','retry') AND (NOT EXISTS(SELECT 1 FROM public.user_marketing_preferences p WHERE p.user_id=r.user_id AND p.consent) OR EXISTS(SELECT 1 FROM public.email_suppressions s WHERE s.user_id=r.user_id) OR NOT public.account_is_active(r.user_id)); RETURN QUERY WITH candidates AS (SELECT r.id FROM public.email_campaign_recipients r JOIN public.email_campaigns c ON c.id=r.campaign_id WHERE r.campaign_id=_campaign_id AND c.status IN ('queued','sending') AND (c.scheduled_at IS NULL OR c.scheduled_at<=now()) AND r.status IN ('queued','retry') AND r.attempts<5 AND r.next_attempt_at<=now() AND (r.lease_expires_at IS NULL OR r.lease_expires_at<now()) AND EXISTS(SELECT 1 FROM public.user_marketing_preferences p WHERE p.user_id=r.user_id AND p.consent) AND NOT EXISTS(SELECT 1 FROM public.email_suppressions s WHERE s.user_id=r.user_id) ORDER BY r.created_at LIMIT 20 FOR UPDATE OF r SKIP LOCKED) UPDATE public.email_campaign_recipients r SET status='sending',attempts=attempts+1,lease_expires_at=now()+interval '5 minutes' FROM candidates c WHERE r.id=c.id RETURNING r.*; END $$;
REVOKE ALL ON FUNCTION public.claim_campaign_recipients(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.claim_campaign_recipients(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.audit_history_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'AUDIT_HISTORY_IMMUTABLE'; END $$;
CREATE TRIGGER immutable_admin_audit BEFORE UPDATE OR DELETE ON public.admin_audit_logs FOR EACH ROW EXECUTE FUNCTION public.audit_history_immutable();
-- >>> End 0007_consent_safe_campaign_queue.sql <<< --

-- >>> Start 0008_protect_source_metadata_and_limits.sql <<< --
REVOKE INSERT,UPDATE ON public.projects FROM authenticated;
GRANT INSERT(user_id,title,storage_path,duration_seconds,language,style_preset,caption_style) ON public.projects TO authenticated;
GRANT UPDATE(title,style_preset,caption_style) ON public.projects TO authenticated;
CREATE OR REPLACE FUNCTION public.new_project_duration_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE max_seconds integer; BEGIN SELECT coalesce((value->>'maxVideoSeconds')::integer,300) INTO max_seconds FROM public.app_settings WHERE key='product'; max_seconds:=coalesce(max_seconds,300); IF NEW.duration_seconds IS NULL OR NEW.duration_seconds<=0 OR NEW.duration_seconds>max_seconds THEN RAISE EXCEPTION 'VIDEO_DURATION_LIMIT'; END IF; IF NEW.storage_path IS NULL OR NEW.storage_path NOT LIKE NEW.user_id::text||'/%' THEN RAISE EXCEPTION 'INVALID_SOURCE_PATH'; END IF; RETURN NEW; END $$;
CREATE TRIGGER new_project_duration_guard BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.new_project_duration_guard();
-- >>> End 0008_protect_source_metadata_and_limits.sql <<< --
