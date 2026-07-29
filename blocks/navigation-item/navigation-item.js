/**
 * Tags the block with its authored type (logo / nav-item / cta) as a
 * data attribute so header.js can select and route each instance.
 * The "classes" model field is an xwalk reserved field name — its value
 * is applied directly as a CSS class on the block wrapper, so the class
 * is already present on `block` by the time this runs.
 */
export default function decorate(block) {
  const type = [...block.classList].find((c) => ['logo', 'cta'].includes(c)) || 'nav-item';
  block.dataset.navType = type;
}
