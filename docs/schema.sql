-- Project Night's Watch — golden data model as Postgres DDL.
-- This file is the database diagram made concrete; it is the canonical grain
-- behind spec/ontology.json and the interactive diagram. (No live database is
-- required for this deliverable — the schema documents the model.)
-- Schemas mirror the medallion layers AND the UI navigation grain:
--   bronze = raw source files (drill-down target) · silver = conformed entities
--   gold   = metrics per company per refresh · ref = controlled lookups · app = actions/digest
-- See docs/ontology.md.

create schema if not exists bronze;
create schema if not exists silver;
create schema if not exists gold;
create schema if not exists ref;
create schema if not exists app;

-- ============================================================================
-- REF — controlled lookups (never trust a source's own USD column / FX)
-- ============================================================================

-- Convertibility class per currency. Source: IMF AREAER (de-facto exchange
-- restrictions). transferable = freely convertible hard currency the borrower
-- can actually use to service hard-currency debt; partial = convertible with
-- friction/haircut; restricted = trapped local currency.
create table ref.convertibility (
    currency            text primary key,
    class               text not null check (class in ('transferable','partial','restricted')),
    partial_factor      numeric not null default 1.0,   -- haircut applied to 'partial'
    note                text,
    source              text not null default 'IMF AREAER (synthetic demo mapping)'
);

create table ref.fx_rate (
    currency            text not null,
    rate_date           date not null,
    rate_to_usd         numeric not null,               -- 1 unit LCY = rate_to_usd USD
    source              text not null default 'controlled FX source (synthetic)',
    primary key (currency, rate_date)
);

-- ============================================================================
-- BRONZE — raw source files landed untouched, with provenance. Immutable.
-- ============================================================================

-- Every ingested file. content_text holds the original bytes (CSV/JSON text)
-- so the UI can show the exact raw file behind any number (drill-down target).
create table bronze.source_file (
    file_id             bigint generated always as identity primary key,
    source_type         text not null,                  -- bank_balance | crm_loan | payment_schedule | missed_payment | financials | lifecycle | external_forecast
    file_name           text not null,
    sha256              text not null,
    ingested_at         timestamptz not null default now(),
    content_text        text not null
);

-- Raw bank export rows, exactly as received (all text; nothing re-derived here).
create table bronze.bank_balance_raw (
    row_id                      bigint generated always as identity primary key,
    file_id                     bigint not null references bronze.source_file(file_id),
    row_num                     int not null,
    company_tag                 text,                   -- synthetic exports embed the company; real feed resolves via CRM
    unique_account_identifier   text,
    currency                    text,
    lcy_value                   text,
    usd_value_reported          text,                   -- the source's own USD column — NOT trusted downstream
    financial_institution       text,
    account_location            text,
    last_updated                text
);

create table bronze.crm_loan_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    company_tag         text,
    loan_ref            text,
    principal           text,
    seniority           text,
    coupon_rate         text,
    cash_vs_pik         text,
    drawn_date          text,
    next_payment_date   text
);

create table bronze.payment_schedule_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    loan_ref            text,
    payment_date        text,
    amount_due          text,
    is_pik              text
);

create table bronze.missed_payment_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    company_tag         text,
    loan_ref            text,
    event_date          text,
    was_missed          text,
    multiple_at_time    text
);

-- Medium / Later raw landing tables (present so the model is forward-compatible).
create table bronze.financials_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    company_tag         text,
    period              text,
    cash_from_ops       text,
    mandatory_debt_service text,
    free_cash_after_commitments text
);

create table bronze.lifecycle_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    company_tag         text,
    period              text,
    contracts_pipeline_usd text,
    product_usage_index text,
    forecast_inflows_usd text
);

create table bronze.external_forecast_raw (
    row_id              bigint generated always as identity primary key,
    file_id             bigint not null references bronze.source_file(file_id),
    row_num             int not null,
    as_of               text,
    rate_curve_bps      text,
    input_cost_index    text
);

-- ============================================================================
-- SILVER — one canonical schema. USD re-derived from ref.fx_rate; account_key
-- resolved; convertibility tagged; bad rows quarantined.
-- ============================================================================

create table silver.company (
    company_id              text primary key,
    name                    text not null,
    jurisdiction            text,
    prior_distress_history  boolean not null default false
);

create table silver.account (
    account_pk          bigint generated always as identity primary key,
    account_key         text not null,                  -- native ID, else FI+country (resolved)
    company_id          text not null references silver.company(company_id),
    currency            text not null,
    convertibility_class text not null,
    balance_lcy         numeric not null,
    balance_usd         numeric not null,               -- RE-DERIVED from ref.fx_rate, not the source column
    financial_institution text,
    jurisdiction        text,
    snapshot_ts         date not null,
    source_row_id       bigint not null references bronze.bank_balance_raw(row_id)
);
create index on silver.account (company_id, snapshot_ts);

create table silver.loan (
    loan_id             text primary key,
    company_id          text not null references silver.company(company_id),
    principal           numeric not null,
    seniority           text,
    coupon_rate         numeric,                        -- annual, fraction (0.12 = 12%)
    cash_vs_pik         text check (cash_vs_pik in ('cash','pik')),
    drawn_date          date,
    next_payment_date   date,
    source_row_id       bigint references bronze.crm_loan_raw(row_id)
);

