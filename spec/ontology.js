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
      "loan": {
        "loan_id": "LN-SAHEL-1",
        "principal": 6000000,
        "seniority": "Senior secured",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-15",
        "cash_to_repay_t1": 700000
      },
      "principal_at_risk": 6000000,
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
      "loan": {
        "loan_id": "LN-LAGOS-1",
        "principal": 3200000,
        "seniority": "Senior",
        "coupon_rate": 0.14,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-20",
        "cash_to_repay_t1": 720000
      },
      "principal_at_risk": 3200000,
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
      "loan": {
        "loan_id": "LN-DAR-1",
        "principal": 4500000,
        "seniority": "Senior secured",
        "coupon_rate": 0.11,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-01",
        "cash_to_repay_t1": 900000
      },
      "principal_at_risk": 2200000,
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
      "loan": {
        "loan_id": "LN-NAIROBI-1",
        "principal": 1800000,
        "seniority": "Senior",
        "coupon_rate": 0.13,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-07-28",
        "cash_to_repay_t1": 400000
      },
      "principal_at_risk": 900000,
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
      "loan": {
        "loan_id": "LN-KAMPALA-1",
        "principal": 900000,
        "seniority": "Senior",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-10",
        "cash_to_repay_t1": 200000
      },
      "principal_at_risk": 180000,
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
      "loan": {
        "loan_id": "LN-ACCRA-1",
        "principal": 600000,
        "seniority": "Senior",
        "coupon_rate": 0.12,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-08-15",
        "cash_to_repay_t1": 140000
      },
      "principal_at_risk": 0,
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
      "loan": {
        "loan_id": "LN-KIGALI-1",
        "principal": 1200000,
        "seniority": "Senior",
        "coupon_rate": 0.1,
        "cash_vs_pik": "pik",
        "next_payment_date": "2026-09-01",
        "cash_to_repay_t1": 0
      },
      "principal_at_risk": 0,
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
      "loan": {
        "loan_id": "LN-CASA-1",
        "principal": 2000000,
        "seniority": "Senior secured",
        "coupon_rate": 0.09,
        "cash_vs_pik": "cash",
        "next_payment_date": "2026-09-05",
        "cash_to_repay_t1": 300000
      },
      "principal_at_risk": 0,
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
    "title": "A new bank file turns into a warning, an action, and an updated database",
    "company_id": "C-SAHEL",
    "company_name": "Sahel AgriCorp",
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
        "title": "Standardise raw -> canonical",
        "detail": "Parse types; resolve account_key (NBFI rule); de-dup; re-derive USD from FX; tag convertibility; validate + freshness.",
        "db_changes": [
          "account_key synthesized for null-ID rows",
          "EUR row tagged convertibility=transferable, balance now $0",
          "rows with issues -> validation_quarantine"
        ]
      },
      {
        "layer": "silver",
        "title": "Update canonical entities",
        "detail": "silver.account refreshed for snapshot 2026-07-08; the EUR transferable balance drops $471K -> $0.",
        "db_changes": [
          "~62 silver.account rows upserted for the new snapshot"
        ]
      },
      {
        "layer": "gold",
        "title": "Recompute the golden model",
        "detail": "M1 transferable cash = $324,857 (was $795,714). cash_to_repay_t1 = $700,000. coverage = 0.46. Label flips Low -> High.",
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
      "ew_label": "High",
      "coverage_ratio": 0.46,
      "principal_at_risk": 6000000,
      "reason": "Transferable cash fell 59% ($795,714 -> $324,857) after the EUR operating account dropped to $0; projected cash at T1 no longer covers the $700,000 due."
    },
    "action": {
      "priority": "P1",
      "action_taken": "Contacted treasurer; arranging FX conversion / bridge to fund the $700K coupon; confirming funding source before 2026-07-15.",
      "actor": "credit-team",
      "outcome": "pending"
    }
  }
};
