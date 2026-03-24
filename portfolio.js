/* ═══════════════════════════════════════════════════
   PORTFOLIO.JS — Mortgage Simulator + Accordion
═══════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();

function fmt(n) {
  return 'AED ' + Math.round(n).toLocaleString('en-US');
}
function fmtShort(n) {
  if (n >= 1e6) return 'AED ' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return 'AED ' + (n / 1e3).toFixed(0) + 'K';
  return 'AED ' + Math.round(n);
}

/* ── Mortgage Calculation ─────────────────────────── */
function calcMortgage(price, downPct, years, annualRate) {
  const down   = price * downPct / 100;
  const loan   = price - down;
  const r      = annualRate / 100 / 12;
  const n      = years * 12;
  const monthly = r === 0
    ? loan / n
    : loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  let balance = loan;
  const labels = [], principals = [], interests = [], balances = [];

  for (let y = 1; y <= years; y++) {
    let yPrincipal = 0, yInterest = 0;
    for (let m = 0; m < 12; m++) {
      const imt = balance * r;
      const pmt = monthly - imt;
      yInterest   += imt;
      yPrincipal  += pmt;
      balance     -= pmt;
      if (balance < 0) balance = 0;
    }
    labels.push('Yr ' + y);
    principals.push(Math.round(yPrincipal));
    interests.push(Math.round(yInterest));
    balances.push(Math.round(balance));
  }

  return {
    down, loan, monthly, n,
    totalPaid: monthly * n,
    totalInterest: monthly * n - loan,
    labels, principals, interests, balances
  };
}

/* ── Cash Flow Calculation ────────────────────────── */
function calcCashflow(d, rent, years) {
  const monthlyCF  = rent - d.monthly;
  const annualCF   = monthlyCF * 12;

  // Cumulative payments (incl. down payment at year 0)
  const cumPayments = [d.down];
  const cumRents    = [0];
  for (let y = 1; y <= years; y++) {
    cumPayments.push(d.down + d.monthly * 12 * y);
    cumRents.push(rent * 12 * y);
  }

  // Payback: year when cumRent >= cumPayments
  let paybackYear = null;
  for (let y = 1; y <= years; y++) {
    if (cumRents[y] >= cumPayments[y]) { paybackYear = y; break; }
  }
  // If not within loan period, extrapolate
  if (!paybackYear && annualCF > 0) {
    const totalCost = d.down + d.monthly * 12 * years;
    paybackYear = Math.ceil(totalCost / (rent * 12));
  }

  return { monthlyCF, annualCF, paybackYear, cumPayments, cumRents };
}

/* ── Chart.js Colors ──────────────────────────────── */
const BROWN  = '#8B7355';
const TAUPE  = '#B5A99A';
const WHITE  = 'rgba(255,255,255,0.80)';
const WHITE2 = 'rgba(255,255,255,0.10)';
const BROWN_FILL = 'rgba(139,115,85,0.25)';
const WHITE_FILL = 'rgba(255,255,255,0.06)';

let cashflowChart = null;
let activeChart   = 'cashflow';

/* ── Cash Flow Chart ──────────────────────────────── */
function buildCashflowChart(data, cf, years) {
  const ctx = document.getElementById('simCashflow').getContext('2d');
  const xLabels = ['Start', ...data.labels];

  const cfg = {
    type: 'line',
    data: {
      labels: xLabels,
      datasets: [
        {
          label: 'Total Payments Made',
          data: cf.cumPayments,
          borderColor: BROWN,
          backgroundColor: BROWN_FILL,
          borderWidth: 2,
          fill: true,
          pointRadius: 0, pointHoverRadius: 5,
          tension: 0.2
        },
        {
          label: 'Cumulative Rent Received',
          data: cf.cumRents,
          borderColor: WHITE,
          backgroundColor: WHITE_FILL,
          borderWidth: 2,
          fill: true,
          pointRadius: 0, pointHoverRadius: 5,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 350 },
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { color: 'rgba(255,255,255,0.35)', font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 16 }
        },
        tooltip: {
          backgroundColor: '#1A1A1A',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          titleColor: 'rgba(255,255,255,0.5)', bodyColor: '#fff', padding: 12,
          callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + fmtShort(ctx.raw) }
        }
      },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 }, maxRotation: 0 }, grid: { color: WHITE2 } },
        y: {
          ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 },
            callback: v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : (v/1e3).toFixed(0)+'K'
          },
          grid: { color: WHITE2 }
        }
      }
    }
  };
  if (cashflowChart) { cashflowChart.data = cfg.data; cashflowChart.update(); }
  else               { cashflowChart = new Chart(ctx, cfg); }

  // Update payback callout
  const callout = document.getElementById('cashflowCallout');
  if (!callout) return;
  if (cf.paybackYear) {
    const paybackCalYear = CURRENT_YEAR + cf.paybackYear;
    callout.innerHTML =
      '<span class="cf-callout-icon">&#10003;</span> ' +
      'Your rental income will have covered <strong>all payments</strong> by ' +
      '<strong>Year ' + cf.paybackYear + ' (' + paybackCalYear + ')</strong>';
    callout.className = 'cf-callout cf-callout--positive';
  } else {
    callout.innerHTML =
      '<span class="cf-callout-icon">!</span> ' +
      'At this rent level, income does not fully cover payments within the loan period. ' +
      'Try increasing the expected rent.';
    callout.className = 'cf-callout cf-callout--negative';
  }
}

