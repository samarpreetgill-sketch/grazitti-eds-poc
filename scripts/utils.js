/**
 * True when the page is rendering inside the Universal Editor iframe
 * (as opposed to preview/live delivery).
 */
export function isInUniversalEditor() {
  return document.body.classList.contains('adobe-ue-edit')
    || document.body.classList.contains('adobe-ue-preview')
    || window.location.ancestorOrigins?.[0]?.includes('adobeaemcloud.com');
}

/**
 * True when Universal Editor is actively in edit mode (authoring canvas).
 */
export function isUEEditMode() {
  return document.body.classList.contains('adobe-ue-edit');
}

/**
 * True when Universal Editor is rendering its preview surface.
 */
export function isUEPreviewMode() {
  return document.body.classList.contains('adobe-ue-preview');
}

/**
 * Moves consecutive grid-cols-* sections into the preceding grid-container
 * section, making them direct DOM children of that container. Skipped while
 * actively editing in Universal Editor so authors always see a flat,
 * editable list of sibling sections.
 * @param {Element} container Any element whose children should be scanned (normally <main>)
 */
export function addGridSectionsWrapper(container) {
  if (isUEEditMode() || (isInUniversalEditor() && !isUEPreviewMode())) return;
  let group = [];
  let currentContainer = null;

  const flush = () => {
    if (!group.length) return;
    if (currentContainer) {
      group.forEach((s) => currentContainer.append(s));
    }
    group = [];
    currentContainer = null;
  };

  [...container.children].forEach((child) => {
    if (child.matches('.section.grid-container')) {
      flush();
      currentContainer = child;
    } else if (child.matches('.section[class*="grid-cols-"]')) {
      group.push(child);
    } else {
      flush();
    }
  });
  flush();
}
