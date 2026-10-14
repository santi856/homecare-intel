-- Private HomeCare Intel back office. Never expose these tables to browser users.
create schema if not exists homecare_ops;
create table if not exists homecare_ops.event_receipts (
 id text primary key, event_type text not null, received_at timestamptz not null default now());
create table if not exists homecare_ops.orders (
 session_id text primary key, plan text not null, buyer_email text,
 stripe_customer_id text, stripe_subscription_id text,
 paid_cents bigint, currency text, status text not null default 'paid_verified',
 created_at timestamptz not null default now());
create table if not exists homecare_ops.jobs (
 id bigint generated always as identity primary key,
 job_key text not null unique, sector text not null, action text not null,
 order_session_id text references homecare_ops.orders(session_id),
 market text, status text not null default 'queued',
 attempts integer not null default 0, due_at timestamptz not null default now(),
 claimed_at timestamptz, last_error text, created_at timestamptz not null default now());
create table if not exists homecare_ops.prospects (
 id text primary key, business_name text, website text, contact_route text,
 contact_permission text, suppressed boolean not null default false,
 status text not null default 'discovered', updated_at timestamptz not null default now());
create table if not exists homecare_ops.conversations (
 id text primary key, prospect_id text references homecare_ops.prospects(id),
 state jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists homecare_ops.market_inventory (
 state text primary key, verified_contacts integer,
 active_campaigns integer not null default 0, updated_at timestamptz not null default now(),
 check (verified_contacts is null or verified_contacts >= 0),
 check (active_campaigns >= 0));
create table if not exists homecare_ops.campaigns (
 id text primary key, order_session_id text references homecare_ops.orders(session_id),
 state text, approved_copy boolean not null default false,
 status text not null default 'awaiting_approval', sends integer not null default 0,
 replies integer not null default 0, booked integer not null default 0);
create index if not exists homecare_jobs_by_status on homecare_ops.jobs(status,due_at);
create index if not exists homecare_orders_by_subscription on homecare_ops.orders(stripe_subscription_id);

alter table homecare_ops.event_receipts enable row level security;
alter table homecare_ops.orders enable row level security;
alter table homecare_ops.jobs enable row level security;
alter table homecare_ops.prospects enable row level security;
alter table homecare_ops.conversations enable row level security;
alter table homecare_ops.market_inventory enable row level security;
alter table homecare_ops.campaigns enable row level security;
revoke all on schema homecare_ops from public,anon,authenticated;
revoke all on all tables in schema homecare_ops from public,anon,authenticated;
grant usage on schema homecare_ops to service_role;
grant all on all tables in schema homecare_ops to service_role;
grant usage,select on all sequences in schema homecare_ops to service_role;

-- Atomic acceptance creates exactly one paid order and one fulfillment job.
create or replace function public.accept_hci_stripe_event(
 p_event_id text,p_event_type text,p_live boolean,
 p_object_id text default null,p_session_id text default null,
 p_link_id text default null,p_session_status text default null,p_payment_status text default null,
 p_customer_email text default null,p_customer_id text default null,p_subscription_id text default null,
 p_amount_total bigint default null,p_currency text default null)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,homecare_ops
as $$
declare v_inserted text;v_order text;v_plan text;v_action text;
begin
 if p_live is distinct from true then return jsonb_build_object('accepted',false,'reason','test_mode');end if;
 if p_event_id is null or length(p_event_id)>255 or p_event_type is null then raise exception 'Invalid event';end if;
 insert into homecare_ops.event_receipts(id,event_type) values(p_event_id,p_event_type)
 on conflict(id) do nothing returning id into v_inserted;
 if v_inserted is null then return jsonb_build_object('accepted',true,'duplicate',true);end if;

 if p_event_type in ('checkout.session.completed','checkout.session.async_payment_succeeded') then
   if p_session_id is null or p_payment_status <> 'paid' or p_session_status <> 'complete' then
     return jsonb_build_object('accepted',true,'paid',false);
   end if;
   v_plan:=case p_link_id
    when 'plink_1UQ5SjLTIwtoxZQIfCQdk5VE' then 'pilot'
    when 'plink_1UQ5SqLTIwtoxZQIlmQVdYKp' then 'signals'
    when 'plink_1UQ5TGLTIwtoxZQIwwPspQW3' then 'allAccess'
    when 'plink_1UPR1hLTIwtoxZQIAqTh1GtQ' then 'annual'
    when 'plink_1UPQ9RLTIwtoxZQIB3fKt7Sl' then 'dfy'
    when 'plink_1UPQ9PLTIwtoxZQIDUVEywTW' then 'diy'
    when 'plink_1UPR1eLTIwtoxZQI1DZ52tMT' then 'stateFile'
    when 'plink_1UPR1gLTIwtoxZQI6epJKsq4' then 'dfyPlus'
    when 'plink_1UOOltLTIwtoxZQIYAwYAHOc' then 'legacy'
    else 'unrecognized' end;
   insert into homecare_ops.orders(session_id,plan,buyer_email,stripe_customer_id,
      stripe_subscription_id,paid_cents,currency)
     values (p_session_id,v_plan,left(p_customer_email,320),p_customer_id,p_subscription_id,
      p_amount_total,left(p_currency,3))
     on conflict(session_id) do nothing returning session_id into v_order;
   if v_order is not null then
     v_action:=case
      when v_plan in ('diy','allAccess','signals','stateFile') then 'prepare_private_data_delivery'
      when v_plan in ('pilot','dfy','annual','dfyPlus') then 'collect_campaign_scope'
      else 'review_entitlement' end;
     insert into homecare_ops.jobs(job_key,sector,action,order_session_id)
     values('paid:'||v_order,'service_delivery',v_action,v_order)
     on conflict(job_key) do nothing;
   end if;
   return jsonb_build_object('accepted',true,'orderCreated',v_order is not null,'plan',v_plan);
 elsif p_event_type='charge.refunded' then
   insert into homecare_ops.jobs(job_key,sector,action)
   values('refund:'||p_event_id,'financial_control','reconcile_refund')
   on conflict(job_key) do nothing;
 elsif p_event_type='customer.subscription.deleted' then
   update homecare_ops.orders set status='subscription_ended'
   where stripe_subscription_id=p_object_id;
   insert into homecare_ops.jobs(job_key,sector,action)
   values('ended:'||p_event_id,'customer_success','reconcile_subscription_end')
   on conflict(job_key) do nothing;
 end if;
 return jsonb_build_object('accepted',true);
end; $$;
revoke all on function public.accept_hci_stripe_event(
 text,text,boolean,text,text,text,text,text,text,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.accept_hci_stripe_event(
 text,text,boolean,text,text,text,text,text,text,text,bigint,text) to service_role;

-- Only a private worker with the service role may claim jobs.
create or replace function public.claim_hci_jobs(p_limit integer default 5)
returns setof homecare_ops.jobs language plpgsql security definer
set search_path=pg_catalog,public,homecare_ops as $$
begin
 return query with picked as (
   select id from homecare_ops.jobs where status='queued' and due_at<=now()
   order by due_at,id for update skip locked
   limit greatest(1,least(coalesce(p_limit,5),20))
 ) update homecare_ops.jobs j
 set status='claimed',claimed_at=now(),attempts=j.attempts+1
 from picked where j.id=picked.id returning j.*;
end; $$;
revoke all on function public.claim_hci_jobs(integer) from public,anon,authenticated;
grant execute on function public.claim_hci_jobs(integer) to service_role;
