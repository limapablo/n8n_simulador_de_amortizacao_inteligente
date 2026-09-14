/*
 * Financial decision engine used by the n8n amortization simulator.
 *
 * The functions in this file are intentionally framework-agnostic so the
 * financial logic can be tested independently from n8n.
 */

function annualToMonthlyRate(annualRate) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

function taxRateForHoldingPeriod(months) {
  const days = Math.max(0, months) * 30;
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.20;
  if (days <= 720) return 0.175;
  return 0.15;
}

function netInvestmentFutureValue(principal, annualGrossRate, months) {
  if (principal <= 0 || months <= 0) {
    return {
      principal,
      grossFutureValue: principal,
      grossGain: 0,
      taxRate: taxRateForHoldingPeriod(months),
      tax: 0,
      netFutureValue: principal,
      netGain: 0,
    };
  }

  const grossFutureValue = principal * Math.pow(1 + annualGrossRate, months / 12);
  const grossGain = grossFutureValue - principal;
  const taxRate = taxRateForHoldingPeriod(months);
  const tax = Math.max(0, grossGain) * taxRate;
  const netFutureValue = grossFutureValue - tax;

  return {
    principal,
    grossFutureValue,
    grossGain,
    taxRate,
    tax,
    netFutureValue,
    netGain: netFutureValue - principal,
  };
}

function priceSchedule(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return [];

  const monthlyRate = annualToMonthlyRate(annualRate);
  const payment = monthlyRate === 0
    ? principal / months
    : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  const schedule = [];

  for (let period = 1; period <= months; period++) {
    const interest = balance * monthlyRate;
    const amortization = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - amortization);

    schedule.push({
      period,
      openingBalance: balance + amortization,
      payment: period === months ? amortization + interest : payment,
      interest,
      amortization,
      closingBalance: balance,
    });
  }

  return schedule;
}

function sacSchedule(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return [];

  const monthlyRate = annualToMonthlyRate(annualRate);
  const constantAmortization = principal / months;
  let balance = principal;
  const schedule = [];

  for (let period = 1; period <= months; period++) {
    const interest = balance * monthlyRate;
    const amortization = period === months ? balance : constantAmortization;
    const payment = amortization + interest;
    balance = Math.max(0, balance - amortization);

    schedule.push({
      period,
      openingBalance: balance + amortization,
      payment,
      interest,
      amortization,
      closingBalance: balance,
    });
  }

  return schedule;
}

function summarizeSchedule(schedule) {
  const totalPaid = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);

  return {
    totalPaid,
    totalInterest,
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule.at(-1)?.payment ?? 0,
  };
}

function financingComparison(principal, annualRate, months) {
  const price = priceSchedule(principal, annualRate, months);
  const sac = sacSchedule(principal, annualRate, months);

  return {
    price: summarizeSchedule(price),
    sac: summarizeSchedule(sac),
    schedules: { price, sac },
  };
}

function breakEvenGrossRate(debtAnnualRate, months) {
  const taxRate = taxRateForHoldingPeriod(months);

  // Solve approximately for the gross investment rate whose after-tax gain
  // equals the debt rate over the same horizon.
  let low = -0.99;
  let high = Math.max(1, debtAnnualRate * 4 + 0.25);

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const invested = netInvestmentFutureValue(1, mid, months).netFutureValue;
    const debtFV = Math.pow(1 + debtAnnualRate, months / 12);

    if (invested < debtFV) low = mid;
    else high = mid;
  }

  return { grossAnnualRate: (low + high) / 2, taxRate };
}

function createSeededRandom(seed = 123456789) {
  let state = seed >>> 0;
  return function random() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function normalRandom(random, mean = 0, std = 1) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

function sampleStandardDeviation(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function estimateCorrelation(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) {
    return 0;
  }

  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (varianceX === 0 || varianceY === 0) return 0;
  return Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY)));
}

function monteCarloDebtVsInvestment({
  principal,
  debtAnnualRate,
  investmentAnnualRate,
  months,
  simulations = 5000,
  investmentVolatility = 0.015,
  debtVolatility = 0,
  correlation = 0,
  seed = 42,
}) {
  const random = createSeededRandom(seed);
  const rho = Math.max(-1, Math.min(1, correlation));

  let investWins = 0;
  let deltaSum = 0;
  const deltas = [];

  for (let i = 0; i < simulations; i++) {
    const z1 = normalRandom(random);
    const z2 = normalRandom(random);
    const correlatedZ2 = rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2;

    const simulatedInvestmentRate = Math.max(
      -0.99,
      investmentAnnualRate + z1 * investmentVolatility
    );
    const simulatedDebtRate = Math.max(
      -0.99,
      debtAnnualRate + correlatedZ2 * debtVolatility
    );

    const investmentFV = netInvestmentFutureValue(
      principal,
      simulatedInvestmentRate,
      months
    ).netFutureValue;

    const avoidedDebtFV = principal * Math.pow(1 + simulatedDebtRate, months / 12);
    const delta = investmentFV - avoidedDebtFV;

    if (delta > 0) investWins++;
    deltaSum += delta;
    deltas.push(delta);
  }

  deltas.sort((a, b) => a - b);
  const percentile = (p) => deltas[Math.min(deltas.length - 1, Math.floor(p * deltas.length))];

  return {
    simulations,
    investWinRate: investWins / simulations,
    amortizeWinRate: 1 - investWins / simulations,
    meanDelta: deltaSum / simulations,
    p05Delta: percentile(0.05),
    medianDelta: percentile(0.50),
    p95Delta: percentile(0.95),
    seed,
  };
}

module.exports = {
  annualToMonthlyRate,
  taxRateForHoldingPeriod,
  netInvestmentFutureValue,
  priceSchedule,
  sacSchedule,
  summarizeSchedule,
  financingComparison,
  breakEvenGrossRate,
  createSeededRandom,
  normalRandom,
  sampleStandardDeviation,
  estimateCorrelation,
  monteCarloDebtVsInvestment,
};
