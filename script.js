/* ============================================================
  script.js (Page Behaviors Only)
  - NO header/footer injection here (include.js owns that job)
  - Safe on all pages:
    - reveal animation (if .reveal exists)
    - contact form status helper (if #contactForm exists)
============================================================ */

// Reveal-on-scroll (used across pages)
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.15 }
  );

  els.forEach((el) => obs.observe(el));
}

// Contact form helper (won't crash on non-contact pages)
function initContactForm() {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", () => {
    // We are NOT preventing submit here (FormSubmit needs the POST).
    // We just give the user feedback so it doesn’t feel like a dead button.
    if (statusEl) statusEl.textContent = "Sending…";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initContactForm();
});
