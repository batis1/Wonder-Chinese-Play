const targets = new Map();
let observer;

function update(element, visible) {
  element.dataset.motionPaused = String(!visible || document.hidden);
}
function visibilityChanged() { targets.forEach((visible, element) => update(element, visible)); }

export function observeMotion(element) {
  if (!element || typeof IntersectionObserver === "undefined") return () => {};
  if (!observer) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (targets.has(entry.target)) {
          targets.set(entry.target, entry.isIntersecting);
          update(entry.target, entry.isIntersecting);
        }
      });
    }, { rootMargin: "100px" });
    document.addEventListener("visibilitychange", visibilityChanged);
  }
  targets.set(element, false);
  update(element, false);
  observer.observe(element);
  return () => {
    observer.unobserve(element);
    targets.delete(element);
    if (!targets.size) {
      observer.disconnect();
      observer = undefined;
      document.removeEventListener("visibilitychange", visibilityChanged);
    }
  };
}
