// =====================================================
// ESI site script (safe on ALL pages)
// - Injects header/footer
// - Mobile menu toggle
// - Contact form submit ONLY if the form exists
// =====================================================

async function injectPartials() {
  // Header
  const headerMount = document.getElementById("site-header");
  if (headerMount) {
    try {
      const res = await fetch("header.html", { cache: "no-store" });
      headerMount.innerHTML = res.ok ? await res.text() : "";
    } catch (e) {
      console.warn("Header fetch failed:", e);
    }
  }

  // Footer
  const footerMount = document.getElementById("site-footer");
  if (footerMount) {
    try {
      const res = await fetch("footer.html", { cache: "no-store" });
      footerMount.innerHTML = res.ok ? await res.text() : "";
    } catch (e) {
      console.warn("Footer fetch failed:", e);
    }
  }
}

function initMobileMenu() {
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("mobilePanel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
}

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

function initContactForm() {
  // IMPORTANT: only runs if the form exists on this page
  const form = document.getElementById("quoteForm");
  const statusEl = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Grab values safely
    const name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const phone = (document.getElementById("phone")?.value || "").trim();
    const message = (document.getElementById("message")?.value || "").trim();

    // Services (checkboxes) optional
    const serviceChecks = Array.from(
      document.querySelectorAll('input[name="services"]:checked')
    );
    const services = serviceChecks.map((c) => c.value);

    if (statusEl) statusEl.textContent = "Sending...";

    try {
      // If you have a server endpoint later, put it here.
      // For now, we keep it from crashing and show a friendly message.
      // Example endpoint would be: fetch("/api/contact", { ... })
      await new Promise((r) => setTimeout(r, 400));

      if (statusEl) {
        statusEl.textContent =
          "✅ Message captured (email sending will be wired next).";
      }

      form.reset();
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "❌ Error sending. Try again.";
    }
  });
}

// Run after DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await injectPartials();

  // These must run AFTER injection so the menu button exists
  initMobileMenu();
  initReveal();

  // Safe: only runs on contact page
  initContactForm();
});
