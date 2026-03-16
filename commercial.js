/* ── Tab System ─────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.style.opacity = 0;
    });
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + target);
    panel.classList.add('active');
    requestAnimationFrame(() => { panel.style.opacity = 1; });
  });
});
// init opacity on active panel
const initPanel = document.querySelector('.tab-panel.active');
if (initPanel) initPanel.style.opacity = 1;

/* ── Counter Animation ───────────────────────────────────────────────────── */
function animateCounter(el) {
  if (el.dataset.animated) return;
  el.dataset.animated = 'true';
  const raw = el.dataset.target;
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const isFloat = el.dataset.float === '1';
  const target = parseFloat(raw);
  const duration = 1800;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    const display = isFloat ? current.toFixed(1) : Math.round(current);
    el.textContent = prefix + display + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) animateCounter(e.target);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

/* ── Market cards — subtle parallax on mouse move ────────────────────────── */
document.querySelectorAll('.market-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
    card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.6s ease';
    setTimeout(() => card.style.transition = '', 600);
  });
});