create table silver.payment_schedule (
    id                  bigint generated always as identity primary key,
    loan_id             text not null references silver.loan(loan_id),
    payment_date        date not null,
    amount_due          numeric not null,
    is_pik              boolean not null default false,
    source_row_id       bigint references bronze.payment_schedule_raw(row_id)
);

create table silver.missed_payment_label (
    id                  bigint generated always as identity primary key,
    company_id          text not null references silver.company(company_id),
    loan_id             text references silver.loan(loan_id),
    event_date          date not null,
    was_missed          boolean not null,
    multiple_at_time    boolean not null default false,
    source_row_id       bigint references bronze.missed_payment_raw(row_id)
);

-- Validation layer: rows that failed canonicalization are quarantined, not dropped.
create table silver.validation_quarantine (
    id                  bigint generated always as identity primary key,
    source_type         text not null,
    source_row_id       bigint,
    reason              text not null,
    raw_payload         jsonb,
    quarantined_at      timestamptz not null default now()
);

-- Medium (sparsely populated now; the column exists so Medium slots in).
create table silver.financials (
    id                  bigint generated always as identity primary key,
    company_id          text not null references silver.company(company_id),
    period              text not null,
    cash_from_ops       numeric,
    mandatory_debt_service numeric,
    free_cash_after_commitments numeric,
    source_row_id       bigint references bronze.financials_raw(row_id)
);

-- Later (sparsely populated now).
create table silver.business_lifecycle (
    id                  bigint generated always as identity primary key,
    company_id          text not null references silver.company(company_id),
    period              text not null,
    contracts_pipeline_usd numeric,
    product_usage_index numeric,
    forecast_inflows_usd numeric,
    source_row_id       bigint references bronze.lifecycle_raw(row_id)
);

create table silver.external_forecast (
    id                  bigint generated always as identity primary key,
    as_of               date not null,
    rate_curve_bps      numeric,
    input_cost_index    numeric,
    source_row_id       bigint references bronze.external_forecast_raw(row_id)
);

-- ============================================================================
-- GOLD — coverage metric + company summary fields, per company per refresh.
-- This is where M1/M2/M3 are materialized:
--   M1 current transferable cash  = transferable_cash_usd (latest refresh)
--   M2 history of transferable    = transferable_cash_usd across refreshes
--   M3 proxy of transferable @ T1 = projected_transferable_t1
-- ============================================================================

create table gold.company_snapshot (
    id                       bigint generated always as identity primary key,
    company_id               text not null references silver.company(company_id),
    refresh_ts               date not null,
    total_cash_usd           numeric not null,
    transferable_cash_usd    numeric not null,          -- M1
    trapped_cash_usd         numeric not null,
    burn_per_day_usd         numeric,
    runway_days              numeric,
    projected_transferable_t1 numeric,                  -- M3
    cash_to_repay_t1         numeric,
    next_payment_date        date,
    coverage_ratio           numeric,                   -- transferable (or M3) / cash_to_repay_t1
    deteriorating            boolean,
    prior_issue_count        int not null default 0,
    principal_at_risk        numeric,
    ew_label                 text check (ew_label in ('High','Medium','Low','None')),
    data_freshness_days      numeric,
    unique (company_id, refresh_ts)
);
create index on gold.company_snapshot (refresh_ts);

-- Drill-down lineage: every gold number links to the exact bronze rows behind it.
create table gold.metric_lineage (
    id                  bigint generated always as identity primary key,
    snapshot_id         bigint not null references gold.company_snapshot(id) on delete cascade,
    metric              text not null,                  -- e.g. transferable_cash_usd
    bronze_table        text not null,
    bronze_row_id       bigint not null
);
create index on gold.metric_lineage (snapshot_id, metric);

-- ============================================================================
-- APP — actions + the morning digest (the label flywheel)
-- ============================================================================

create table app.action_log (
    id                  bigint generated always as identity primary key,
    company_id          text not null references silver.company(company_id),
    loan_id             text references silver.loan(loan_id),
    action_date         timestamptz not null default now(),
    priority_quadrant   text check (priority_quadrant in ('P1','P2','P3','P4')),
    action_taken        text not null,
    outcome             text,
    actor               text not null default 'credit-team'
);

create table app.digest (
    id                  bigint generated always as identity primary key,
    refresh_ts          date not null,
    generated_at        timestamptz not null default now(),
    payload             jsonb not null                  -- changed-status companies, ranked
);

-- Stub of the confidentiality model: which user may see which company.
create table app.user_company_access (
    actor               text not null,
    company_id          text not null references silver.company(company_id),
    primary key (actor, company_id)
);

-- ============================================================================
-- RLS STUBS — represent the confidentiality requirement (who may see which
-- company). Permissive for the demo; production swaps in the access-table check.
-- ============================================================================
alter table silver.company enable row level security;
alter table gold.company_snapshot enable row level security;

-- Permissive policy for the demo (service role). Production swaps this for the
-- access-table check below.
create policy demo_read_company on silver.company for select using (true);
create policy demo_read_gold    on gold.company_snapshot for select using (true);

-- Production policy (kept here, not enabled): a user sees a company only if it
-- appears in app.user_company_access for them.
--   create policy rls_company on silver.company for select using (
--     exists (select 1 from app.user_company_access a
--             where a.company_id = silver.company.company_id
--               and a.actor = current_setting('request.jwt.claims', true)::jsonb->>'actor'));
