// Fade the header bar from solid to 30% transparent as the visitor scrolls down.
const root = document.documentElement;
const FADE_DISTANCE = 320;   // px of scrolling until the fade is complete
const MAX_TRANSPARENCY = 0.3; // 30% transparent at the end

function updateHeader() {
  const progress = Math.min(1, window.scrollY / FADE_DISTANCE);
  const alpha = 1 - MAX_TRANSPARENCY * progress;
  root.style.setProperty("--header-alpha", alpha.toFixed(3));
}
updateHeader();
window.addEventListener("scroll", () => requestAnimationFrame(updateHeader), { passive: true });

// Gentle fade-in for sections and cards.
const revealTargets = document.querySelectorAll(
  ".hero .container > *, .stats li, .section h2, .card, .skill-group"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("visible"));
}

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
