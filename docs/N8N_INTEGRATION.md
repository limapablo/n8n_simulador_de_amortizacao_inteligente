# n8n Integration Guide

The repository now contains a framework-agnostic financial engine in [`src/financial_engine.js`](../src/financial_engine.js).

This separation is intentional: financial formulas should be versioned and tested independently from the n8n workflow export.

## Why separate the engine from the workflow JSON?

An n8n export stores Code node scripts inside JSON strings. Large inline scripts are difficult to review, diff, test, and maintain. A small syntax error can also make the workflow harder to import or debug.

The recommended architecture is therefore:

```text
n8n orchestration
    ↓
validated form inputs
    ↓
financial engine logic
    ↓
structured JSON result
    ↓
Google Sheets / HTML report
```

## Current migration status

The original workflow export remains available as:

```text
workflow_n8n_SAI.json
```

The corrected and reusable calculation layer is available as:

```text
src/financial_engine.js
```

The engine currently implements:

- Price amortization schedule;
- true SAC amortization schedule;
- financing comparison;
- Brazilian regressive tax applied to investment **gains**;
- break-even gross investment rate;
- seeded Monte Carlo simulation;
- optional correlation between investment-rate and debt-rate shocks;
- percentile outputs for simulated economic advantage.

## Option A — Copy the tested functions into an n8n Code node

For a self-contained workflow, copy the required functions from `src/financial_engine.js` into the main n8n Code node.

Then adapt the form values into a normalized object before running calculations.

Example:

```javascript
const input = $("Simulador de Amortização Inteligente").first().json;

const debt = Number(input.valor_divida);
const annualRate = Number(input.taxa_juros) / 100;
const months = Number(input.prazo_meses);

const comparison = financingComparison(debt, annualRate, months);

return [{
  json: {
    price_total_interest: comparison.price.totalInterest,
    price_payment: comparison.price.firstPayment,
    sac_total_interest: comparison.sac.totalInterest,
    sac_first_payment: comparison.sac.firstPayment,
    sac_last_payment: comparison.sac.lastPayment,
  }
}];
```

## Option B — Use the engine as an external module

If the n8n deployment allows external modules or a custom node, the cleaner production architecture is to package the financial engine separately and import it from the workflow runtime.

This avoids duplicated business logic and lets the same engine power:

- n8n;
- an API;
- automated tests;
- a web application;
- batch simulations.

## Recommended output contract

Instead of letting downstream nodes depend on implementation details, return a stable JSON object such as:

```json
{
  "decision": "INVEST",
  "inputs": {},
  "market": {},
  "financing": {
    "price": {},
    "sac": {}
  },
  "investment": {},
  "simulation": {},
  "diagnostics": {}
}
```

This makes the workflow easier to extend without breaking Google Sheets or HTML nodes.

## Testing locally

With Node.js 18 or newer:

```bash
npm test
```

The tests cover the core mathematical behavior of the engine and deterministic Monte Carlo execution.

## Next migration step

The next recommended change is to replace the original inline calculation block inside the n8n Code node with the tested implementation from `src/financial_engine.js` and then re-export the workflow from n8n.

That approach is safer than hand-editing a large escaped JavaScript string inside the workflow JSON.
