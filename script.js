// =========================================================
// Header: fade the bar from solid to 50% transparent as you scroll
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

// =========================================================
// Magnifier lens: a small round glass that follows the cursor
// and magnifies whatever is directly under it (desktop only)
// =========================================================
(function () {
  const LENS_SIZE = 50; // diameter of the circle, in px (change to make it bigger or smaller)
  const ZOOM = 1.8;     // how much it magnifies (1.5 = very subtle, 2.5 = strong)

  // Only on devices with a real mouse
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const lens = document.createElement("div");
  lens.className = "lens";
  lens.setAttribute("aria-hidden", "true");
  lens.style.width = LENS_SIZE + "px";
  lens.style.height = LENS_SIZE + "px";

  const world = document.createElement("div");
  world.className = "lens-world";
  lens.appendChild(world);
  document.body.appendChild(lens);

  let x = 0;
  let y = 0;
  let active = false;
  let queued = false;
  let rebuildTimer;

  // Makes a copy of the page that sits inside the lens
  function buildWorld() {
    world.textContent = "";
    const doc = document.documentElement;
    world.style.width = doc.clientWidth + "px";
    world.style.height = doc.scrollHeight + "px";

    Array.from(document.body.children).forEach((node) => {
      if (node === lens || node.tagName === "SCRIPT" || node.tagName === "DIALOG") return;
      const copy = node.cloneNode(true);

      copy.removeAttribute("id");
      copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

      // Videos are swapped for a plain block so the lens doesn't play a second copy
      copy.querySelectorAll("video").forEach((v) => {
        const placeholder = document.createElement("div");
        placeholder.className = v.className;
        placeholder.style.background = "#d8cdb4";
        v.replaceWith(placeholder);
      });

      // The header is fixed to the screen, so pin its copy to where it is right now
      if (copy.classList.contains("site-header")) {
        copy.style.position = "absolute";
        copy.style.top = window.scrollY + "px";
        copy.style.left = "0";
        copy.style.right = "0";
      }
      world.appendChild(copy);
    });
  }

  function render() {
    queued = false;
    lens.style.transform = "translate(" + (x - LENS_SIZE / 2) + "px, " + (y - LENS_SIZE / 2) + "px)";
    const pageX = x + window.scrollX;
    const pageY = y + window.scrollY;
    world.style.transform =
      "translate(" + (LENS_SIZE / 2 - ZOOM * pageX) + "px, " + (LENS_SIZE / 2 - ZOOM * pageY) + "px) scale(" + ZOOM + ")";
  }

  function schedule() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  }

  function hide() {
    active = false;
    lens.classList.remove("on");
  }

  // Refresh the copy once scrolling or resizing stops
  function rebuildSoon() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(buildWorld, 200);
  }

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (videoDialog && videoDialog.open) { hide(); return; }
    x = e.clientX;
    y = e.clientY;
    if (!active) {
      active = true;
      buildWorld();
      lens.classList.add("on");
    }
    schedule();
  });

  document.documentElement.addEventListener("mouseleave", hide);
  window.addEventListener("blur", hide);
  window.addEventListener("scroll", () => { if (active) { schedule(); rebuildSoon(); } }, { passive: true });
  window.addEventListener("resize", () => { if (active) rebuildSoon(); });
})();
