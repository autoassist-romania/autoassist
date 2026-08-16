-- Produse reale din feed-ul Automobilus.ro (2Performant), filtrate pe categoriile relevante AutoAssist
create table if not exists piese_automobilus (
  id text primary key,          -- Product ID din feed (EAN)
  brand text,
  categorie text,                -- categoria brută din feed (ex: "Piese auto > Ulei motor")
  categorie_app text,            -- categoria mapată la AutoAssist (ulei-motor, filtre-ulei, etc)
  titlu text,
  pret numeric,
  pret_vechi numeric,
  imagine text,
  link_cumparare text,           -- link de afiliat exact al produsului, generat de 2Performant
  updated_at timestamptz default now()
);

create index if not exists idx_piese_auto_categorie_app on piese_automobilus(categorie_app);
create index if not exists idx_piese_auto_brand on piese_automobilus(brand);
create index if not exists idx_piese_auto_pret on piese_automobilus(pret);

-- Acces public doar la citire (userii citesc, doar edge function-ul cu service role scrie)
alter table piese_automobilus enable row level security;
create policy "piese_automobilus_read" on piese_automobilus for select using (true);
