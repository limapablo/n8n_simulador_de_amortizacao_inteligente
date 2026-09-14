const assert = require('assert');
const {
  taxRateForHoldingPeriod,
  netInvestmentFutureValue,
  priceSchedule,
  sacSchedule,
  financingComparison,
  breakEvenGrossRate,
  monteCarloDebtVsInvestment,
} = require('../src/financial_engine');

function approx(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} ≈ ${expected}`);
}

(function testTaxBrackets() {
  assert.strictEqual(taxRateForHoldingPeriod(3), 0.225);
  assert.strictEqual(taxRateForHoldingPeriod(9), 0.20);
  assert.strictEqual(taxRateForHoldingPeriod(18), 0.175);
  assert.strictEqual(taxRateForHoldingPeriod(30), 0.15);
})();

(function testTaxAppliesToGainOnly() {
  const result = netInvestmentFutureValue(1000, 0.10, 12);
  assert.ok(result.grossFutureValue > 1000);
  assert.ok(result.tax > 0);
  assert.ok(result.tax < result.grossGain);
  approx(result.netFutureValue, result.grossFutureValue - result.tax);
})();

(function testPriceSchedule() {
  const schedule = priceSchedule(100000, 0.12, 12);
  assert.strictEqual(schedule.length, 12);
  approx(schedule.at(-1).closingBalance, 0, 1e-7);
  const payments = schedule.map((row) => row.payment);
  const spread = Math.max(...payments) - Math.min(...payments);
  assert.ok(spread < 0.01, 'Price payments should be effectively constant');
})();

(function testSacSchedule() {
  const schedule = sacSchedule(100000, 0.12, 12);
  assert.strictEqual(schedule.length, 12);
  approx(schedule.at(-1).closingBalance, 0, 1e-7);
  assert.ok(schedule[0].payment > schedule.at(-1).payment, 'SAC installments should decline');
  const amortizations = schedule.map((row) => row.amortization);
  assert.ok(Math.max(...amortizations) - Math.min(...amortizations) < 0.01);
})();

(function testSacUsuallyCostsLessInterestThanPrice() {
  const comparison = financingComparison(200000, 0.10, 240);
  assert.ok(comparison.sac.totalInterest < comparison.price.totalInterest);
  assert.ok(comparison.sac.firstPayment > comparison.sac.lastPayment);
})();

(function testBreakEvenRate() {
  const result = breakEvenGrossRate(0.08, 24);
  assert.ok(result.grossAnnualRate > 0.08, 'Gross investment rate must exceed debt rate after tax');
})();

(function testMonteCarloIsReproducible() {
  const params = {
    principal: 50000,
    debtAnnualRate: 0.09,
    investmentAnnualRate: 0.12,
    months: 36,
    simulations: 1000,
    investmentVolatility: 0.02,
    debtVolatility: 0.01,
    correlation: 0.25,
    seed: 123,
  };

  const a = monteCarloDebtVsInvestment(params);
  const b = monteCarloDebtVsInvestment(params);
  assert.deepStrictEqual(a, b);
})();

console.log('All financial engine tests passed.');
