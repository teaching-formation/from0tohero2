-- 021_tips.sql — Tips / TIL

create table if not exists tips (
  id            uuid primary key default gen_random_uuid(),
  praticien_id  uuid not null references praticiens(id) on delete cascade,
  content       text not null check (char_length(content) <= 280),
  type          text not null default 'tip' check (type in ('tip','TIL','snippet')),
  category      text not null default 'autre',
  stack         text[] not null default '{}',
  status        text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists tips_praticien_id_idx on tips(praticien_id);
create index if not exists tips_status_idx        on tips(status);
create index if not exists tips_created_at_idx    on tips(created_at desc);

-- RLS
alter table tips enable row level security;

create policy "tips: lecture publique approuvées"
  on tips for select
  using (status = 'approved');

create policy "tips: insert si authentifié"
  on tips for insert
  with check (
    auth.uid() is not null
    and praticien_id in (
      select id from praticiens where user_id = auth.uid()
    )
  );

create policy "tips: delete si propriétaire"
  on tips for delete
  using (
    praticien_id in (
      select id from praticiens where user_id = auth.uid()
    )
  );

create policy "tips: update si propriétaire"
  on tips for update
  using (
    praticien_id in (
      select id from praticiens where user_id = auth.uid()
    )
  );
