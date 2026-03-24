const cursor = document.querySelector(".cursor");
const hoverables = document.querySelectorAll("a, button, .showcase-tile");
const showcaseStage = document.querySelector("[data-showcase-stage]");
const showcaseTiles = document.querySelectorAll(".showcase-tile");
const showcasePopup = document.querySelector("[data-showcase-popup]");
const popupTitle = document.querySelector("[data-popup-title]");
const popupCategory = document.querySelector("[data-popup-category]");
const popupNote = document.querySelector("[data-popup-note]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupCursor() {
  if (!cursor || prefersReducedMotion || window.innerWidth <= 760) return;

  const moveCursor = (event) => {
    cursor.classList.add("is-active");
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  };

  window.addEventListener("pointermove", moveCursor);
  window.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));

  hoverables.forEach((element) => {
    element.addEventListener("pointerenter", () => cursor.classList.add("is-hovering"));
    element.addEventListener("pointerleave", () => cursor.classList.remove("is-hovering"));
  });
}

function positionPopup(tile) {
  if (!showcaseStage || !showcasePopup || !tile) return;

  const stageRect = showcaseStage.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  const popupRect = showcasePopup.getBoundingClientRect();
  const gap = 18;

  let left = tileRect.left - stageRect.left + tileRect.width + gap;
  let top = tileRect.top - stageRect.top + tileRect.height * 0.16;

  if (left + popupRect.width > stageRect.width - 20) {
    left = tileRect.left - stageRect.left - popupRect.width - gap;
  }

  if (left < 20) {
    left = stageRect.width / 2 - popupRect.width / 2;
  }

  const maxTop = stageRect.height - popupRect.height - 20;
  top = Math.max(20, Math.min(top, maxTop));

  showcasePopup.style.left = `${left}px`;
  showcasePopup.style.top = `${top}px`;
}

function showPopup(tile) {
  if (!showcasePopup || !tile) return;

  if (popupTitle) popupTitle.textContent = tile.dataset.title || "";
  if (popupCategory) popupCategory.textContent = tile.dataset.category || "";
  if (popupNote) popupNote.textContent = tile.dataset.note || "";

  showcasePopup.classList.add("is-visible");
  showcasePopup.setAttribute("aria-hidden", "false");
  positionPopup(tile);
}

function hidePopup() {
  if (!showcasePopup) return;
  showcasePopup.classList.remove("is-visible");
  showcasePopup.setAttribute("aria-hidden", "true");
}

function preventDeadLinks() {
  showcaseTiles.forEach((tile) => {
    tile.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

setupCursor();
preventDeadLinks();

if (showcaseTiles.length) {
  showcaseTiles.forEach((tile) => {
    tile.addEventListener("pointerenter", () => showPopup(tile));
    tile.addEventListener("pointerleave", hidePopup);
    tile.addEventListener("focus", () => showPopup(tile));
    tile.addEventListener("blur", hidePopup);
  });

  window.addEventListener("resize", hidePopup);
}
