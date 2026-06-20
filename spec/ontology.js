// AUTO-GENERATED from spec/ontology.json by scripts/build_spec.py — do not edit by hand.
window.NW_SPEC = {
  "meta": {
    "product": "Project Night's Watch",
    "purpose": "Real-time cash monitoring & early-warning for Liquidity's Credit team: catch a portfolio company's cash trouble before it becomes a missed payment.",
    "signal": "coverage = expected transferable cash at next payment (T1) / cash to repay at T1.  Below 1.0 => at risk.",
    "labels": [
      "High",
      "Medium",
      "Low",
      "None"
    ],
    "note": "Synthetic data only. One company (Sahel AgriCorp) mirrors the numeric distribution of the provided real bank export ($9.31M total / $796K transferable) as the worked example.",
    "version": "spec-1.0"
  },
  "brand": {
    "source": "liquidity.com (2026 brand system)",
    "fonts": {
      "primary": "'IBM Plex Sans', Arial, sans-serif",
      "display": "'IBM Plex Sans', Arial, sans-serif"
    },
    "colors": {
      "ink": "#072708",
      "ink_700": "#13361a",
      "sand": "#fdf5f0",
      "sand_500": "#f3e7df",
      "sand_700": "#c8b1a4",
      "taupe": "#6f5f56",
      "yellow": "#ffde43",
      "white": "#ffffff",
      "brown": "#291201"
    },
    "risk_colors": {
      "High": "#b3402e",
      "Medium": "#c98a1a",
      "Low": "#5e7d52",
      "None": "#9f887c"
    }
  },
  "layers": [
    {
      "id": "source",
      "name": "Source files",
      "desc": "Synthetic exports for every source type. The raw inputs each arrive at their own grain."
    },
    {
      "id": "bronze",
      "name": "Bronze (raw)",
      "desc": "Landed untouched, with provenance (source, ingested_at, sha256). Never mutated. The drill-down target."
    },
    {
      "id": "standardisation",
      "name": "Standardisation",
      "desc": "The bronze->silver work: parse, resolve IDs, re-derive USD, tag convertibility, de-dup, validate/quarantine. This is where raw becomes trustworthy."
    },
    {
      "id": "silver",
      "name": "Silver (canonical)",
      "desc": "One conformed schema. Company is the spine; every other entity hangs off it."
    },
    {
      "id": "gold",
      "name": "Gold (golden model)",
      "desc": "The early-warning model: one row per company per refresh, carrying the coverage signal + the 3 bank metrics + the summary fields."
    }
  ],
  "metrics": [
    {
      "id": "M1",
      "name": "Current transferable cash",
      "grain": "company x refresh",
      "gold_field": "transferable_cash_usd",
      "source": "bank balances",
      "method": "Sum USD balances in the 'transferable' convertibility class (hard currency the borrower can actually use).",
      "confidence": "4/5"
    },
    {
      "id": "M2",
      "name": "History of transferable cash",
      "grain": "company x snapshot series",
      "gold_field": "transferable_cash_usd (over refreshes)",
      "source": "bank balances",
      "method": "M1 across stored snapshots -> burn/day and runway.",
      "confidence": "4/5"
    },
    {
      "id": "M3",
      "name": "Proxy of transferable cash at T1",
      "grain": "company x next-payment-date",
      "gold_field": "projected_transferable_t1",
      "source": "bank balances",
      "method": "Project the M2 trend forward to the next repayment date.",
      "confidence": "2.5/5"
    }
  ],
  "inputs": [
    {
      "id": "bank_balance",
      "name": "Bank balance export",
      "phase": "Now",
      "grain": "one row per account per snapshot",
      "cadence": "refreshed hourly; exported as Excel",
      "example_columns": [
        "Unique account identifier",
        "CURRENCY",
        "LCY Value",
        "USD Value",
        "Financial Institution",
        "Account Location",
        "Last Updated"
      ],
      "id_rule": "account_key = COALESCE(native id, 'NBFI:'||FI||':'||country||':'||currency)",
      "feeds": [
        "silver.account"
      ],
      "metrics": [
        "M1",
        "M2",
        "M3"
      ],
      "real_sample_note": "62 accounts, 22 currencies, $9.31M total; 17 null-ID NBFI accounts hold $2.57M (28%); only $796K (hard ccy) is transferable."
    },
    {
      "id": "crm_loan",
      "name": "CRM loan structure",
      "phase": "Now",
      "grain": "one row per loan",
      "cadence": "on draw + amendments",
      "example_columns": [
        "loan_ref",
        "company",
        "principal",
        "seniority",
        "coupon_rate",
        "cash_vs_pik",
        "drawn_date",
        "next_payment_date"
      ],
      "id_rule": "loan_id = native CRM loan_ref",
      "feeds": [
        "silver.loan",
        "silver.company"
      ],
      "metrics": [
        "cash_to_repay_t1",
        "next_payment_date"
      ]
    },
    {
      "id": "payment_schedule",
      "name": "Payment schedule",
      "phase": "Now",
      "grain": "one row per loan per scheduled payment",
      "cadence": "with loan",
      "example_columns": [
        "loan_ref",
        "payment_date",
        "amount_due",
        "is_pik"
      ],
      "id_rule": "key = loan_id + payment_date",
      "feeds": [
        "silver.payment_schedule"
      ],
      "metrics": [
        "cash_to_repay_t1"
      ]
    },
    {
      "id": "missed_payment",
      "name": "Missed-payment history (labels)",
      "phase": "Now",
      "grain": "one row per company per labelled event",
      "cadence": "as events occur (ground truth)",
      "example_columns": [
        "company",
        "loan_ref",
        "event_date",
        "was_missed",
        "multiple_at_time"
      ],
      "id_rule": "surrogate id; (company_id, loan_id, event_date) natural key",
      "feeds": [
        "silver.missed_payment_label"
      ],
      "metrics": [
        "prior_issue_count"
      ]
    },
    {
      "id": "financials",
      "name": "Balance sheet + cashflow",
      "phase": "Medium",
      "grain": "one row per company per period",
      "cadence": "monthly / quarterly",
      "example_columns": [
        "company",
        "period",
        "cash_from_ops",
        "mandatory_debt_service",
        "free_cash_after_commitments"
      ],
      "id_rule": "key = company_id + period",
      "feeds": [
        "silver.financials"
      ],
      "metrics": [
        "free_cash_after_commitments (refines M3)"
      ]
    },
    {
      "id": "lifecycle",
      "name": "Business lifecycle (pipeline, usage)",
      "phase": "Later",
      "grain": "one row per company per period",
      "cadence": "monthly",
      "example_columns": [
        "company",
        "period",
        "contracts_pipeline_usd",
        "product_usage_index",
        "forecast_inflows_usd"
      ],
      "id_rule": "key = company_id + period",
      "feeds": [
        "silver.business_lifecycle"
      ],
      "metrics": [
        "forecast_inflows (turns run-down into a real forecast)"
      ]
    },
    {
      "id": "external_forecast",
      "name": "External rate & cost forecasts",
      "phase": "Later",
      "grain": "one row per as-of date",
      "cadence": "as published",
      "example_columns": [
        "as_of",
        "rate_curve_bps",
        "input_cost_index"
      ],
      "id_rule": "key = as_of",
      "feeds": [
        "silver.external_forecast"
      ],
      "metrics": [
        "adjusts floating-rate cash_to_repay_t1"
      ]
    }
  ],
  "entities": [
    {
      "name": "Company",
      "layer": "silver",
      "phase": "Now",
      "spine": true,
      "grain": "one row per portfolio company",
      "key_rule": "company_id resolved from CRM (native), accounts/loans link to it",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "PK"
        },
        {
          "name": "name",
          "type": "text"
        },
        {
          "name": "jurisdiction",
          "type": "text"
        },
        {
          "name": "prior_distress_history",
          "type": "bool"
        }
      ]
    },
    {
      "name": "Account",
      "layer": "silver",
      "phase": "Now",
      "grain": "one row per account per snapshot",
      "key_rule": "account_key = COALESCE(native id, 'NBFI:'||FI||':'||country||':'||currency)",
      "fields": [
        {
          "name": "account_key",
          "type": "text",
          "note": "resolved id (NBFI rule)"
        },
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "currency",
          "type": "text"
        },
        {
          "name": "convertibility_class",
          "type": "text",
          "note": "transferable | partial | restricted"
        },
        {
          "name": "balance_lcy",
          "type": "numeric"
        },
        {
          "name": "balance_usd",
          "type": "numeric",
          "note": "RE-DERIVED from ref.fx_rate, not the source USD column"
        },
        {
          "name": "financial_institution",
          "type": "text"
        },
        {
          "name": "jurisdiction",
          "type": "text"
        },
        {
          "name": "snapshot_ts",
          "type": "date"
        },
        {
          "name": "source_row_id",
          "type": "bigint",
          "key": "FK->bronze",
          "note": "drill-down"
        }
      ]
    },
    {
      "name": "Loan",
      "layer": "silver",
      "phase": "Now",
      "grain": "one row per loan",
      "key_rule": "loan_id = native CRM ref",
      "fields": [
        {
          "name": "loan_id",
          "type": "text",
          "key": "PK"
        },
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "principal",
          "type": "numeric"
        },
        {
          "name": "seniority",
          "type": "text"
        },
        {
          "name": "coupon_rate",
          "type": "numeric"
        },
        {
          "name": "cash_vs_pik",
          "type": "text",
          "note": "PIK = no cash due at T1"
        },
        {
          "name": "next_payment_date",
          "type": "date"
        }
      ]
    },
    {
      "name": "PaymentSchedule",
      "layer": "silver",
      "phase": "Now",
      "grain": "one row per loan per payment",
      "key_rule": "loan_id + payment_date",
      "fields": [
        {
          "name": "loan_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "payment_date",
          "type": "date"
        },
        {
          "name": "amount_due",
          "type": "numeric"
        },
        {
          "name": "is_pik",
          "type": "bool"
        }
      ]
    },
    {
      "name": "MissedPaymentLabel",
      "layer": "silver",
      "phase": "Now",
      "grain": "one row per labelled event",
      "key_rule": "surrogate; (company_id, loan_id, event_date) natural",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "loan_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "event_date",
          "type": "date"
        },
        {
          "name": "was_missed",
          "type": "bool",
          "note": "ground truth to calibrate the warning"
        },
        {
          "name": "multiple_at_time",
          "type": "bool"
        }
      ]
    },
    {
      "name": "Financials",
      "layer": "silver",
      "phase": "Medium",
      "grain": "one row per company per period",
      "key_rule": "company_id + period",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "period",
          "type": "text"
        },
        {
          "name": "free_cash_after_commitments",
          "type": "numeric"
        }
      ]
    },
    {
      "name": "BusinessLifecycle",
      "layer": "silver",
      "phase": "Later",
      "grain": "one row per company per period",
      "key_rule": "company_id + period",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "period",
          "type": "text"
        },
        {
          "name": "forecast_inflows_usd",
          "type": "numeric"
        }
      ]
    },
    {
      "name": "ExternalForecast",
      "layer": "silver",
      "phase": "Later",
      "grain": "one row per as-of date",
      "key_rule": "as_of",
      "fields": [
        {
          "name": "as_of",
          "type": "date",
          "key": "PK"
        },
        {
          "name": "rate_curve_bps",
          "type": "numeric"
        },
        {
          "name": "input_cost_index",
          "type": "numeric"
        }
      ]
    },
    {
      "name": "CompanySnapshot",
      "layer": "gold",
      "phase": "Now",
      "golden": true,
      "grain": "one row per company per refresh",
      "key_rule": "company_id + refresh_ts",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "refresh_ts",
          "type": "date"
        },
        {
          "name": "total_cash_usd",
          "type": "numeric"
        },
        {
          "name": "transferable_cash_usd",
          "type": "numeric",
          "metric": "M1"
        },
        {
          "name": "trapped_cash_usd",
          "type": "numeric"
        },
        {
          "name": "burn_per_day_usd",
          "type": "numeric",
          "metric": "M2"
        },
        {
          "name": "runway_days",
          "type": "numeric",
          "metric": "M2"
        },
        {
          "name": "projected_transferable_t1",
          "type": "numeric",
          "metric": "M3"
        },
        {
          "name": "cash_to_repay_t1",
          "type": "numeric"
        },
        {
          "name": "next_payment_date",
          "type": "date"
        },
        {
          "name": "coverage_ratio",
          "type": "numeric",
          "note": "the signal"
        },
        {
          "name": "deteriorating",
          "type": "bool"
        },
        {
          "name": "prior_issue_count",
          "type": "int"
        },
        {
          "name": "principal_at_risk",
          "type": "numeric"
        },
        {
          "name": "ew_label",
          "type": "text",
          "note": "High | Medium | Low | None"
        },
        {
          "name": "data_freshness_days",
          "type": "numeric",
          "note": "stale feed is itself a risk flag"
        }
      ]
    },
    {
      "name": "MetricLineage",
      "layer": "gold",
      "phase": "Now",
      "grain": "one row per gold number per source row",
      "key_rule": "surrogate",
      "fields": [
        {
          "name": "snapshot_id",
          "type": "bigint",
          "key": "FK"
        },
        {
          "name": "metric",
          "type": "text"
        },
        {
          "name": "bronze_table",
          "type": "text"
        },
        {
          "name": "bronze_row_id",
          "type": "bigint",
          "note": "every gold number drills to its raw rows"
        }
      ]
    },
    {
      "name": "ActionLog",
      "layer": "app",
      "phase": "Now",
      "grain": "one row per action taken",
      "key_rule": "surrogate",
      "fields": [
        {
          "name": "company_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "loan_id",
          "type": "text",
          "key": "FK"
        },
        {
          "name": "action_date",
          "type": "timestamptz"
        },
        {
          "name": "priority_quadrant",
          "type": "text",
          "note": "P1 | P2 | P3 | P4"
        },
        {
          "name": "action_taken",
          "type": "text"
        },
        {
          "name": "outcome",
          "type": "text"
        },
        {
          "name": "actor",
          "type": "text"
        }
      ]
    },
    {
      "name": "fx_rate",
      "layer": "ref",
      "phase": "Now",
      "grain": "one row per currency per date",
      "key_rule": "currency + rate_date",
      "fields": [
        {
          "name": "currency",
          "type": "text"
        },
        {
          "name": "rate_date",
          "type": "date"
        },
        {
          "name": "rate_to_usd",
          "type": "numeric"
        }
      ]
    },
    {
      "name": "convertibility",
      "layer": "ref",
      "phase": "Now",
      "grain": "one row per currency",
      "key_rule": "currency",
      "fields": [
        {
          "name": "currency",
          "type": "text",
          "key": "PK"
        },
        {
          "name": "class",
          "type": "text",
          "note": "transferable | partial | restricted"
        },
        {
          "name": "source",
          "type": "text",
          "note": "IMF AREAER (de-facto restrictions)"
        }
      ]
    }
  ],
  "standardisation": [
    {
      "step": 1,
      "name": "Parse & type",
      "applies_to": [
        "bank_balance",
        "crm_loan",
        "payment_schedule",
        "missed_payment"
      ],
      "from": "text columns as received",
      "to": "typed numerics / dates",
      "rule": "Numeric strings -> numbers; mixed date formats (e.g. '07/05/2026 13:55') -> dates; trim whitespace.",
      "why": "Raw exports are all-text and inconsistent; everything downstream needs real types."
    },
    {
      "step": 2,
      "name": "Resolve account ID (NBFI rule)",
      "applies_to": [
        "bank_balance"
      ],
      "from": "Unique account identifier (often null)",
      "to": "account_key",
      "rule": "account_key = COALESCE(native id, 'NBFI:'||FI||':'||country||':'||currency). Null IDs are non-bank FIs with no account number.",
      "why": "17 of 62 rows (28% of all cash = $2.57M) have no native ID; without a synthesized key they are invisible. FI+country alone collides (FI-2C7313E6/Nigeria x4), so currency is added to make it unique.",
      "example": "null + FI-2C7313E6 + Nigeria + NGN  ->  NBFI:FI-2C7313E6:Nigeria:NGN"
    },
    {
      "step": 3,
      "name": "De-duplicate",
      "applies_to": [
        "bank_balance"
      ],
      "from": "rows with a repeated account id",
      "to": "one position per account_key per snapshot",
      "rule": "Same account_key appearing twice in a snapshot (e.g. ACC-E144BBED across two institutions) is flagged; indistinguishable NBFI rows at the same FI+country+currency are aggregated.",
      "why": "Double-counting cash would understate risk."
    },
    {
      "step": 4,
      "name": "Re-derive USD from FX",
      "applies_to": [
        "bank_balance"
      ],
      "from": "LCY Value (+ untrusted source USD column)",
      "to": "balance_usd",
      "rule": "balance_usd = balance_lcy * ref.fx_rate(currency, snapshot_date). The source's own USD column is never trusted.",
      "why": "A single controlled FX source keeps every company comparable and auditable."
    },
    {
      "step": 5,
      "name": "Tag convertibility",
      "applies_to": [
        "bank_balance"
      ],
      "from": "currency",
      "to": "convertibility_class",
      "rule": "currency -> {transferable, partial, restricted} via ref.convertibility (IMF AREAER).",
      "why": "$9.31M total looks fine, but only the transferable class ($796K, hard ccy) can actually service hard-currency debt. This split is the whole point."
    },
    {
      "step": 6,
      "name": "Validate & quarantine + freshness",
      "applies_to": [
        "bank_balance",
        "crm_loan",
        "payment_schedule"
      ],
      "from": "canonical rows",
      "to": "clean rows + silver.validation_quarantine",
      "rule": "Malformed / orphan / future-dated rows are held aside (not dropped); per-account freshness = now - last_updated.",
      "why": "Honest by construction: bad rows are visible, not silently lost; a stale feed is itself a risk flag."
    },
    {
      "step": 7,
      "name": "Resolve company",
      "applies_to": [
        "bank_balance",
        "crm_loan"
      ],
      "from": "account / loan",
      "to": "company_id link",
      "rule": "Accounts and loans are mapped to the resolved company_id (the spine).",
      "why": "Everything in the golden model is per-company; the link must exist before Gold can aggregate."
    }
  ],
  "actions_framework": [
    {
      "priority": "P1",
      "name": "Roll up sleeves",
      "when": "high principal at risk + recoverable",
      "posture": "Intensive, hands-on; protect the most money where action can still change the outcome."
    },
    {
      "priority": "P2",
      "name": "Structured workout",
      "when": "high principal + lower recoverability",
      "posture": "Formal process: 13-week cashflow, covenant review, prepare options."
    },
    {
      "priority": "P3",
      "name": "Lightweight nudge",
      "when": "low principal + recoverable",
      "posture": "Cheap touch: request updated forecast, tighten cadence."
    },
    {
      "priority": "P4",
      "name": "Handle leanly",
      "when": "low principal + low recoverability",
      "posture": "Monitor with minimal effort; (Later) automate standard reversible actions."
    }
  ],
  "portfolio": [
    {
      "company_id": "C-SAHEL",
      "name": "Sahel AgriCorp",
      "jurisdiction": "Cameroon",
      "label": "High",
      "coverage": 0.46,
      "total_cash_usd": 9311675,
      "transferable_cash_usd": 324857,
      "trapped_cash_usd": 8986818,
      "runway_days": 38,
      "deteriorating": true,
      "prior_issues": 1,
      "data_freshness_days": 0,
      "worst_serviced_coverage": 0.8,
      "loan": {
        "loan_id": "LN-SAHEL-1",
        "principal": 6000000,
        "seniority": "Senior secured",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-15",
        "cash_to_repay_t1": 700000
      },
      "recoverability": {
        "label": "Partial",
        "score": 0.55,
        "savable_usd": 3300000,
        "read": "Senior secured and the cash is trapped, not gone — recoverable if EUR convertibility or a bridge is restored before T1. A sweep problem, not insolvency."
      },
      "forecast": {
        "coverage_t1": 0.41,
        "coverage_t1_worst": 0.18,
        "coverage_t1_best": 0.6,
        "lead_days": 0,
        "status": "breached",
        "drivers": "EUR sweep · 12% cash coupon",
        "read": "FX unresolved — modelled cash at T1 stays ~0.41; the secured workout path is the lever."
      },
      "principal_at_risk": 6000000,
      "contact": {
        "name": "Amina Bello",
        "role": "Treasurer",
        "email": "a.bello@sahelagricorp.cm"
      },
      "action": {
        "priority": "P1",
        "title": "Roll up sleeves — protect the coupon",
        "why": "Largest exposure; the shortfall is an FX/sweep problem that is still fixable before T1.",
        "steps": [
          "Call treasurer: why did the EUR operating account drop to zero?",
          "Arrange FX conversion or a short bridge to fund the $700K due",
          "Confirm the coupon funding source in writing before 2026-07-15"
        ]
      },
      "is_worked_example": true
    },
    {
      "company_id": "C-LAGOS",
      "name": "Lagos FinServe",
      "jurisdiction": "Nigeria",
      "label": "High",
      "coverage": 0.71,
      "total_cash_usd": 4200000,
      "transferable_cash_usd": 510000,
      "trapped_cash_usd": 3690000,
      "runway_days": 52,
      "deteriorating": true,
      "prior_issues": 2,
      "data_freshness_days": 1,
      "worst_serviced_coverage": 0.74,
      "loan": {
        "loan_id": "LN-LAGOS-1",
        "principal": 3200000,
        "seniority": "Senior",
        "coupon_rate": 0.14,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-20",
        "cash_to_repay_t1": 720000
      },
      "recoverability": {
        "label": "Weak",
        "score": 0.3,
        "savable_usd": 960000,
        "read": "Two prior misses plus restricted NGN — a structural convertibility gap, so only a fraction of the exposure looks recoverable."
      },
      "forecast": {
        "coverage_t1": 0.63,
        "coverage_t1_worst": 0.4,
        "coverage_t1_best": 0.78,
        "lead_days": 0,
        "status": "breached",
        "drivers": "NGN restriction · 14% floating coupon",
        "read": "Convertibility gap widens at T1 and the floating coupon adds pressure — modelled ~0.63."
      },
      "principal_at_risk": 3200000,
      "contact": {
        "name": "Chukwudi Okafor",
        "role": "CFO",
        "email": "c.okafor@lagosfinserve.ng"
      },
      "action": {
        "priority": "P1",
        "title": "Roll up sleeves — confirm NGN convertibility",
        "why": "Two prior misses + high principal; NGN is restricted so the headline cash overstates capacity.",
        "steps": [
          "Confirm how much NGN can actually be converted this week",
          "Request a cash bridge from the sponsor",
          "Escalate to the deal lead"
        ]
      }
    },
    {
      "company_id": "C-DAR",
      "name": "Dar Telecom",
      "jurisdiction": "Tanzania",
      "label": "Medium",
      "coverage": 0.98,
      "total_cash_usd": 5100000,
      "transferable_cash_usd": 880000,
      "trapped_cash_usd": 4220000,
      "runway_days": 70,
      "deteriorating": true,
      "prior_issues": 0,
      "data_freshness_days": 2,
      "worst_serviced_coverage": 0.9,
      "loan": {
        "loan_id": "LN-DAR-1",
        "principal": 4500000,
        "seniority": "Senior secured",
        "coupon_rate": 0.11,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-01",
        "cash_to_repay_t1": 900000
      },
      "recoverability": {
        "label": "Partial",
        "score": 0.6,
        "savable_usd": 1320000,
        "read": "At the line on a large secured balance; a 13-week cashflow will confirm whether the gap is timing or structural."
      },
      "forecast": {
        "coverage_t1": 0.92,
        "coverage_t1_worst": 0.7,
        "coverage_t1_best": 1.02,
        "lead_days": 0,
        "status": "breached",
        "drivers": "energy input cost · receivables timing",
        "read": "Modelled cash slips under 1.0 at T1 once energy costs are layered in — prepare workout options now."
      },
      "principal_at_risk": 2200000,
      "contact": {
        "name": "Joseph Mwanga",
        "role": "CFO",
        "email": "j.mwanga@dartelecom.tz"
      },
      "action": {
        "priority": "P2",
        "title": "Structured workout prep",
        "why": "Coverage hovering at 1.0 on a large balance; trend is down.",
        "steps": [
          "Request a 13-week cashflow",
          "Review covenants",
          "Prepare options ahead of T1"
        ]
      }
    },
    {
      "company_id": "C-NAIROBI",
      "name": "Nairobi Logistics",
      "jurisdiction": "Kenya",
      "label": "Medium",
      "coverage": 1.05,
      "total_cash_usd": 1500000,
      "transferable_cash_usd": 420000,
      "trapped_cash_usd": 1080000,
      "runway_days": 61,
      "deteriorating": true,
      "prior_issues": 0,
      "data_freshness_days": 1,
      "worst_serviced_coverage": 0.95,
      "loan": {
        "loan_id": "LN-NAIROBI-1",
        "principal": 1800000,
        "seniority": "Senior",
        "coupon_rate": 0.13,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-28",
        "cash_to_repay_t1": 400000
      },
      "recoverability": {
        "label": "Strong",
        "score": 0.78,
        "savable_usd": 700000,
        "read": "A receivables-timing wobble, not a structural hole — collections are expected to close most of the gap."
      },
      "forecast": {
        "coverage_t1": 0.97,
        "coverage_t1_worst": 0.82,
        "coverage_t1_best": 1.08,
        "lead_days": 18,
        "status": "pre-breach",
        "drivers": "receivables timing slips",
        "read": "Spot coverage 1.05 looks safe, but modelled cash at T1 dips to 0.97 if receivables slip — ~18 days of lead time to act."
      },
      "principal_at_risk": 900000,
      "contact": {
        "name": "Grace Wanjiku",
        "role": "CFO",
        "email": "g.wanjiku@nairobilogistics.ke"
      },
      "action": {
        "priority": "P2",
        "title": "Structured — tighten reporting",
        "why": "Coverage thinning; receivables timing is the swing factor.",
        "steps": [
          "Confirm receivables collection timing",
          "Move to weekly cash reporting"
        ]
      }
    },
    {
      "company_id": "C-KAMPALA",
      "name": "Kampala Power",
      "jurisdiction": "Uganda",
      "label": "Low",
      "coverage": 1.3,
      "total_cash_usd": 900000,
      "transferable_cash_usd": 260000,
      "trapped_cash_usd": 640000,
      "runway_days": 95,
      "deteriorating": false,
      "prior_issues": 0,
      "data_freshness_days": 2,
      "worst_serviced_coverage": 1.05,
      "loan": {
        "loan_id": "LN-KAMPALA-1",
        "principal": 900000,
        "seniority": "Senior",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-10",
        "cash_to_repay_t1": 200000
      },
      "recoverability": {
        "label": "Strong",
        "score": 0.88,
        "savable_usd": 158000,
        "read": "Comfortable coverage on a small exposure with healthy operations."
      },
      "forecast": {
        "coverage_t1": 1.24,
        "coverage_t1_worst": 1.05,
        "coverage_t1_best": 1.35,
        "lead_days": 0,
        "status": "clear",
        "drivers": "stable",
        "read": "Holds above the high-risk line through T1."
      },
      "principal_at_risk": 180000,
      "contact": {
        "name": "Robert Kato",
        "role": "CFO",
        "email": "r.kato@kampalapower.ug"
      },
      "action": {
        "priority": "P3",
        "title": "Lightweight nudge",
        "why": "Comfortable but small; cheap to keep an eye on.",
        "steps": [
          "Email CFO for an updated forecast"
        ]
      }
    },
    {
      "company_id": "C-ACCRA",
      "name": "Accra Retail",
      "jurisdiction": "Ghana",
      "label": "Low",
      "coverage": 2.1,
      "total_cash_usd": 700000,
      "transferable_cash_usd": 300000,
      "trapped_cash_usd": 400000,
      "runway_days": 140,
      "deteriorating": false,
      "prior_issues": 0,
      "data_freshness_days": 6,
      "worst_serviced_coverage": 1.2,
      "loan": {
        "loan_id": "LN-ACCRA-1",
        "principal": 600000,
        "seniority": "Senior",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-15",
        "cash_to_repay_t1": 140000
      },
      "recoverability": {
        "label": "Strong",
        "score": 0.92,
        "savable_usd": 0,
        "read": "Healthy coverage; no principal currently at risk."
      },
      "forecast": {
        "coverage_t1": 2.0,
        "coverage_t1_worst": 1.7,
        "coverage_t1_best": 2.2,
        "lead_days": 0,
        "status": "clear",
        "drivers": "stable",
        "read": "Comfortable through T1."
      },
      "principal_at_risk": 0,
      "contact": {
        "name": "Kwame Asante",
        "role": "CFO",
        "email": "k.asante@accraretail.gh"
      },
      "action": {
        "priority": "P3",
        "title": "Standard monitoring",
        "why": "Healthy coverage, low principal.",
        "steps": [
          "Monthly check-in only"
        ]
      }
    },
    {
      "company_id": "C-KIGALI",
      "name": "Kigali Agro",
      "jurisdiction": "Rwanda",
      "label": "None",
      "coverage": 3.0,
      "total_cash_usd": 1200000,
      "transferable_cash_usd": 480000,
      "trapped_cash_usd": 720000,
      "runway_days": 210,
      "deteriorating": false,
      "prior_issues": 0,
      "data_freshness_days": 1,
      "worst_serviced_coverage": 1.1,
      "loan": {
        "loan_id": "LN-KIGALI-1",
        "principal": 1200000,
        "seniority": "Senior",
        "coupon_rate": 0.1,
        "cash_vs_pik": "pik",
        "next_payment_date": "2026-09-01",
        "cash_to_repay_t1": 0
      },
      "recoverability": {
        "label": "Strong",
        "score": 0.95,
        "savable_usd": 0,
        "read": "Next payment is PIK — no cash due, so there is nothing to recover."
      },
      "forecast": {
        "coverage_t1": 2.9,
        "coverage_t1_worst": 2.7,
        "coverage_t1_best": 3.05,
        "lead_days": 0,
        "status": "clear",
        "drivers": "PIK · no cash due",
        "read": "No cash leaves the borrower at T1."
      },
      "principal_at_risk": 0,
      "contact": {
        "name": "Diane Uwimana",
        "role": "Company Secretary",
        "email": "d.uwimana@kigaliagro.rw"
      },
      "action": {
        "priority": "P4",
        "title": "Handle leanly",
        "why": "Next payment is PIK — no cash due. Automated monitoring is enough.",
        "steps": [
          "Automated monitoring only"
        ]
      }
    },
    {
      "company_id": "C-CASA",
      "name": "Casablanca Foods",
      "jurisdiction": "Morocco",
      "label": "None",
      "coverage": 4.2,
      "total_cash_usd": 2000000,
      "transferable_cash_usd": 1500000,
      "trapped_cash_usd": 500000,
      "runway_days": 320,
      "deteriorating": false,
      "prior_issues": 0,
      "data_freshness_days": 0,
      "worst_serviced_coverage": 1.4,
      "loan": {
        "loan_id": "LN-CASA-1",
        "principal": 2000000,
        "seniority": "Senior secured",
        "coupon_rate": 0.09,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-09-05",
        "cash_to_repay_t1": 300000
      },
      "recoverability": {
        "label": "Strong",
        "score": 0.96,
        "savable_usd": 0,
        "read": "Strong coverage, mostly hard-currency cash."
      },
      "forecast": {
        "coverage_t1": 4.1,
        "coverage_t1_worst": 3.7,
        "coverage_t1_best": 4.4,
        "lead_days": 0,
        "status": "clear",
        "drivers": "stable",
        "read": "Comfortable; mostly hard-currency cash."
      },
      "principal_at_risk": 0,
      "contact": {
        "name": "Youssef El Fassi",
        "role": "CFO",
        "email": "y.elfassi@casablancafoods.ma"
      },
      "action": {
        "priority": "P4",
        "title": "Handle leanly",
        "why": "Strong coverage, mostly hard-currency cash.",
        "steps": [
          "Automated monitoring only"
        ]
      }
    }
  ],
  "lifecycle": {
    "scenarios": [
      {
        "id": "bank_file",
        "short_title": "Bank file → Coverage warning",
        "title": "A new bank file turns into a warning, an action, and an updated database",
        "company_id": "C-SAHEL",
        "company_name": "Sahel AgriCorp",
        "subtitle": "Honest by construction: the only thing that changed in the new file is the EUR operating account dropping to $0 — every downstream number follows from that.",
        "before": {
          "refresh_ts": "2026-07-01",
          "total_cash_usd": 9311675,
          "transferable_cash_usd": 795714,
          "trapped_cash_usd": 8515961,
          "cash_to_repay_t1": 700000,
          "coverage_ratio": 1.14,
          "ew_label": "Low",
          "deteriorating": false
        },
        "new_file": {
          "file_name": "bank_export_2026-07-08.xlsx",
          "ingested_at": "2026-07-08T08:00:00Z",
          "source": "hourly bank feed (Excel)",
          "change": "The EUR operating account at FI-EA354EF2 (~$471K, the largest transferable balance) now reads 0 — swept to an offshore parent / FX-blocked.",
          "raw_rows": 62
        },
        "after": {
          "refresh_ts": "2026-07-08",
          "total_cash_usd": 8840818,
          "transferable_cash_usd": 324857,
          "trapped_cash_usd": 8515961,
          "cash_to_repay_t1": 700000,
          "coverage_ratio": 0.46,
          "ew_label": "High",
          "deteriorating": true
        },
        "steps": [
          {
            "layer": "source",
            "title": "New file lands",
            "detail": "bank_export_2026-07-08.xlsx arrives (62 rows). The hourly feed shows the EUR operating account at $0.",
            "db_changes": [
              "+1 bronze.source_file",
              "+62 bronze.bank_balance_raw rows (immutable)"
            ]
          },
          {
            "layer": "standardisation",
            "title": "Standardise raw → canonical",
            "detail": "Parse types; resolve account_key (NBFI rule); de-dup; re-derive USD from FX; tag convertibility; validate + freshness.",
            "db_changes": [
              "account_key synthesized for null-ID rows",
              "EUR row tagged convertibility=transferable, balance now $0",
              "rows with issues → validation_quarantine"
            ]
          },
          {
            "layer": "silver",
            "title": "Update canonical entities",
            "detail": "silver.account refreshed for snapshot 2026-07-08; the EUR transferable balance drops $471K → $0.",
            "db_changes": [
              "~62 silver.account rows upserted for the new snapshot"
            ]
          },
          {
            "layer": "gold",
            "title": "Recompute the golden model",
            "detail": "M1 transferable cash = $324,857 (was $795,714). cash_to_repay_t1 = $700,000. coverage = 0.46. Label flips Low → High.",
            "db_changes": [
              "+1 gold.company_snapshot (coverage 0.46, label High)",
              "+N gold.metric_lineage rows linking each number to its bronze rows"
            ]
          },
          {
            "layer": "warning",
            "title": "Warning fires + digest",
            "detail": "Sahel AgriCorp moves to High (coverage < 1.0, principal at risk $6.0M). It enters the 8am digest as a changed-status company.",
            "db_changes": [
              "+1 app.digest entry (changed-status, ranked by principal at risk)"
            ]
          },
          {
            "layer": "action",
            "title": "Credit team acts & records",
            "detail": "Specialist opens the row, drills the $324,857 to the raw EUR row, and logs a P1 action: contact treasurer, arrange FX/bridge, confirm coupon source.",
            "db_changes": [
              "+1 app.action_log (P1, actor=credit-team, outcome pending)"
            ]
          },
          {
            "layer": "gold",
            "title": "Updated database state",
            "detail": "The portfolio now ranks Sahel AgriCorp #1 by principal at risk with an open P1 action attached. Every number still drills back to the 2026-07-08 raw file.",
            "db_changes": [
              "gold reflects the new High snapshot",
              "action_log shows the open P1",
              "lineage intact end-to-end"
            ]
          }
        ],
        "warning": {
          "pill_label": "High",
          "pill_class": "High",
          "title_text": "Warning fired",
          "reason": "Transferable cash fell 59% ($795,714 → $324,857) after the EUR operating account dropped to $0; projected cash at T1 no longer covers the $700,000 due.",
          "metrics": [
            {
              "value": "0.46",
              "label": "coverage (signal)"
            },
            {
              "value": "$6,000,000",
              "label": "principal at risk"
            }
          ]
        },
        "action": {
          "priority": "P1",
          "action_taken": "Contacted treasurer; arranging FX conversion / bridge to fund the $700K coupon; confirming funding source before 2026-07-15.",
          "actor": "credit-team",
          "outcome": "pending"
        },
        "display": [
          {
            "type": "money",
            "label": "Transferable cash (M1)",
            "before": 795714,
            "after": 324857,
            "delta": "▼ 59%"
          },
          {
            "type": "bar",
            "label": "Coverage ratio — the signal",
            "before": 1.14,
            "after": 0.46,
            "threshold": 1.0,
            "max": 1.5
          },
          {
            "type": "pill",
            "label": "Early-warning label",
            "before": "Low",
            "after": "High"
          },
          {
            "type": "money",
            "label": "Total cash",
            "before": 9311675,
            "after": 8840818
          },
          {
            "type": "money",
            "label": "Cash to repay (T1)",
            "before": 700000,
            "after": 700000,
            "delta": "unchanged",
            "neutral": true
          }
        ]
      },
      {
        "id": "balance_sheet",
        "short_title": "Balance sheet → Recoverability",
        "title": "Quarterly balance sheet data updates the recoverability estimate",
        "company_id": "C-DAR",
        "company_name": "Dar Telecom",
        "subtitle": "New data input: a quarterly balance sheet file reveals structural leverage — the recoverability assessment drops from Partial to Weak even though spot coverage hasn’t changed.",
        "before": {
          "refresh_ts": "2026-06-30",
          "coverage_ratio": 0.98,
          "ew_label": "Medium",
          "recoverability_label": "Partial",
          "recoverability_score": 0.6,
          "savable_usd": 1320000,
          "net_leverage": 2.8,
          "current_ratio": 1.1,
          "free_cash_after_commitments": 120000
        },
        "new_file": {
          "file_name": "balance_sheet_2026-Q2.xlsx",
          "ingested_at": "2026-07-10T09:00:00Z",
          "source": "quarterly upload (finance team)",
          "change": "Dar Telecom’s Q2 balance sheet shows net leverage jumped to 4.2x (was 2.8x), current ratio fell to 0.65 (was 1.1), and free cash after commitments turned negative (−$85K).",
          "raw_rows": 8,
          "raw_file_sample": {
            "columns": [
              "company",
              "period",
              "total_debt_usd",
              "total_equity_usd",
              "net_leverage",
              "current_ratio",
              "quick_ratio",
              "cash_from_ops_usd",
              "debt_service_usd",
              "free_cash_usd"
            ],
            "rows": [
              {
                "company": "Dar Telecom",
                "period": "2026-Q2",
                "total_debt_usd": 8400000,
                "total_equity_usd": 2000000,
                "net_leverage": 4.2,
                "current_ratio": 0.65,
                "quick_ratio": 0.4,
                "cash_from_ops_usd": 315000,
                "debt_service_usd": 400000,
                "free_cash_usd": -85000
              }
            ]
          }
        },
        "after": {
          "refresh_ts": "2026-07-10",
          "coverage_ratio": 0.98,
          "ew_label": "Medium",
          "recoverability_label": "Weak",
          "recoverability_score": 0.3,
          "savable_usd": 660000,
          "net_leverage": 4.2,
          "current_ratio": 0.65,
          "free_cash_after_commitments": -85000
        },
        "steps": [
          {
            "layer": "source",
            "title": "Balance sheet file lands",
            "detail": "balance_sheet_2026-Q2.xlsx arrives (8 rows, one per portfolio company). Quarterly upload via the finance team.",
            "db_changes": [
              "+1 bronze.source_file (balance_sheet)",
              "+8 bronze.balance_sheet_raw rows"
            ]
          },
          {
            "layer": "standardisation",
            "title": "Parse & validate financials",
            "detail": "Parse numeric types; compute net leverage = total_debt / total_equity; derive current and quick ratios; validate free_cash = cash_from_ops − debt_service.",
            "db_changes": [
              "ratios validated: net_leverage, current_ratio, quick_ratio",
              "free_cash cross-checked: $315K ops − $400K service = −$85K",
              "rows with issues → validation_quarantine"
            ]
          },
          {
            "layer": "silver",
            "title": "Update canonical financials",
            "detail": "silver.financials refreshed for period 2026-Q2. Dar Telecom: net leverage 2.8x → 4.2x, current ratio 1.1 → 0.65, free cash $120K → −$85K.",
            "db_changes": [
              "~8 silver.financials rows upserted for 2026-Q2"
            ]
          },
          {
            "layer": "gold",
            "title": "Recoverability model recomputes",
            "detail": "Enhanced recoverability incorporates the balance sheet: high leverage (4.2x) + negative free cash = structural distress signal. Recoverability drops Partial (0.60) → Weak (0.30). Savable USD halves: $1.32M → $660K.",
            "db_changes": [
              "+1 gold.company_snapshot (recoverability Weak, score 0.30)",
              "+N gold.metric_lineage rows linking recoverability to the balance sheet rows"
            ]
          },
          {
            "layer": "warning",
            "title": "Recoverability downgrade flagged",
            "detail": "Dar Telecom’s recoverability drops from Partial to Weak. The portfolio view now shows a structural concern, not just a timing issue. It enters the digest as a changed-recoverability company.",
            "db_changes": [
              "+1 app.digest entry (recoverability downgrade, Dar Telecom)"
            ]
          },
          {
            "layer": "action",
            "title": "Credit team reviews & escalates",
            "detail": "Analyst drills to the Q2 balance sheet (net leverage 4.2x, negative free cash) and escalates: request 13-week cashflow, review covenants, prepare workout options.",
            "db_changes": [
              "+1 app.action_log (P2, actor=credit-team, outcome pending)"
            ]
          },
          {
            "layer": "gold",
            "title": "Updated database state",
            "detail": "Dar Telecom remains Medium by coverage (0.98) but now carries a Weak recoverability flag with an open P2 action. Balance sheet ratios trace back to the 2026-Q2 raw file.",
            "db_changes": [
              "gold reflects Weak recoverability for Dar Telecom",
              "action_log shows the open P2",
              "lineage intact: recoverability → balance_sheet_2026-Q2.xlsx"
            ]
          }
        ],
        "warning": {
          "pill_label": "Weak",
          "pill_class": "High",
          "title_text": "Recoverability downgrade",
          "reason": "Q2 balance sheet shows net leverage jumped to 4.2x (was 2.8x), current ratio fell to 0.65, and free cash after commitments turned negative (−$85K). This signals structural distress — recoverability drops from Partial to Weak.",
          "metrics": [
            {
              "value": "0.30",
              "label": "recoverability score"
            },
            {
              "value": "$660,000",
              "label": "savable USD"
            }
          ]
        },
        "action": {
          "priority": "P2",
          "action_taken": "Escalated: requesting 13-week cashflow; reviewing covenants; preparing workout options ahead of T1.",
          "actor": "credit-team",
          "outcome": "pending"
        },
        "display": [
          {
            "type": "ratio",
            "label": "Net leverage",
            "before": 2.8,
            "after": 4.2,
            "delta": "▲ 50%",
            "suffix": "x"
          },
          {
            "type": "ratio",
            "label": "Current ratio",
            "before": 1.1,
            "after": 0.65,
            "delta": "▼ 41%"
          },
          {
            "type": "money",
            "label": "Free cash after commitments",
            "before": 120000,
            "after": -85000,
            "delta": "turned negative"
          },
          {
            "type": "bar",
            "label": "Recoverability score",
            "before": 0.6,
            "after": 0.3,
            "threshold": 0.5,
            "max": 1.0
          },
          {
            "type": "pill",
            "label": "Recoverability",
            "before": "Partial",
            "after": "Weak"
          },
          {
            "type": "ratio",
            "label": "Coverage ratio (spot)",
            "before": 0.98,
            "after": 0.98,
            "delta": "unchanged",
            "neutral": true
          },
          {
            "type": "money",
            "label": "Savable USD",
            "before": 1320000,
            "after": 660000,
            "delta": "▼ 50%"
          }
        ]
      },
      {
        "id": "subscriptions",
        "short_title": "Salesforce → Coverage forecast",
        "title": "Two new subscriptions from a Salesforce connection update the coverage estimate",
        "company_id": "C-NAIROBI",
        "company_name": "Nairobi Logistics",
        "subtitle": "New data input: two contracted subscriptions from a Salesforce CRM integration add $175K in projected inflows — the coverage forecast at T1 lifts from pre-breach to clear.",
        "before": {
          "refresh_ts": "2026-07-08",
          "transferable_cash_usd": 420000,
          "cash_to_repay_t1": 400000,
          "projected_inflows_t1": 0,
          "projected_transferable_t1": 388000,
          "forecast_coverage_t1": 0.97,
          "forecast_status": "pre-breach",
          "coverage_ratio": 1.05,
          "ew_label": "Medium"
        },
        "new_file": {
          "file_name": "salesforce_subscriptions_sync",
          "ingested_at": "2026-07-11T14:30:00Z",
          "source": "Salesforce CRM integration (webhook)",
          "change": "Two new subscription contracts for Nairobi Logistics (Kenya): KLM Corp ($95K, 12-month) and TransKenya Ltd ($80K, 6-month). Total contracted inflows: $175K.",
          "raw_rows": 2,
          "raw_file_sample": {
            "columns": [
              "subscription_id",
              "company",
              "customer",
              "country",
              "value_usd",
              "term_mo",
              "start_date",
              "status"
            ],
            "rows": [
              {
                "subscription_id": "SUB-NBO-0047",
                "company": "Nairobi Logistics",
                "customer": "KLM Corp",
                "country": "Kenya",
                "value_usd": 95000,
                "term_mo": 12,
                "start_date": "2026-07-15",
                "status": "contracted"
              },
              {
                "subscription_id": "SUB-NBO-0048",
                "company": "Nairobi Logistics",
                "customer": "TransKenya Ltd",
                "country": "Kenya",
                "value_usd": 80000,
                "term_mo": 6,
                "start_date": "2026-08-01",
                "status": "contracted"
              }
            ]
          }
        },
        "after": {
          "refresh_ts": "2026-07-11",
          "transferable_cash_usd": 420000,
          "cash_to_repay_t1": 400000,
          "projected_inflows_t1": 175000,
          "projected_transferable_t1": 560000,
          "forecast_coverage_t1": 1.4,
          "forecast_status": "clear",
          "coverage_ratio": 1.05,
          "ew_label": "Medium"
        },
        "steps": [
          {
            "layer": "source",
            "title": "Salesforce webhook fires",
            "detail": "Salesforce CRM delivers 2 new subscription records for Nairobi Logistics (Kenya): SUB-NBO-0047 (KLM Corp, $95K/12mo) and SUB-NBO-0048 (TransKenya Ltd, $80K/6mo).",
            "db_changes": [
              "+1 bronze.source_file (Salesforce sync)",
              "+2 bronze.subscription_raw rows"
            ]
          },
          {
            "layer": "standardisation",
            "title": "Parse subscription terms",
            "detail": "Validate contract terms; compute monthly revenue ($7,917 + $13,333); map company to Nairobi Logistics (C-NAIROBI, Kenya); confirm both start dates fall before T1 (2026-07-28).",
            "db_changes": [
              "subscription terms validated (value, term, start)",
              "company resolved: Nairobi Logistics (C-NAIROBI)",
              "monthly_revenue_usd derived from value / term"
            ]
          },
          {
            "layer": "silver",
            "title": "Update business lifecycle",
            "detail": "silver.business_lifecycle updated: Nairobi Logistics gains $175K in contracted future inflows (2 subscriptions). Booked as forecast_inflows_usd for the period covering T1.",
            "db_changes": [
              "+2 silver.business_lifecycle rows (contracted subscriptions)",
              "forecast_inflows_usd += $175,000 for Nairobi Logistics"
            ]
          },
          {
            "layer": "gold",
            "title": "Coverage forecast recomputes",
            "detail": "M3 projected transferable cash at T1 rises: $388K trend + $175K contracted (with haircut) = $560K. Forecast coverage: $560K / $400K = 1.40 (was 0.97). Status flips pre-breach → clear.",
            "db_changes": [
              "+1 gold.company_snapshot (forecast_coverage_t1 1.40, status clear)",
              "+N gold.metric_lineage rows linking inflows to the Salesforce rows"
            ]
          },
          {
            "layer": "warning",
            "title": "Pre-breach signal cleared",
            "detail": "Nairobi Logistics was flagged pre-breach (forecast 0.97). The new subscriptions lift the forecast to 1.40 — comfortably above 1.0. The pre-breach flag is removed from the digest.",
            "db_changes": [
              "+1 app.digest entry (pre-breach cleared, Nairobi Logistics)"
            ]
          },
          {
            "layer": "action",
            "title": "Credit team notes improvement",
            "detail": "Analyst confirms the subscription data (2 contracts from Salesforce: KLM Corp + TransKenya) and logs a P3 note: standard monitoring sufficient, no escalation needed.",
            "db_changes": [
              "+1 app.action_log (P3, actor=credit-team, outcome resolved)"
            ]
          },
          {
            "layer": "gold",
            "title": "Updated database state",
            "detail": "Nairobi Logistics coverage forecast improves from 0.97 (pre-breach) to 1.40 (clear). The P2 action is downgraded to P3 standard monitoring. Every number traces to the Salesforce subscription records.",
            "db_changes": [
              "gold reflects forecast_coverage_t1 = 1.40 (clear)",
              "action_log shows resolved P3",
              "lineage intact: forecast → salesforce_subscriptions_sync"
            ]
          }
        ],
        "warning": {
          "pill_label": "Clear",
          "pill_class": "Low",
          "title_text": "Pre-breach signal cleared",
          "reason": "Two new Salesforce subscriptions ($95K + $80K = $175K contracted inflows) lift projected transferable cash at T1 to $560K. Coverage forecast improves from 0.97 (pre-breach) to 1.40 (clear).",
          "metrics": [
            {
              "value": "1.40",
              "label": "forecast coverage (T1)"
            },
            {
              "value": "$175,000",
              "label": "contracted inflows"
            }
          ]
        },
        "action": {
          "priority": "P3",
          "action_taken": "Pre-breach resolved; downgraded to standard monitoring. Confirmed 2 contracted subscriptions via Salesforce.",
          "actor": "credit-team",
          "outcome": "resolved"
        },
        "display": [
          {
            "type": "money",
            "label": "Projected inflows (T1)",
            "before": 0,
            "after": 175000,
            "delta": "+$175K"
          },
          {
            "type": "money",
            "label": "Projected transferable (T1)",
            "before": 388000,
            "after": 560000,
            "delta": "▲ 44%"
          },
          {
            "type": "bar",
            "label": "Forecast coverage at T1",
            "before": 0.97,
            "after": 1.4,
            "threshold": 1.0,
            "max": 2.0
          },
          {
            "type": "pill",
            "label": "Forecast status",
            "before": "pre-breach",
            "after": "clear"
          },
          {
            "type": "ratio",
            "label": "Coverage (spot)",
            "before": 1.05,
            "after": 1.05,
            "delta": "unchanged",
            "neutral": true
          },
          {
            "type": "money",
            "label": "Cash to repay (T1)",
            "before": 400000,
            "after": 400000,
            "delta": "unchanged",
            "neutral": true
          }
        ]
      }
    ]
  },
  "evidence": {
    "intro": "Every metric traces back to a raw source file. Synthetic data only; the bank export mirrors the numeric distribution of the provided real file.",
    "files": [
      {
        "id": "f_bank",
        "file": "bank_export_2026-07-08.xlsx",
        "type": "Bank balance export (Excel)",
        "horizon": "Now",
        "as_at": "2026-07-08",
        "grain": "one row per account per snapshot",
        "rows": 62,
        "feeds": [
          "M1",
          "M2",
          "M3",
          "coverage ratio",
          "transferable vs trapped",
          "runway days",
          "data freshness",
          "worst-serviced floor"
        ],
        "sample": "62 accounts · 22 currencies · $9.31M total; EUR operating account FI-EA354EF2 reads $0; only $796K (hard ccy) transferable."
      },
      {
        "id": "f_crm",
        "file": "crm_loans_2026-07-05.csv",
        "type": "CRM loan structure",
        "horizon": "Now",
        "as_at": "2026-07-05",
        "grain": "one row per loan",
        "rows": 8,
        "feeds": [
          "M4",
          "M5",
          "principal at risk",
          "cash vs PIK",
          "next payment",
          "seniority / security",
          "recoverability (first-pass)"
        ],
        "sample": "LN-SAHEL-1 · $6.0M senior secured · 12% cash coupon · next 2026-07-15 · $700K due."
      },
      {
        "id": "f_pay",
        "file": "payment_schedule_2026-07-05.csv",
        "type": "Payment schedule",
        "horizon": "Now",
        "as_at": "2026-07-05",
        "grain": "one row per loan per payment",
        "rows": 24,
        "feeds": [
          "cash to repay at T1",
          "next payment"
        ],
        "sample": "LN-SAHEL-1 · 2026-07-15 · $700,000 · cash."
      },
      {
        "id": "f_labels",
        "file": "missed_payments.csv",
        "type": "Missed-payment history (labels)",
        "horizon": "Now",
        "as_at": "2026-06-30",
        "grain": "one row per labelled event",
        "rows": 5,
        "feeds": [
          "prior issues",
          "recoverability (first-pass)"
        ],
        "sample": "Lagos FinServe: 2 prior misses; Sahel AgriCorp: 1."
      },
      {
        "id": "f_fx",
        "file": "fx_rates_2026-07-08.csv",
        "type": "FX reference (controlled)",
        "horizon": "Now",
        "as_at": "2026-07-08",
        "grain": "one row per currency per date",
        "rows": 22,
        "feeds": [
          "balance_usd (re-derived)",
          "M1",
          "coverage ratio"
        ],
        "sample": "EUR/XAF/NGN … → USD. The single source of truth for USD — the export's own USD column is never trusted."
      },
      {
        "id": "f_convert",
        "file": "convertibility_areaer.csv",
        "type": "Convertibility reference (IMF AREAER)",
        "horizon": "Now",
        "as_at": "2026-Q2",
        "grain": "one row per currency",
        "rows": 22,
        "feeds": [
          "transferable vs trapped",
          "recoverability (first-pass)"
        ],
        "sample": "USD/EUR/GBP = transferable; XAF/TZS/NGN/KES/UGX = restricted."
      },
      {
        "id": "f_bs",
        "file": "balance_sheet_2026-06.csv",
        "type": "Balance sheet",
        "horizon": "Medium",
        "as_at": "2026-06-30",
        "grain": "one row per company per period",
        "rows": 8,
        "feeds": [
          "recoverability (enhanced)",
          "leverage / liquidity"
        ],
        "sample": "Net leverage and current/quick ratios per company."
      },
      {
        "id": "f_cfs",
        "file": "cashflow_2026-06.csv",
        "type": "Cashflow statement",
        "horizon": "Medium",
        "as_at": "2026-06-30",
        "grain": "one row per company per period",
        "rows": 8,
        "feeds": [
          "recoverability (enhanced)",
          "burn quality (CFS)",
          "free cash after commitments",
          "M6"
        ],
        "sample": "Cash from ops, mandatory debt service, free cash after commitments."
      },
      {
        "id": "f_lifecycle",
        "file": "revenue_lifecycle_2026-06.csv",
        "type": "Business-lifecycle / revenue",
        "horizon": "Later",
        "as_at": "2026-06-30",
        "grain": "one row per company per period",
        "rows": 8,
        "feeds": [
          "M6 forecast",
          "worst-case at T1",
          "modelled inflows / outflows"
        ],
        "sample": "Contracts pipeline, product-usage index, forecast inflows."
      },
      {
        "id": "f_ext",
        "file": "external_rates_costs_2026-07-07.csv",
        "type": "External rate & cost forecasts",
        "horizon": "Later",
        "as_at": "2026-07-07",
        "grain": "one row per as-of date",
        "rows": 1,
        "feeds": [
          "M7",
          "worst-case at T1",
          "rate & input-cost sensitivity"
        ],
        "sample": "Rate curve (bps) + energy input-cost index used to stress floating coupons."
      }
    ],
    "metrics": {
      "coverage-trend": {
        "label": "Coverage trend",
        "horizon": "Now",
        "formula": "sign of Δ coverage across recent snapshots (worsening / stable)",
        "as_at": "2026-07-08",
        "files": [
          "f_bank"
        ],
        "note": "Direction of coverage over the recent snapshot history."
      },
      "prior-issues": {
        "label": "Prior issues",
        "horizon": "Now",
        "formula": "count of labelled past missed payments",
        "as_at": "2026-06-30",
        "files": [
          "f_labels"
        ],
        "note": "Labelled missed-payment events per company. Lagos: 2; Sahel: 1."
      },
      "coupon-rate": {
        "label": "Coupon",
        "horizon": "Now",
        "formula": "contractual coupon rate on the loan",
        "as_at": "2026-07-05",
        "files": [
          "f_crm"
        ],
        "note": "From the CRM loan record. Sahel: 12% cash coupon."
      },
      "cash-due-t1": {
        "label": "Cash due at T1",
        "horizon": "Now",
        "formula": "scheduled cash coupon / amortisation due at the next payment date (PIK ⇒ 0)",
        "as_at": "2026-07-05",
        "files": [
          "f_crm",
          "f_pay"
        ],
        "note": "Sahel: $700,000 due 2026-07-15."
      },
      "coverage-ratio": {
        "label": "Coverage ratio",
        "horizon": "Now",
        "formula": "projected transferable cash at T1 ÷ cash due at T1",
        "as_at": "2026-07-08",
        "files": [
          "f_bank",
          "f_crm",
          "f_fx"
        ],
        "note": "Projected transferable cash at T1 ÷ cash to repay at T1. Sahel: 0.46."
      },
      "principal-at-risk": {
        "label": "Principal at risk",
        "horizon": "Now",
        "formula": "outstanding principal on the loan exposed at the next payment (T1)",
        "as_at": "2026-07-05",
        "files": [
          "f_crm"
        ],
        "note": "Outstanding principal exposed on the loan. Sahel: $6.0M."
      },
      "data-freshness": {
        "label": "Data freshness",
        "horizon": "Now",
        "formula": "today − last snapshot date (worst account across the company)",
        "as_at": "2026-07-08",
        "files": [
          "f_bank"
        ],
        "note": "now - last_updated per account; a stale feed is itself a risk flag."
      },
      "transferable-vs-trapped": {
        "label": "Transferable vs trapped",
        "horizon": "Now",
        "formula": "Σ hard-ccy balances (transferable) vs Σ restricted-ccy balances (trapped); USD re-derived from the FX table, never the export's own USD column",
        "as_at": "2026-07-08",
        "files": [
          "f_bank",
          "f_convert",
          "f_fx"
        ],
        "note": "Hard-ccy (transferable) vs restricted (trapped). Sahel: $325K of $9.31M."
      },
      "runway-days": {
        "label": "Runway",
        "horizon": "Now",
        "formula": "transferable cash ÷ transferable-cash burn per day (from the snapshot history)",
        "as_at": "2026-07-01 → 2026-07-08",
        "files": [
          "f_bank"
        ],
        "note": "Transferable-cash burn/day across snapshots → days of runway. Sahel: 38d."
      },
      "worst-serviced-floor": {
        "label": "Worst-serviced floor",
        "horizon": "Now",
        "formula": "min(coverage) across history at which a scheduled payment was still met",
        "as_at": "2026-07-08",
        "files": [
          "f_bank",
          "f_crm"
        ],
        "note": "Coverage of the single worst-serviced obligation, not the blended average."
      },
      "recoverability-first-pass": {
        "label": "Recoverability (first-pass)",
        "horizon": "Now",
        "formula": "0.35 + 0.20·senior + 0.20·secured − 0.12·prior_misses − 0.10·(1 − transferable share), clamped to [0.10, 0.97] → Strong / Partial / Weak",
        "as_at": "2026-07-08",
        "files": [
          "f_crm",
          "f_convert",
          "f_labels"
        ],
        "note": "Loan seniority/security + transferable-vs-trapped + prior-miss history - no financials. Sahel: Partial (~0.55)."
      },
      "savable-money-first-pass": {
        "label": "Savable money (first-pass)",
        "horizon": "Now",
        "formula": "principal at risk × first-pass recoverability score",
        "as_at": "2026-07-08",
        "files": [
          "f_crm",
          "f_convert",
          "f_labels"
        ],
        "note": "Principal at risk × first-pass recoverability. Sahel: ~ $3.3M."
      },
      "p1-p4-provisional": {
        "label": "P1–P4 (provisional)",
        "horizon": "Now",
        "formula": "quadrant(money at stake, first-pass recoverability)",
        "as_at": "2026-07-08",
        "files": [
          "f_crm",
          "f_convert",
          "f_labels"
        ],
        "note": "Money at stake × first-pass recoverability → provisional P1–P4 posture."
      },
      "coverage-exposure": {
        "label": "Coverage × exposure",
        "horizon": "Now",
        "formula": "coverage rank × exposure size — a rough work-order proxy",
        "as_at": "2026-07-08",
        "files": [
          "f_bank",
          "f_crm"
        ],
        "note": "Rough work-order proxy: coverage × exposure size."
      },
      "recoverability-enhanced": {
        "label": "Recoverability (financials-enhanced)",
        "horizon": "Medium",
        "formula": "first-pass adjusted by net leverage, current/quick ratio and burn quality → separates a timing wobble from a structural hole",
        "as_at": "2026-06-30",
        "files": [
          "f_bs",
          "f_cfs"
        ],
        "note": "Adds leverage/liquidity + burn quality to confirm timing vs structural."
      },
      "savable-money-sharpened": {
        "label": "Savable money (sharpened)",
        "horizon": "Medium",
        "formula": "principal at risk × financials-backed recoverability score",
        "as_at": "2026-06-30",
        "files": [
          "f_bs",
          "f_cfs",
          "f_crm"
        ],
        "note": "Savable money re-scored with financials-backed recoverability."
      },
      "p1-p4-firmed": {
        "label": "P1–P4 (firmed)",
        "horizon": "Medium",
        "formula": "quadrant(money at stake, financials-backed recoverability)",
        "as_at": "2026-06-30",
        "files": [
          "f_bs",
          "f_cfs"
        ],
        "note": "Provisional P1–P4 firmed once the financials land."
      },
      "leverage-liquidity": {
        "label": "Leverage & liquidity",
        "horizon": "Medium",
        "formula": "net debt ÷ EBITDA; current assets ÷ current liabilities",
        "as_at": "2026-06-30",
        "files": [
          "f_bs"
        ],
        "note": "Net leverage and current/quick ratios from the balance sheet."
      },
      "burn-quality-cfs": {
        "label": "Burn quality",
        "horizon": "Medium",
        "formula": "cash from operations ÷ mandatory debt service",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs"
        ],
        "note": "Cash from ops vs mandatory debt service - quality of the burn."
      },
      "forecast-coverage-at-t1-base": {
        "label": "Forecast @ T1 (base case)",
        "horizon": "Later",
        "formula": "modelled (transferable cash + forecast inflows − forecast outflows) at T1 ÷ cash due at T1",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle"
        ],
        "note": "Base-case modelled coverage at T1 (inflows - outflows). Sahel base: 0.41."
      },
      "worst-case-coverage-at-t1": {
        "label": "Worst-case @ T1",
        "horizon": "Later",
        "formula": "base case re-run under stress: FX stays blocked + a rate / energy spike",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle",
          "f_ext"
        ],
        "note": "Stress scenario (FX stays blocked + rate/energy spike). Sahel worst: 0.18."
      },
      "forecast-range-worst-base": {
        "label": "Expected range (worst–base)",
        "horizon": "Later",
        "formula": "[ worst-case coverage , base-case coverage ] at T1",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle",
          "f_ext"
        ],
        "note": "Expected range worst → best around the base. Sahel: 0.18 - 0.60 (base 0.41)."
      },
      "lead-time-to-breach": {
        "label": "Lead time to breach",
        "horizon": "Later",
        "formula": "days from today until modelled coverage crosses 1.00",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle"
        ],
        "note": "Days from now until forecast coverage crosses 1.0."
      },
      "modelled-inflows-outflows": {
        "label": "Modelled inflows / outflows",
        "horizon": "Later",
        "formula": "forward cash flows from revenue-lifecycle + cashflow (not a static run-down)",
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle"
        ],
        "note": "Forward inflows and outflows, not a static run-down."
      },
      "rate-input-cost-sensitivity": {
        "label": "Rate & input-cost sensitivity",
        "horizon": "Later",
        "formula": "Δ floating coupon (rate curve) + Δ operating margin (energy / input-cost index)",
        "as_at": "2026-07-07",
        "files": [
          "f_ext"
        ],
        "note": "Floating-coupon + margin sensitivity to the rate curve + input-cost index."
      },
      "cash-vs-pik": {
        "label": "Cash vs PIK",
        "horizon": "Now",
        "formula": "loan flag — PIK ⇒ cash due at T1 = 0 (paid in kind)",
        "as_at": "2026-07-05",
        "files": [
          "f_crm",
          "f_pay"
        ],
        "note": "PIK = no cash due at T1; only cash coupons need defending."
      },
      "next-payment": {
        "label": "Next payment",
        "horizon": "Now",
        "formula": "next scheduled payment date & amount from the loan / payment schedule",
        "as_at": "2026-07-05",
        "files": [
          "f_crm",
          "f_pay"
        ],
        "note": "Next scheduled payment date + amount due. Sahel: 2026-07-15, $700K."
      },
      "seniority-security": {
        "label": "Seniority & security",
        "horizon": "Now",
        "formula": "rank in the capital stack + collateral attached to the loan",
        "as_at": "2026-07-05",
        "files": [
          "f_crm"
        ],
        "note": "Rank in the capital stack + collateral; sets recovery and the playbook."
      },
      "action-log-entry": {
        "label": "Action log entry",
        "horizon": "Live",
        "formula": "appended in-app: { company, priority, outcome, note, timestamp } → labelled history",
        "as_at": "live",
        "files": [],
        "note": "Generated in-app: every action + outcome is logged - the labelled history starts here."
      }
    }
  },
  "signal_capabilities": [
    {
      "id": "M1",
      "item": "Current transferable cash",
      "source": "Company banking data",
      "availability": "Now",
      "phase": "Now",
      "method": "Proxy: local-currency cash likely to be exchangeable.",
      "confidence": "4/5",
      "difficulty": "Low",
      "evidence": {
        "as_at": "2026-07-08",
        "files": [
          "f_bank",
          "f_fx",
          "f_convert"
        ],
        "sample": "Sum of USD/EUR/GBP balances re-derived via FX = $324,857; the EUR operating row now reads $0."
      }
    },
    {
      "id": "M2",
      "item": "History of transferable cash",
      "source": "Company banking data",
      "availability": "Now",
      "phase": "Now",
      "method": "Collect all the snapshots.",
      "confidence": "4/5",
      "difficulty": "Low",
      "evidence": {
        "as_at": "2026-07-01 → 2026-07-08",
        "files": [
          "f_bank"
        ],
        "sample": "Transferable cash $795,714 → $324,857 across snapshots → burn/day, runway 38d."
      }
    },
    {
      "id": "M3",
      "item": "Proxy of transferable cash at T1",
      "source": "Company banking data",
      "availability": "Now",
      "phase": "Now",
      "method": "Project from historical cash trend (burn rate + runway).",
      "confidence": "2.5/5",
      "difficulty": "Medium",
      "evidence": {
        "as_at": "projected to 2026-07-15 (T1)",
        "files": [
          "f_bank",
          "f_crm"
        ],
        "sample": "Trend projected to the next payment date → coverage proxy 0.46."
      }
    },
    {
      "id": "M4",
      "item": "Time of next repayment",
      "source": "Loan structure (fallback: tomorrow)",
      "availability": "If in CRM",
      "phase": "Now",
      "method": "Read from record.",
      "confidence": "5/5",
      "difficulty": "Low",
      "evidence": {
        "as_at": "2026-07-05",
        "files": [
          "f_crm",
          "f_pay"
        ],
        "sample": "LN-SAHEL-1 next payment 2026-07-15."
      }
    },
    {
      "id": "M5",
      "item": "Coupon / cash to repay at T1",
      "source": "Loan structure",
      "availability": "If in CRM",
      "phase": "Now",
      "method": "Read from record; flag cash vs PIK (PIK = no cash due).",
      "confidence": "5/5",
      "difficulty": "Low",
      "evidence": {
        "as_at": "2026-07-05",
        "files": [
          "f_crm",
          "f_pay"
        ],
        "sample": "$700,000 cash coupon due (cash, not PIK)."
      }
    },
    {
      "id": "R1",
      "item": "Recoverability — first-pass",
      "source": "Loan structure + convertibility + prior misses",
      "availability": "Now",
      "phase": "Now",
      "method": "Seniority/security + transferable-vs-trapped + prior-miss history → can-they-recover proxy. No financials needed.",
      "confidence": "3/5",
      "difficulty": "Low",
      "evidence": {
        "as_at": "2026-07-08",
        "files": [
          "f_crm",
          "f_convert",
          "f_labels"
        ],
        "sample": "Sahel: senior secured + cash trapped (not gone) + 0 prior misses → Partial (~0.55), ~ $3.3M savable."
      }
    },
    {
      "id": "R2",
      "item": "Recoverability — financials-enhanced",
      "source": "Balance sheet + cashflow statements",
      "availability": "Medium",
      "phase": "Medium",
      "method": "Add leverage, liquidity and burn quality to separate a timing wobble from a structural hole; firms up savable money and the P1–P4 grade.",
      "confidence": "4/5",
      "difficulty": "Medium",
      "evidence": {
        "as_at": "2026-06-30",
        "files": [
          "f_bs",
          "f_cfs"
        ],
        "sample": "Balance-sheet leverage + cashflow burn quality confirm whether the gap is timing or structural."
      }
    },
    {
      "id": "M6",
      "item": "Forecast of cash at T1 — base case",
      "source": "Cashflow statements + revenue-lifecycle data",
      "availability": "Later",
      "phase": "Later",
      "method": "Model inflows and outflows, not just run-down.",
      "confidence": "4/5",
      "difficulty": "High",
      "evidence": {
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle"
        ],
        "sample": "Sahel base-case modelled coverage at T1 ~ 0.41."
      }
    },
    {
      "id": "M6w",
      "item": "Worst-case cash at T1 (+ expected range)",
      "source": "Cashflow + revenue-lifecycle + external stress",
      "availability": "Later",
      "phase": "Later",
      "method": "Stress the base case (FX stays blocked + rate/energy spike); report the expected range worst → best.",
      "confidence": "3/5",
      "difficulty": "High",
      "evidence": {
        "as_at": "2026-06-30",
        "files": [
          "f_cfs",
          "f_lifecycle",
          "f_ext"
        ],
        "sample": "Sahel worst-case coverage at T1 ~ 0.18; expected range 0.18 - 0.60 (base 0.41)."
      }
    },
    {
      "id": "M7",
      "item": "Rates + input-cost forecasts (e.g. energy)",
      "source": "External sources",
      "availability": "Later",
      "phase": "Later",
      "method": "Adjust floating-rate payments & margin pressure.",
      "confidence": "3/5",
      "difficulty": "Medium",
      "evidence": {
        "as_at": "2026-07-07",
        "files": [
          "f_ext"
        ],
        "sample": "Floating 12-14% coupons stressed on the rate curve + energy input-cost index."
      }
    }
  ],
  "data_unlocks": {
    "Now": {
      "title": "Banking + loan data",
      "datasets": [
        "Company banking snapshots",
        "Loan structure (CRM)",
        "Prior-miss history"
      ],
      "summary": "Stand up the coverage signal, the loan follow-up, and a first-pass recoverability read (from loan seniority/security, the transferable-vs-trapped split and prior-miss history — no financials needed) — enough to triage worst-first by savable money and log the action."
    },
    "Medium": {
      "title": "Financial statements",
      "datasets": [
        "Balance sheet",
        "Cashflow statements"
      ],
      "summary": "Sharpen recoverability with balance sheet + cashflow (leverage, liquidity, burn quality) — confirm who can actually repay, tell a timing wobble apart from a structural hole, and firm up the provisional P1–P4 grade."
    },
    "Later": {
      "title": "Forecasting + external signals",
      "datasets": [
        "Revenue-lifecycle data",
        "Rates & input-cost feeds"
      ],
      "summary": "Model cash at T1 forward and stress it for rates and input costs — warn before the breach and size the response from scenarios."
    }
  },
  "workflow": [
    {
      "step": "See",
      "tag": "Triage",
      "phases": {
        "Now": {
          "what": "Rank worst-first by coverage and money at risk — and by first-pass savable money (money at risk × first-pass recoverability).",
          "analysis": "Reactive on coverage, but already triaged by what's recoverable.",
          "metrics": [
            "coverage ratio",
            "principal at risk",
            "data freshness",
            "recoverability (first-pass)",
            "savable money (first-pass)"
          ],
          "actions": [
            "Open the worst-first queue",
            "Sort by first-pass savable money"
          ]
        },
        "Medium": {
          "what": "Sharpen savable money with financials-backed recoverability.",
          "analysis": "Balance-sheet/cashflow confirm who can really recover — not just the structural proxy.",
          "metrics": [
            "recoverability (enhanced)",
            "savable money (sharpened)"
          ],
          "actions": [
            "Re-rank by financials-backed savable money"
          ]
        },
        "Later": {
          "what": "Surface companies whose forecast cash at T1 will breach before coverage even dips — with a worst-case scenario and the expected range.",
          "analysis": "Proactive — buy lead time and size the downside, not just the central case.",
          "metrics": [
            "forecast coverage at T1 (base)",
            "worst-case coverage at T1",
            "forecast range (worst–base)",
            "lead time to breach"
          ],
          "actions": [
            "Pre-breach watchlist"
          ]
        }
      }
    },
    {
      "step": "Understand",
      "tag": "Why",
      "phases": {
        "Now": {
          "what": "The cash story: balance trend, transferable vs trapped, runway, prior issues.",
          "analysis": "Where the cash has been.",
          "metrics": [
            "transferable vs trapped",
            "runway days",
            "worst-serviced floor"
          ],
          "actions": [
            "Read the why panel"
          ]
        },
        "Medium": {
          "what": "Add balance-sheet & cashflow context — leverage, liquidity, quality of burn.",
          "analysis": "Tell a timing wobble apart from a structural hole.",
          "metrics": [
            "leverage / liquidity",
            "burn quality (CFS)"
          ],
          "actions": [
            "Classify timing vs structural shortfall"
          ]
        },
        "Later": {
          "what": "Modelled inflows/outflows with rate & input-cost sensitivity.",
          "analysis": "Explain why cash will move next, not just where it has been.",
          "metrics": [
            "modelled inflows / outflows",
            "rate & input-cost sensitivity"
          ],
          "actions": [
            "Run a cash scenario"
          ]
        }
      }
    },
    {
      "step": "Prioritise",
      "tag": "Work order",
      "phases": {
        "Now": {
          "what": "Order by coverage × exposure, then assign a provisional P1–P4 from first-pass recoverability.",
          "analysis": "Good enough to start the day and pick the posture.",
          "metrics": [
            "coverage × exposure",
            "P1–P4 (provisional)"
          ],
          "actions": [
            "Provisional work order",
            "Assign provisional P1–P4"
          ]
        },
        "Medium": {
          "what": "Re-grade the P1–P4 quadrant with financials-backed recoverability — money at stake × can-they-recover.",
          "analysis": "Firm up the provisional grade once the financials land.",
          "metrics": [
            "recoverability (enhanced)",
            "P1–P4 (firmed)"
          ],
          "actions": [
            "Re-grade P1–P4 priority"
          ]
        },
        "Later": {
          "what": "Probability-weighted by forecast scenarios — expected-loss ranking.",
          "analysis": "Prioritise on probability-adjusted savable money.",
          "metrics": [
            "expected loss",
            "scenario probability"
          ],
          "actions": [
            "Expected-loss work order"
          ]
        }
      }
    },
    {
      "step": "Decide",
      "tag": "What to do",
      "phases": {
        "Now": {
          "what": "Decide the basics: cash vs PIK, what is due and when.",
          "analysis": "Is there even a cash payment to defend?",
          "metrics": [
            "cash vs PIK",
            "next payment"
          ],
          "actions": [
            "Confirm the immediate ask"
          ]
        },
        "Medium": {
          "what": "Full loan context — seniority, security, covenants — sets the action.",
          "analysis": "Match the playbook to the structure.",
          "metrics": [
            "seniority / security",
            "covenant headroom"
          ],
          "actions": [
            "Pick the structured action (workout, covenant review)"
          ]
        },
        "Later": {
          "what": "Scenario-tested decisions — size the bridge or pre-empt the covenant from the forecast.",
          "analysis": "Decide ahead of the event.",
          "metrics": [
            "bridge sizing",
            "pre-emptive covenant trigger"
          ],
          "actions": [
            "Pre-position bridge / covenant action"
          ]
        }
      }
    },
    {
      "step": "Act",
      "tag": "& record",
      "phases": {
        "Now": {
          "what": "Log the action and the outcome — the labelled history starts here.",
          "analysis": "Capture what was done.",
          "metrics": [
            "action log entry"
          ],
          "actions": [
            "Log action + outcome"
          ]
        },
        "Medium": {
          "what": "Outcomes feed the recoverability read — closing the loop on who recovers.",
          "analysis": "Learn which actions actually work.",
          "metrics": [
            "outcome → recoverability"
          ],
          "actions": [
            "Tag resolution outcome"
          ]
        },
        "Later": {
          "what": "Labelled history trains the forecast model — the desk compounds.",
          "analysis": "Every logged action sharpens the next forecast.",
          "metrics": [
            "labelled training signal"
          ],
          "actions": [
            "Feed the model"
          ]
        }
      }
    }
  ]
};
