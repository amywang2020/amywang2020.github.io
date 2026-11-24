/*
  works.js — the small touches on the publications, projects and reading pages:
    • each item slides in the first time it scrolls into view
    • hand-drawn blue underlines under the section labels
    • a hand-drawn circle around any item marked data-mark="circle"

  Needs rough.js and js/hand-drawn.js, loaded before this file.
*/

const appearObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      appearObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });
document.querySelectorAll('.works-item').forEach(el => appearObserver.observe(el));

/* The box around just the text inside an element (labels are full-width blocks,
   but the underline should only be as wide as the words). */
function textRect(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

function drawAnnotations() {
  const existing = document.getElementById('works-annotations');
  if (existing) existing.remove();

  const container = document.querySelector('.works-content');
  const containerRect = container.getBoundingClientRect();

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.id = 'works-annotations';
  svg.setAttribute('width', container.offsetWidth);
  svg.setAttribute('height', container.offsetHeight);
  Object.assign(svg.style, {
    position: 'absolute', top: '0', left: '0',
    overflow: 'visible', pointerEvents: 'none', zIndex: '5',
  });
  addCrayonFilter(svg, 'wk-crayon', { x: '-20%', y: '-40%', width: '140%', height: '180%' }, 5);
  container.appendChild(svg);
  const rc = rough.svg(svg);

  // Underline each section label.
  document.querySelectorAll('.works-group-label').forEach(label => {
    const rect = textRect(label);
    const x1 = rect.left - containerRect.left - 2;
    const x2 = rect.left - containerRect.left + rect.width + 2;
    const y = rect.top - containerRect.top + rect.height + 5;
    drawCrayonStrokes(svg, 'wk-crayon', 3, () =>
      rc.line(x1, y, x2, y, { stroke: CRAYON_BLUE, strokeWidth: 4, roughness: 1.8, disableMultiStroke: true })
    );
  });

  // Circle the marked item's first line.
  const marked = container.querySelector('[data-mark="circle"]');
  if (marked) {
    const rect = textRect(marked.querySelector('.works-item-line'));
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;
    drawCrayonStrokes(svg, 'wk-crayon', 3, () =>
      rc.ellipse(cx, cy, rect.width + 28, rect.height + 16,
        { stroke: CRAYON_BLUE, strokeWidth: 4, roughness: 2.5, fill: 'none', disableMultiStroke: true })
    );
  }
}

window.addEventListener('load', drawAnnotations);
window.addEventListener('resize', drawAnnotations);
