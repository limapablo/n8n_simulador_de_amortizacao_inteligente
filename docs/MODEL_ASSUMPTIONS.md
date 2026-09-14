# Model Assumptions and Limitations

This document describes the main assumptions embedded in the current workflow. The goal is transparency: the simulator is useful as a decision-support and learning tool, but several calculations are intentionally simplified.

## 1. Selic return

The workflow retrieves the most recent Selic daily rate from Banco Central do Brasil and annualizes it assuming 252 business days.

The investment return is then reduced using a simplified Brazilian regressive income-tax rate based on the simulation horizon.

### Limitation

The current implementation applies the tax reduction directly to the annualized return. In real investments, taxation usually applies to gains rather than to the entire gross rate, and product-specific rules may differ.

## 2. IPCA treatment

IPCA observations are compounded to derive an accumulated inflation estimate.

For debts classified as IPCA-linked, the model adds inflation to the contractual annual rate as an approximation of total debt cost.

### Limitation

Real inflation-linked debt contracts may use specific indexation dates, lag structures, spreads, fees, insurance, and other contract rules that are not modeled here.

## 3. Debt amortization vs. investment

The workflow compares the present-value contribution of:

- interest avoided by amortizing debt; and
- investment return obtained by keeping the extra capital invested.

The same estimated investment return is used as the discounting basis in the current NPV-style calculation.

### Limitation

This is not a full cash-flow reconstruction of the original loan contract. A more rigorous implementation would generate the complete amortization schedule and compare all resulting cash flows under both strategies.

## 4. Financing calculation

The code currently calculates a constant payment using an annuity formula:

```text
PMT = P * [i(1+i)^n] / [(1+i)^n - 1]
```

This is structurally closer to a fixed-payment **Price-style** financing model.

### Important note

An older code comment labels this section as a simplified SAC calculation. That description is inaccurate: true SAC uses constant principal amortization and declining installments.

### Future improvement

Implement both systems explicitly:

- SAC amortization schedule;
- Price amortization schedule;
- comparison of total interest, payment path, and present value.

## 5. Consortium costs

The current model includes:

- administration fee;
- a fixed 2% reserve-fund estimate;
- a fixed 1% insurance estimate;
- rent paid during the assumed waiting period;
- opportunity cost associated with a bid.

### Limitation

Actual consortium contracts vary substantially. Reserve funds, insurance, adjustment indexes, bid rules, contemplation probabilities, and fees should be read from the specific contract.

## 6. LTV recommendation

The LTV module uses a rule-based approach:

- when estimated net Selic return exceeds debt cost, preserve more invested capital;
- when debt cost exceeds net Selic return, prefer a larger down payment.

The current implementation uses indicative 20% and 50% down-payment levels.

### Limitation

These are heuristic boundaries, not optimized solutions. Banks may impose different minimum down payments and offer nonlinear interest-rate tiers based on LTV.

## 7. Monte Carlo simulation

The simulator runs 1,000 scenarios using normally distributed shocks produced through the Box-Muller transform.

Current volatility assumptions are fixed in code:

- Selic volatility: `0.015`;
- IPCA volatility: `0.01`.

### Limitations

The model currently assumes:

- normal distributions;
- fixed volatility;
- no time-varying volatility;
- no explicit Selic/IPCA correlation model;
- no regime shifts;
- independent random runs with no fixed seed.

The reported confidence score therefore represents the share of simulated model scenarios favoring one decision. It should **not** be interpreted as a statistically calibrated probability that the future will follow that outcome.

## 8. Taxation

Brazilian tax rules are complex and depend on the specific investment vehicle, holding period, exemptions, and regulatory changes.

The simulator uses a simplified regressive-income-tax assumption for educational comparison.

### Limitation

It does not model IOF, tax-exempt instruments, fund fees, come-cotas, custody costs, transaction costs, or product-specific taxation.

## 9. Liquidity and risk

The current decision engine focuses mainly on expected financial value.

It does not fully quantify:

- emergency-reserve requirements;
- liquidity risk;
- default risk;
- reinvestment risk;
- behavioral risk;
- early-redemption restrictions;
- credit insurance;
- transaction costs;
- refinancing options.

These factors can dominate a real-world decision even when the mathematical spread favors another alternative.

## 10. Data quality and API dependency

The workflow depends on BCB SGS API responses. API availability, series definitions, publication lags, or changes in endpoint behavior can affect execution.

Production use should include:

- API error handling;
- validation of returned values;
- fallback data;
- logging;
- tests for unexpected responses.

## Interpretation guideline

The model is best used to answer:

> "Given these assumptions, which alternative appears economically stronger, and how sensitive is that conclusion?"

It should not be used to claim:

> "This alternative is guaranteed to be financially superior."

That distinction is central to the project.
