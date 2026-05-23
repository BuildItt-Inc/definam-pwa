create extension if not exists vector;

create table if not exists schools (
  id uuid primary key,
  email varchar(320) unique not null,
  name varchar(255) not null,
  active_seats integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  username varchar(255) unique not null,
  password_hash text,
  role varchar(50) not null,
  org_id uuid references schools (id) on delete set null,
  device_fingerprint text,
  force_password_change boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists access_codes (
  id uuid primary key,
  code varchar(20) unique not null,
  type varchar(20) not null,
  status varchar(20) not null default 'pending',
  school_id uuid references schools (id) on delete set null,
  activated_by uuid references users (id) on delete set null,
  device_fingerprint text
);

create table if not exists processed_webhooks (
  reference varchar(255) primary key,
  processed_at timestamptz not null default now()
);
