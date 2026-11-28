-- 家計簿アプリ 初期スキーマ
-- profiles / categories / transactions / category_monthly_totals

-- ============================================================
-- profiles（Supabase Auth ユーザーの拡張情報）
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- サインアップ時に profiles 行を自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 既存ユーザーのバックフィル
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ============================================================
-- 共通: updated_at 自動更新
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- categories（大分類・小分類を自己参照で管理）
-- parent_id IS NULL → 大分類、NOT NULL → 小分類（2階層固定）
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  parent_id uuid references public.categories (id) on delete cascade,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 同一ユーザー・同一type・同一親の下でカテゴリ名は一意
-- （parent_id の NULL を 0 UUID に置き換えて一意制約を有効化）
create unique index categories_unique_name
  on public.categories (
    user_id,
    type,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  );

create index categories_user_type_idx
  on public.categories (user_id, type, parent_id);

-- 2階層・同一ユーザー・同一type の整合性を検証
create or replace function public.validate_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_row public.categories%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;

  select * into parent_row
  from public.categories
  where id = new.parent_id;

  if not found then
    raise exception 'parent category not found';
  end if;
  if parent_row.user_id <> new.user_id or parent_row.type <> new.type then
    raise exception 'parent category must belong to same user and type';
  end if;
  if parent_row.parent_id is not null then
    raise exception 'category hierarchy is limited to two levels';
  end if;

  return new;
end;
$$;

create trigger categories_validate_parent
  before insert or update of user_id, type, parent_id on public.categories
  for each row execute function public.validate_category();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);
create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);
create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- transactions（収支記録）
-- category_id は必ず小分類（parent_id IS NOT NULL）を指す
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  occurred_on date not null,
  entry_type text not null check (entry_type in ('expense', 'income')),
  amount integer not null check (amount > 0),
  memo text,
  source text not null default 'manual' check (source in ('manual', 'csv')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);
create index transactions_user_category_idx
  on public.transactions (user_id, category_id);

-- カテゴリの整合性を検証:
-- ・同一ユーザーのカテゴリであること
-- ・小分類（parent_id IS NOT NULL）であること
-- ・カテゴリの type と entry_type が一致すること
create or replace function public.validate_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_row public.categories%rowtype;
begin
  select * into cat_row
  from public.categories
  where id = new.category_id;

  if not found then
    raise exception 'category not found';
  end if;
  if cat_row.user_id <> new.user_id then
    raise exception 'category must belong to same user';
  end if;
  if cat_row.parent_id is null then
    raise exception 'transaction category must be a subcategory';
  end if;
  if cat_row.type <> new.entry_type then
    raise exception 'entry_type must match category type';
  end if;

  return new;
end;
$$;

create trigger transactions_validate_category
  before insert or update of user_id, category_id, entry_type on public.transactions
  for each row execute function public.validate_transaction();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);
create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);
create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- category_monthly_totals（月次×カテゴリ集計）
-- FastAPI が transactions の書き込み後に対象月を再集計して保持する。
-- transactions が正（source of truth）であり、本テーブルは再生成可能。
-- ============================================================
create table public.category_monthly_totals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  year_month date not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  entry_type text not null check (entry_type in ('expense', 'income')),
  total_amount bigint not null default 0,
  transaction_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, year_month, category_id)
);

create index category_monthly_totals_user_month_idx
  on public.category_monthly_totals (user_id, year_month);

alter table public.category_monthly_totals enable row level security;

create policy "totals_select_own"
  on public.category_monthly_totals for select
  using (auth.uid() = user_id);
create policy "totals_insert_own"
  on public.category_monthly_totals for insert
  with check (auth.uid() = user_id);
create policy "totals_update_own"
  on public.category_monthly_totals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "totals_delete_own"
  on public.category_monthly_totals for delete
  using (auth.uid() = user_id);
