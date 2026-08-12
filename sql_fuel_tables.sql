-- Preț mediu național (o singură linie, actualizată zilnic)
create table if not exists fuel_national (
  id int primary key default 1,
  data date,
  benzina_min numeric, benzina_avg numeric, benzina_max numeric,
  motorina_min numeric, motorina_avg numeric, motorina_max numeric,
  gpl_min numeric, gpl_avg numeric, gpl_max numeric,
  updated_at timestamptz default now()
);

-- Stații reale cu preț, actualizate săptămânal
create table if not exists fuel_stations (
  id text primary key,
  brand text,
  nume text,
  adresa text,
  lat numeric,
  lon numeric,
  benzina_standard numeric,
  motorina_standard numeric,
  gpl numeric,
  updated_at timestamptz default now()
);

create index if not exists idx_fuel_stations_lat_lon on fuel_stations(lat, lon);

-- Acces public doar la citire (userii citesc, doar edge function-ul cu service role scrie)
alter table fuel_national enable row level security;
alter table fuel_stations enable row level security;

create policy "fuel_national_read" on fuel_national for select using (true);
create policy "fuel_stations_read" on fuel_stations for select using (true);
