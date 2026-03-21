-- Table 1 : Simulations RSU
create table public.rsu_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  nom text not null default 'Ma simulation RSU',
  mode text not null check (mode in ('simple', 'avance')),
  tmi numeric not null,
  prix_vente numeric not null,
  taux_change_vente numeric not null default 1,
  date_cession_globale date
);

-- Table 2 : Plans RSU par simulation
create table public.rsu_plans (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid references public.rsu_simulations(id) on delete cascade not null,
  created_at timestamptz default now(),
  nom text not null,
  ticker text,
  entreprise_nom text,
  annee_attribution integer not null,
  regime text not null check (regime in (
    'AGA_PRE2012', 'AGA_2012_2015', 'AGA_2015_2016',
    'AGA_2017', 'AGA_POST2018', 'NON_QUALIFIE'
  )),
  devise text not null check (devise in ('EUR', 'USD')),
  date_fin_conservation date,
  date_cession date,
  gain_acquisition_total numeric not null default 0
);

-- Table 3 : Vestings par plan
create table public.rsu_vestings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.rsu_plans(id) on delete cascade not null,
  date date not null,
  nb_rsu numeric not null,
  cours numeric not null,
  taux_change numeric not null default 1,
  gain_eur numeric not null default 0
);

-- RLS
alter table public.rsu_simulations enable row level security;
alter table public.rsu_plans enable row level security;
alter table public.rsu_vestings enable row level security;

-- Policies
create policy "owner_all" on public.rsu_simulations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner_all" on public.rsu_plans
  for all using (
    exists (
      select 1 from public.rsu_simulations s
      where s.id = simulation_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rsu_simulations s
      where s.id = simulation_id and s.user_id = auth.uid()
    )
  );

create policy "owner_all" on public.rsu_vestings
  for all using (
    exists (
      select 1 from public.rsu_plans p
      join public.rsu_simulations s on s.id = p.simulation_id
      where p.id = plan_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rsu_plans p
      join public.rsu_simulations s on s.id = p.simulation_id
      where p.id = plan_id and s.user_id = auth.uid()
    )
  );

-- Indexes
create index idx_rsu_simulations_user_id on public.rsu_simulations(user_id);
create index idx_rsu_plans_simulation_id on public.rsu_plans(simulation_id);
create index idx_rsu_vestings_plan_id on public.rsu_vestings(plan_id);

-- Updated_at trigger
create trigger update_rsu_simulations_updated_at
  before update on public.rsu_simulations
  for each row execute function public.update_updated_at_column();