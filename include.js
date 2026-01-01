/* ============================================================
  include.js (Shared Layout Loader)
  - Loads header.html + footer.html into placeholders
  - Then wires up header behaviors:
    1) Shadow on scroll
    2) Active page highlight
    3) Mobile menu toggle
============================================================ */

async function loadFragment(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const res = await fetch(filePath, { cache: "no-store" });
    if (!res.ok) {
      console.error(`[include.js] Failed to load ${filePath}:`, res.status);
      return;
    }
    target.innerHTML = await res.text();
  } catch (err) {
    console.error(`[include.js] Error loading ${filePath}:`, err);
  }
}

function initHeaderEnhancements() {
  const header = document.getElementById("siteHeader");
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  // 1) Shadow on scroll (tiny “premium” depth)
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 2);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 2) Active link highlight based on file name
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const pageKey =
    file.includes("about") ? "about" :
    file.includes("services") ? "services" :
    file.includes("contact") ? "contact" :
    "index";

  document.querySelectorAll("[data-page]").forEach((a) => {
    if (a.getAttribute("data-page") === pageKey) a.classList.add("is-active");
  });

  // 3) Mobile menu toggle (only if button/menu exist)
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      const next = !isOpen;

      menuBtn.setAttribute("aria-expanded", String(next));
      mobileMenu.hidden = !next;

      // Bonus: when you tap a link, close menu (no “stuck open” nonsense)
      if (next) {
        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            menuBtn.setAttribute("aria-expanded", "false");
            mobileMenu.hidden = true;
          }, { once: true });
        });
      }
    });
  }
}

/* ============================================================
  Boot sequence
  - Load header + footer
  - THEN initialize header behaviors (must happen after injection)
============================================================ */
(async function boot() {
  await loadFragment("site-header-slot", "header.html");
  await loadFragment("site-footer-slot", "footer.html");
  initHeaderEnhancements();
})();
