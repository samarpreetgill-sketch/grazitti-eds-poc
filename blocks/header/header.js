import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.classList.contains('nav-drop-button');
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav-drop sections (mega-menu triggers) closed, or to a
 * given expanded state.
 * @param {Element} sections The .nav-sections container element
 * @param {Boolean} expanded Whether the elements should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll(':scope > ul > li.nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
    const button = section.querySelector(':scope > .nav-drop-button');
    if (button) button.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav (mobile hamburger).
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop-button');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress / focus lost
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Builds the mega-menu panel (grouped link columns) for one "nav-item"
 * navigation-item block. Reads its authored nested structure positionally:
 * the block's own children are nav-group items, and each nav-group's
 * children are nav-link items — mirroring the row.children[N] convention
 * used elsewhere in this project (e.g. blocks/cards/cards.js).
 * @param {Element} navItemBlock The .navigation-item[data-nav-type="nav-item"] block
 * @returns {Element|null} the mega-menu panel, or null if there are no groups
 */
function buildMegaMenu(navItemBlock) {
  const groupRows = [...navItemBlock.children].slice(1); // first child is the title field
  if (!groupRows.length) return null;

  const panel = document.createElement('div');
  panel.className = 'mega-menu';

  const groupsWrapper = document.createElement('div');
  groupsWrapper.className = 'mega-menu-groups';

  groupRows.forEach((groupRow) => {
    const [headingCell, ...linkRows] = [...groupRow.children];
    if (!headingCell) return;

    const group = document.createElement('div');
    group.className = 'nav-group';

    const heading = document.createElement('p');
    heading.className = 'nav-group-heading';
    heading.textContent = headingCell.textContent.trim();
    group.append(heading);

    const list = document.createElement('ul');
    list.className = 'nav-group-links';
    linkRows.forEach((linkRow) => {
      const link = linkRow.querySelector('a');
      if (!link) return;
      const li = document.createElement('li');
      li.append(link);
      list.append(li);
    });
    group.append(list);

    groupsWrapper.append(group);
  });

  panel.append(groupsWrapper);
  return panel;
}

/**
 * Builds one <li class="nav-drop"> nav item with its mega-menu, from a
 * navigation-item[data-nav-type="nav-item"] block.
 * @param {Element} navItemBlock
 * @returns {Element}
 */
function buildNavItem(navItemBlock) {
  const titleCell = navItemBlock.children[0];
  const title = titleCell ? titleCell.textContent.trim() : '';

  const li = document.createElement('li');
  const megaMenu = buildMegaMenu(navItemBlock);

  if (megaMenu) {
    li.className = 'nav-drop';
    li.setAttribute('aria-expanded', 'false');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-drop-button';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = title;

    button.addEventListener('click', () => {
      if (!isDesktop.matches) return;
      const expanded = li.getAttribute('aria-expanded') === 'true';
      toggleAllNavSections(li.closest('.nav-sections'));
      li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });

    li.append(button, megaMenu);
  } else {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = title;
    li.append(link);
  }

  return li;
}

/**
 * Decorates the brand (logo) slot from a navigation-item[data-nav-type="logo"] block.
 * @param {Element} navBrand The .nav-brand section element
 */
function decorateBrand(navBrand) {
  const logoBlock = navBrand.querySelector('.navigation-item[data-nav-type="logo"]');
  if (!logoBlock) return;
  const picture = logoBlock.querySelector('picture');
  const link = logoBlock.querySelector('a');
  navBrand.textContent = '';
  const a = document.createElement('a');
  a.href = link ? link.href : '/';
  if (picture) a.append(picture);
  navBrand.append(a);
}

/**
 * Decorates the tools slot: CTA button(s) from navigation-item[data-nav-type="cta"] blocks.
 * @param {Element} navTools The .nav-tools section element
 */
function decorateTools(navTools) {
  const ctaBlocks = navTools.querySelectorAll('.navigation-item[data-nav-type="cta"]');
  navTools.textContent = '';
  ctaBlocks.forEach((ctaBlock) => {
    const link = ctaBlock.querySelector('a');
    if (!link) return;
    link.classList.add('button', 'primary');
    navTools.append(link);
  });
}

/**
 * Decorates the sections slot: builds the <ul> of nav-drop items from
 * navigation-item[data-nav-type="nav-item"] blocks.
 * @param {Element} navSections The .nav-sections section element
 */
function decorateSections(navSections) {
  const navItemBlocks = navSections.querySelectorAll('.navigation-item[data-nav-type="nav-item"]');
  navSections.textContent = '';
  const ul = document.createElement('ul');
  navItemBlocks.forEach((navItemBlock) => {
    ul.append(buildNavItem(navItemBlock));
  });
  navSections.append(ul);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) decorateBrand(navBrand);

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) decorateSections(navSections);

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) decorateTools(navTools);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
