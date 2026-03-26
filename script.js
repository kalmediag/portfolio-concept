const cursor = document.querySelector(".cursor");
const hoverables = document.querySelectorAll("a, button, .showcase-tile");
const showcaseStage = document.querySelector("[data-showcase-stage]");
const showcaseTiles = document.querySelectorAll(".showcase-tile");
const showcasePopup = document.querySelector("[data-showcase-popup]");
const popupTitle = document.querySelector("[data-popup-title]");
const popupCategory = document.querySelector("[data-popup-category]");
const popupNote = document.querySelector("[data-popup-note]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktopInteractionMedia = window.matchMedia("(min-width: 761px) and (hover: hover) and (pointer: fine)");

let cursorEnabled = false;
let popupEnabled = false;
const tilePopupHandlers = new Map();
let activeTile = null;
let mobileScrollAnimationsEnabled = false;
let mobileAnimationFrame = null;

const moveCursor = (event) => {
  if (!cursorEnabled || !cursor) return;
  cursor.classList.add("is-active");
  cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
};

const hideCursor = () => {
  if (!cursor) return;
  cursor.classList.remove("is-active", "is-hovering");
};

const growCursor = () => {
  if (!cursorEnabled || !cursor) return;
  cursor.classList.add("is-hovering");
};

const shrinkCursor = () => {
  if (!cursor) return;
  cursor.classList.remove("is-hovering");
};

function hasDesktopInteractions() {
  return !prefersReducedMotion && desktopInteractionMedia.matches;
}

function shouldUseMobileScrollAnimations() {
  return !prefersReducedMotion && window.innerWidth <= 760;
}

function positionPopup(tile) {
  if (!showcaseStage || !showcasePopup || !tile) return;

  const popupRect = showcasePopup.getBoundingClientRect();
  const gap = 24;
  const padding = 24;
  const popupSide = tile.dataset.popupSide || "right";
  const popupShift = Number(tile.dataset.popupShift || 0);
  const tileLeft = tile.offsetLeft + tile.offsetWidth * popupShift;
  const tileTop = tile.offsetTop;
  const tileWidth = tile.offsetWidth;
  const tileHeight = tile.offsetHeight;
  const tileRight = tileLeft + tileWidth;
  const tileCenterY = tileTop + tileHeight / 2;

  let left = popupSide === "left" ? tileLeft - popupRect.width - gap : tileRight + gap;
  let top = tileCenterY - popupRect.height / 2;

  if (left + popupRect.width > showcaseStage.clientWidth - padding) {
    left = showcaseStage.clientWidth - popupRect.width - padding;
  }

  if (left < padding) {
    left = padding;
  }

  const maxTop = showcaseStage.clientHeight - popupRect.height - padding;
  top = Math.max(padding, Math.min(top, maxTop));

  showcasePopup.style.left = `${left}px`;
  showcasePopup.style.top = `${top}px`;
}

function showPopup(tile) {
  if (!popupEnabled || !showcasePopup || !tile) return;

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

function setActiveTile(tile) {
  if (!showcaseStage) return;

  if (activeTile && activeTile !== tile) {
    activeTile.classList.remove("is-active-tile");
  }

  activeTile = tile;

  if (tile) {
    showcaseStage.classList.add("is-hovering-tile");
    tile.classList.add("is-active-tile");
    return;
  }

  showcaseStage.classList.remove("is-hovering-tile");
}

function clearActiveTile(tile) {
  if (!showcaseStage || !tile) return;

  tile.classList.remove("is-active-tile");

  if (activeTile === tile) {
    activeTile = null;
    showcaseStage.classList.remove("is-hovering-tile");
  }
}

function enableCursor() {
  if (cursorEnabled || !cursor) return;

  cursorEnabled = true;
  document.body.classList.add("has-custom-cursor");
  window.addEventListener("pointermove", moveCursor);
  window.addEventListener("pointerleave", hideCursor);

  hoverables.forEach((element) => {
    element.addEventListener("pointerenter", growCursor);
    element.addEventListener("pointerleave", shrinkCursor);
  });
}

function disableCursor() {
  if (!cursorEnabled) return;

  cursorEnabled = false;
  document.body.classList.remove("has-custom-cursor");
  hideCursor();
  window.removeEventListener("pointermove", moveCursor);
  window.removeEventListener("pointerleave", hideCursor);

  hoverables.forEach((element) => {
    element.removeEventListener("pointerenter", growCursor);
    element.removeEventListener("pointerleave", shrinkCursor);
  });
}

function enablePopupInteractions() {
  if (popupEnabled || !showcaseTiles.length) return;

  popupEnabled = true;

  showcaseTiles.forEach((tile) => {
    const handleEnter = () => {
      setActiveTile(tile);
      showPopup(tile);
    };
    const handleLeave = () => {
      clearActiveTile(tile);
      hidePopup();
    };
    const handleFocus = () => {
      setActiveTile(tile);
      showPopup(tile);
    };
    const handleBlur = () => {
      clearActiveTile(tile);
      hidePopup();
    };

    tilePopupHandlers.set(tile, {
      handleEnter,
      handleLeave,
      handleFocus,
      handleBlur,
    });

    tile.addEventListener("pointerenter", handleEnter);
    tile.addEventListener("pointerleave", handleLeave);
    tile.addEventListener("focus", handleFocus);
    tile.addEventListener("blur", handleBlur);
  });
}

function disablePopupInteractions() {
  if (!popupEnabled) return;

  popupEnabled = false;
  hidePopup();
  setActiveTile(null);

  showcaseTiles.forEach((tile) => {
    const handlers = tilePopupHandlers.get(tile);
    if (!handlers) return;

    tile.removeEventListener("pointerenter", handlers.handleEnter);
    tile.removeEventListener("pointerleave", handlers.handleLeave);
    tile.removeEventListener("focus", handlers.handleFocus);
    tile.removeEventListener("blur", handlers.handleBlur);
  });

  tilePopupHandlers.clear();
}

function syncInteractionMode() {
  if (hasDesktopInteractions()) {
    document.body.classList.add("is-desktop-interactive");
    enableCursor();
    enablePopupInteractions();
  } else {
    document.body.classList.remove("is-desktop-interactive");
    disableCursor();
    disablePopupInteractions();
  }

  syncMobileScrollAnimations();
}

function preventDeadLinks() {
  showcaseTiles.forEach((tile) => {
    tile.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

function updateMobileScrollAnimations() {
  if (!mobileScrollAnimationsEnabled) {
    mobileAnimationFrame = null;
    return;
  }

  const viewportCenter = window.innerHeight * 0.52;
  const maxDistance = window.innerHeight * 0.72;

  showcaseTiles.forEach((tile) => {
    const rect = tile.getBoundingClientRect();
    const tileCenter = rect.top + rect.height / 2;
    const distance = Math.abs(viewportCenter - tileCenter);
    const progress = Math.max(0, 1 - distance / maxDistance);

    tile.style.setProperty("--mobile-grow", progress.toFixed(3));
    tile.classList.toggle("is-mobile-active", progress > 0.58);
  });

  mobileAnimationFrame = null;
}

function queueMobileScrollAnimations() {
  if (!mobileScrollAnimationsEnabled || mobileAnimationFrame) return;
  mobileAnimationFrame = window.requestAnimationFrame(updateMobileScrollAnimations);
}

function enableMobileScrollAnimations() {
  if (mobileScrollAnimationsEnabled || !shouldUseMobileScrollAnimations()) return;

  mobileScrollAnimationsEnabled = true;
  window.addEventListener("scroll", queueMobileScrollAnimations, { passive: true });
  queueMobileScrollAnimations();
}

function disableMobileScrollAnimations() {
  if (!mobileScrollAnimationsEnabled) return;

  mobileScrollAnimationsEnabled = false;
  window.removeEventListener("scroll", queueMobileScrollAnimations);

  if (mobileAnimationFrame) {
    window.cancelAnimationFrame(mobileAnimationFrame);
    mobileAnimationFrame = null;
  }

  showcaseTiles.forEach((tile) => {
    tile.style.removeProperty("--mobile-grow");
    tile.classList.remove("is-mobile-active");
  });
}

function syncMobileScrollAnimations() {
  if (shouldUseMobileScrollAnimations()) {
    enableMobileScrollAnimations();
    queueMobileScrollAnimations();
    return;
  }

  disableMobileScrollAnimations();
}

preventDeadLinks();
syncInteractionMode();

window.addEventListener("resize", () => {
  setActiveTile(null);
  hidePopup();
  syncInteractionMode();
});

if (desktopInteractionMedia.addEventListener) {
  desktopInteractionMedia.addEventListener("change", syncInteractionMode);
} else {
  desktopInteractionMedia.addListener(syncInteractionMode);
}
