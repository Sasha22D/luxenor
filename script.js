// Navbar scroll effect — runs on load AND on scroll
const navbar = document.getElementById('navbar');

function updateNavbar() {
  // On service pages (no full-screen hero), always show scrolled style if past threshold
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', updateNavbar);
updateNavbar(); // apply correct state immediately on page load

// On service pages, start navbar as visible (white) regardless of scroll
if (document.querySelector('.svc-hero')) {
  navbar.classList.add('scrolled');
}

// Mobile burger menu
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Contact form
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    this.reset();
    const msg = document.getElementById('formSuccess');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 5000);
  });
}

// Fade-in on scroll
const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: none !important; }';
document.head.appendChild(style);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.service-card, .stat-item, .why-list li, .about-col, .svc-fact, .svc-item, .step, .district-card, .alt-row'
).forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(22px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  observer.observe(el);
});
