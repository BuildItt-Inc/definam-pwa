create extension if not exists vector;

create table if not exists schools (
  id uuid primary key,
  name text not null,
  paystack_customer_id text,
  subscription_tier text,
  term_end_date date,
  active_seats integer default 0
);

create table if not exists access_ids (
  id uuid primary key,
  code text unique not null,
  school_id uuid references schools (id),
  status text not null,
  activated_by uuid,
  activated_at timestamptz
);

create table if not exists users (
  id uuid primary key,
  school_id uuid references schools (id),
  role text not null,
  grade_level text,
  streak_count integer default 0,
  last_active_date date
);
