import { moveInstrumentation } from '../../scripts/scripts.js';

function closeSiblingsOnOpen(details, allDetails) {
  details.addEventListener('toggle', () => {
    if (details.open) {
      allDetails.forEach((d) => { if (d !== details) d.open = false; });
    }
  });
}

export default function decorate(block) {
  const items = [...block.children];
  const allDetails = [];

  items.forEach((row) => {
    if (!row.children[0] || !row.children[1]) return;
    const [labelCell, bodyCell, classCell] = row.children;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...labelCell.childNodes);

    const body = bodyCell;
    body.className = 'accordion-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);

    if (classCell?.textContent.trim().includes('defaultopen')) {
      details.open = true;
    }

    details.append(summary, body);
    row.replaceWith(details);
    allDetails.push(details);
  });

  const allowMultiple = block.classList.contains('allow-multiple-open');
  if (!allowMultiple) {
    allDetails.forEach((details) => closeSiblingsOnOpen(details, allDetails));
  }
}
