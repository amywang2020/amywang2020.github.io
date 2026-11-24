/*
  hand-drawn.js — helpers for the sketchy, crayon-style drawings on the
  timeline and publications pages.

  Needs rough.js (https://roughjs.com), which each page loads before this file.
  rough.js draws wobbly "hand-drawn" lines; the crayon filter below adds grain.
*/

const SVG_NS = 'http://www.w3.org/2000/svg';
const CRAYON_BLUE = '#6aafd4';

function addFilterStep(filter, tagName, attributes) {
  const step = document.createElementNS(SVG_NS, tagName);
  for (const name in attributes) {
    step.setAttribute(name, attributes[name]);
  }
  filter.appendChild(step);
}

/*
  Builds an SVG <filter> that makes strokes look like crayon:
  it speckles the stroke with grain, then nudges its edges around.

    id      — name to reference it by, as filter="url(#id)"
    region  — how far past the shape the effect may spread,
              e.g. { x: '-15%', y: '-5%', width: '130%', height: '110%' }
    wobble  — how far the edges get pushed (bigger = rougher)
*/
function makeCrayonFilter(id, region, wobble) {
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', region.x);
  filter.setAttribute('y', region.y);
  filter.setAttribute('width', region.width);
  filter.setAttribute('height', region.height);

  addFilterStep(filter, 'feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '4', result: 'noise' });
  addFilterStep(filter, 'feColorMatrix', { type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 22 -8', in: 'noise', result: 'grain' });
  addFilterStep(filter, 'feComposite', { operator: 'in', in: 'SourceGraphic', in2: 'grain', result: 'textured' });
  addFilterStep(filter, 'feTurbulence', { type: 'fractalNoise', baseFrequency: '0.04', numOctaves: '2', result: 'wave' });
  addFilterStep(filter, 'feDisplacementMap', { in: 'textured', in2: 'wave', scale: String(wobble), xChannelSelector: 'R', yChannelSelector: 'G' });
  return filter;
}

/* Puts a crayon filter inside the <svg> so shapes drawn there can use it. */
function addCrayonFilter(svg, id, region, wobble) {
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.appendChild(makeCrayonFilter(id, region, wobble));
  svg.appendChild(defs);
}

/*
  Draws the same rough shape several times, faintly, through the crayon filter,
  so it looks like a crayon line gone over a few times.
  drawShape is a function that returns one rough.js shape each time it's called.
*/
function drawCrayonStrokes(svg, filterId, passes, drawShape) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('filter', 'url(#' + filterId + ')');
  for (let pass = 0; pass < passes; pass++) {
    const shape = drawShape();
    shape.style.opacity = '0.4';
    group.appendChild(shape);
  }
  svg.appendChild(group);
}
