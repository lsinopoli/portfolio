// =========================================================
// Header: fade the bar from solid to 70% transparent as you scroll
// =========================================================
const root = document.documentElement;
const FADE_DISTANCE = 320;    // px of scrolling until the fade is complete
const MAX_TRANSPARENCY = 0.5; // 50% transparent at the end

function updateHeader() {
  const progress = Math.min(1, window.scrollY / FADE_DISTANCE);
  const alpha = 1 - MAX_TRANSPARENCY * progress;
  root.style.setProperty("--header-alpha", alpha.toFixed(3));
}
updateHeader();
window.addEventListener("scroll", () => requestAnimationFrame(updateHeader), { passive: true });

// =========================================================
// Gentle fade-in for sections and cards
// =========================================================
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

// =========================================================
// Footer year
// =========================================================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// =========================================================
// Stats: count up when they scroll into view
// =========================================================
const statNumbers = document.querySelectorAll(".stat-number[data-target]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || "";
  const duration = 900; // milliseconds: lower is faster
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3); // starts fast, eases at the end
    const value = Math.max(1, Math.round(1 + (target - 1) * eased));
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  statNumbers.forEach((el) => statObserver.observe(el));
}

// =========================================================
// Thumbnail videos: loop only a short section (e.g. first 3 seconds)
// =========================================================
document.querySelectorAll("video[data-loop-end]").forEach((video) => {
  const start = parseFloat(video.dataset.loopStart || 0);
  const end = parseFloat(video.dataset.loopEnd);

  function check() {
    if (video.currentTime >= end) video.currentTime = start;
    if (!video.paused) requestAnimationFrame(check);
  }

  video.addEventListener("loadedmetadata", () => { video.currentTime = start; });
  video.addEventListener("play", () => requestAnimationFrame(check));
  if (!video.paused) requestAnimationFrame(check);
});

// =========================================================
// Full-video popup
// =========================================================
const videoDialog = document.getElementById("videoDialog");
const dialogVideo = document.getElementById("dialogVideo");

function closeVideo() {
  dialogVideo.pause();
  dialogVideo.removeAttribute("src");
  videoDialog.close();
}

if (videoDialog && dialogVideo) {
  document.querySelectorAll("[data-video]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dialogVideo.src = btn.dataset.video;
      videoDialog.showModal();
      dialogVideo.play();
    });
  });
  videoDialog.querySelector(".video-close").addEventListener("click", closeVideo);
  videoDialog.addEventListener("click", (e) => { if (e.target === videoDialog) closeVideo(); });
  videoDialog.addEventListener("cancel", closeVideo); // Esc key
}