/* ── UI Update ────────────────────────────────────── */
function updateSim() {
  const price = +document.getElementById('slPrice').value;
  const down  = +document.getElementById('slDown').value;
  const years = +document.getElementById('slYears').value;
  const rate  = +document.getElementById('slRate').value;
  const rent  = +document.getElementById('slRent').value;

  document.getElementById('valPrice').textContent = 'AED ' + price.toLocaleString('en-US');
  document.getElementById('valDown').textContent  = down + '%';
  document.getElementById('valYears').textContent = years + ' year' + (years > 1 ? 's' : '');
  document.getElementById('valRate').textContent  = rate + '%';
  document.getElementById('valRent').textContent  = 'AED ' + rent.toLocaleString('en-US');

  const d  = calcMortgage(price, down, years, rate);
  const cf = calcCashflow(d, rent, years);

  // Basic results
  document.getElementById('resMonthly').textContent  = fmt(d.monthly);
  document.getElementById('resLoan').textContent     = fmt(d.loan);
  document.getElementById('resInterest').textContent = fmt(d.totalInterest);
  document.getElementById('resDown').textContent     = fmt(d.down);
  document.getElementById('resTotal').textContent    = fmt(d.totalPaid + d.down);

  // Cash flow results
  const cfEl = document.getElementById('resCashflow');
  const isPos = cf.monthlyCF >= 0;
  cfEl.textContent  = (isPos ? '+ ' : '− ') + 'AED ' + Math.abs(Math.round(cf.monthlyCF)).toLocaleString('en-US') + ' / mo';
  cfEl.className    = 'sim-res-val sim-cashflow ' + (isPos ? 'sim-cashflow--pos' : 'sim-cashflow--neg');

  const paidOffYear = CURRENT_YEAR + years;
  document.getElementById('resPaidOff').textContent = paidOffYear + ' (' + years + ' yrs)';

  if (cf.paybackYear) {
    document.getElementById('resPayback').textContent =
      cf.paybackYear + ' yrs  ·  ' + (CURRENT_YEAR + cf.paybackYear);
  } else {
    document.getElementById('resPayback').textContent = 'Beyond loan period';
  }

  // Charts
  buildCashflowChart(d, cf, years);
}

/* ── Range track fill ─────────────────────────────── */
function fillTrack(input) {
  const pct = (+input.value - +input.min) / (+input.max - +input.min) * 100;
  input.style.background =
    `linear-gradient(to right, #8B7355 ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
}

['slPrice','slDown','slYears','slRate','slRent'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => { fillTrack(el); updateSim(); });
  fillTrack(el);
});

/* ── Chart toggle tabs ────────────────────────────── */
document.querySelectorAll('.sim-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeChart = btn.dataset.chart;
    const price = +document.getElementById('slPrice').value;
    const down  = +document.getElementById('slDown').value;
    const years = +document.getElementById('slYears').value;
    const rate  = +document.getElementById('slRate').value;
    const rent  = +document.getElementById('slRent').value;
    const d  = calcMortgage(price, down, years, rate);
    const cf = calcCashflow(d, rent, years);

    buildCashflowChart(d, cf, years);
  });
});

// Init
updateSim();

/* ── Accordion ────────────────────────────────────── */
document.querySelectorAll('.acc-header').forEach(hdr => {
  hdr.addEventListener('click', () => {
    const item   = hdr.closest('.acc-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});
const firstAcc = document.querySelector('.acc-item');
if (firstAcc) firstAcc.classList.add('open');
