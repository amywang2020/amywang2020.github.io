/*
  timeline.js — draws the timeline page from the entries in js/timeline-data.js.

  There are two layouts:
    • Wide screens (700px and up): a horizontal line that scrolls sideways.
      Literary entries sit above it on the blue crayon line, professional ones below.
    • Phones: the original vertical spine, literary on the left, professional on the right.
  The page redraws whenever the window's width changes.

  Needs rough.js and js/hand-drawn.js, loaded before this file.
*/

const PHONE_BREAKPOINT = 700;   // below this width (px), use the vertical layout
const SPINE_INK = '#272320';    // the main line and its end dots
const TEXT_INK = '#1a1817';     // professional ticks and stars on the horizontal layout
const PREVIEW_ITEMS = 3;        // bullet items shown before "+ N more"

TIMELINE.sort((a, b) => a.year - b.year);


/* ── Shared pieces ──────────────────────────────────────────────────────── */

function buildEntryHTML(item) {
  let html = '';
  if (item.title) html += `<div class="entry-title">${item.title}</div>`;
  if (item.desc) html += `<div class="entry-desc">${item.desc}</div>`;

  if (item.items && item.items.length > 0) {
    html += '<ul class="entry-items">';
    item.items.forEach((text, index) => {
      const hidden = index >= PREVIEW_ITEMS ? ' item-hidden' : '';
      html += `<li class="${hidden}">${text}</li>`;
    });
    html += '</ul>';
    if (item.items.length > PREVIEW_ITEMS) {
      html += `<span class="entry-more">+ ${item.items.length - PREVIEW_ITEMS} more</span>`;
    }
  }

  if (item.photo === 'placeholder') {
    html += `<div class="photo-wrap"><div class="photo-placeholder">
      <svg viewBox="0 0 175 125" xmlns="http://www.w3.org/2000/svg" fill="none">
        <line x1="2" y1="2" x2="173" y2="123" stroke="#a09890" stroke-width="1"/>
        <line x1="173" y1="2" x2="2" y2="123" stroke="#a09890" stroke-width="1"/>
      </svg></div></div>`;
  } else if (item.photo) {
    html += `<div class="photo-wrap"><img src="${item.photo}" alt="${item.title}" loading="lazy"></div>`;
  }

  if (item.annotation) html += `<span class="entry-annotation">${item.annotation}</span>`;
  return html;
}

/* Makes "+ N more" reveal the rest of an entry's bullet list when clicked. */
function wireMoreButton(entryEl) {
  const moreButton = entryEl.querySelector('.entry-more');
  if (!moreButton) return;
  moreButton.addEventListener('click', () => {
    entryEl.querySelectorAll('.item-hidden').forEach(li => li.classList.remove('item-hidden'));
    moreButton.remove();
  });
}

/* Corner points of a five-pointed star, turned by rotationDegrees. */
function starPoints(cx, cy, outerRadius, innerRadius, rotationDegrees) {
  const rotation = rotationDegrees * Math.PI / 180;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2 + rotation;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return points;
}

/* Each star is turned a little more than the one before, so they don't all match. */
function starRotation(index) {
  return (index * 19) % 45;
}

/* Three small dots after the end of the line, in black and blue on top of each other.
   across = true runs them sideways (horizontal layout), false runs them downward. */
function drawEndDots(rc, svg, x, y, across) {
  for (let i = 0; i < 3; i++) {
    const dotX = across ? x + 12 + i * 9 : x;
    const dotY = across ? y : y + 12 + i * 9;
    svg.appendChild(rc.circle(dotX, dotY, 3, { stroke: SPINE_INK, strokeWidth: 0.8, fill: SPINE_INK, fillStyle: 'solid', roughness: 0.6 }));
    svg.appendChild(rc.circle(dotX, dotY, 3, { stroke: CRAYON_BLUE, strokeWidth: 0.8, fill: CRAYON_BLUE, fillStyle: 'solid', roughness: 0.6 }));
  }
}

/* The blue crayon line: a wobbly curve through the given points, gone over 4 times. */
function drawBlueLine(rc, svg, points) {
  drawCrayonStrokes(svg, 'crayon', 4, () =>
    rc.curve(points, { stroke: CRAYON_BLUE, strokeWidth: 4, roughness: 2.2, bowing: 0.4, disableMultiStroke: true })
  );
}


/* ── Phone layout: vertical spine ─────────────────────────────────────────
   The original design. Entries fade in as they scroll into view, and the star
   closest to your scroll position glows gold.
*/

const VERTICAL = {
  svgWidth: 220,         // width of the drawing strip down the middle
  padTop: 70,            // space before the first entry
  padBottom: 100,        // space after the last entry
  branchLength: 75,      // how far each tick reaches from the spine
  entryGap: 28,          // space between entries on the same side
  yearGap: 32,           // extra space between years
  professionalDrop: 65,  // professional entries start this far below a year's literary ones
};
const SPINE_X = VERTICAL.svgWidth / 2;

/* Literary stars sit just off the spine, alternating left and right, so the blue line weaves. */
TIMELINE.filter(item => item.side === 'literary')
  .forEach((item, i) => { item.lineX = SPINE_X + (i % 2 === 0 ? -14 : 14); });
TIMELINE.filter(item => item.side === 'professional')
  .forEach(item => { item.lineX = SPINE_X; });

let glowHandler = null;
let revealObserver = null;

function renderVertical(startX) {
  const canvas = document.getElementById('tl-canvas');
  canvas.innerHTML = '';

  const canvasWidth = window.innerWidth - startX * 2;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.maxWidth = canvasWidth + 'px';
  canvas.style.marginLeft = startX + 'px';
  canvas.style.marginRight = '0';

  const entryWidth = Math.max(80, Math.floor(canvasWidth / 2 - VERTICAL.branchLength - 10));

  // Pass 1: add every entry, hidden, so its height can be measured.
  const entryElems = new Map();
  for (const item of TIMELINE) {
    const el = document.createElement('div');
    el.className = `tl-entry ${item.side}`;
    el.style.width = entryWidth + 'px';
    el.style.top = '0px';
    el.style.visibility = 'hidden';
    if (item.side === 'professional') {
      el.style.left = `calc(50% + ${(item.lineX - SPINE_X) + VERTICAL.branchLength + 5}px)`;
    } else {
      el.style.right = `calc(50% + ${VERTICAL.branchLength + 5}px)`;
    }
    el.innerHTML = buildEntryHTML(item);
    canvas.appendChild(el);
    entryElems.set(item, el);
  }

  // Pass 2: stack each side's entries down the page, year by year, without overlaps.
  const byYear = {};
  TIMELINE.forEach(item => {
    if (!byYear[item.year]) byYear[item.year] = { literary: [], professional: [] };
    byYear[item.year][item.side].push(item);
  });
  const sortedYears = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  function stack(items, startY) {
    let y = startY;
    for (const item of items) {
      item.y = y;
      const height = entryElems.get(item).getBoundingClientRect().height;
      y += Math.max(height + 8, height + VERTICAL.entryGap + (item.extraGap || 0));
    }
    return y;
  }

  let literaryY = VERTICAL.padTop;
  let professionalY = VERTICAL.padTop;
  const yearPositions = [];

  for (const year of sortedYears) {
    const literary = byYear[year].literary;
    const professional = byYear[year].professional;
    const extra = yearPositions.length > 0 ? VERTICAL.yearGap : 0;
    const yearY = Math.max(literaryY, professionalY) + extra;
    yearPositions.push({ year, y: yearY });

    const literaryEnd = stack(literary, Math.max(literaryY, yearY));
    if (literary.length > 0) literaryY = literaryEnd;

    const drop = literary.length > 0 ? VERTICAL.professionalDrop : 0;
    const professionalEnd = stack(professional, Math.max(professionalY, yearY + drop));
    if (professional.length > 0) professionalY = professionalEnd;
  }

  const totalHeight = Math.max(literaryY, professionalY) + VERTICAL.padBottom;
  canvas.style.height = totalHeight + 'px';

  // Pass 3: move entries into place. They start invisible and fade in on scroll.
  for (const item of TIMELINE) {
    const el = entryElems.get(item);
    el.style.top = (item.y + 14) + 'px';
    el.style.visibility = '';
    el.style.opacity = '0';
    wireMoreButton(el);
  }

  // Drawing: spine, blue line, end dots, year labels, then ticks and stars.
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', VERTICAL.svgWidth);
  svg.setAttribute('height', totalHeight);
  Object.assign(svg.style, {
    position: 'absolute', top: '0', left: '50%',
    transform: 'translateX(-50%)', overflow: 'visible', pointerEvents: 'none',
  });
  canvas.appendChild(svg);
  const rc = rough.svg(svg);

  addCrayonFilter(svg, 'crayon', { x: '-15%', y: '-5%', width: '130%', height: '110%' }, 6);

  const lineEnd = totalHeight - VERTICAL.padBottom + 20;
  svg.appendChild(rc.line(SPINE_X, VERTICAL.padTop - 20, SPINE_X, lineEnd,
    { stroke: SPINE_INK, strokeWidth: 1.2, roughness: 0.4, bowing: 0 }));

  const literaryItems = TIMELINE.filter(item => item.side === 'literary').sort((a, b) => a.y - b.y);
  if (literaryItems.length > 0) {
    const points = [[SPINE_X, literaryItems[0].y - 40]];
    literaryItems.forEach(item => points.push([item.lineX, item.y + 23]));
    points.push([SPINE_X, lineEnd]);
    drawBlueLine(rc, svg, points);
  }

  drawEndDots(rc, svg, SPINE_X, lineEnd, false);

  for (const { year, y } of yearPositions) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', SPINE_X + 14);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'start');
    label.setAttribute('font-family', "'Helvetica Neue', Helvetica, Arial, sans-serif");
    label.setAttribute('font-size', '22');
    label.setAttribute('font-style', 'italic');
    label.setAttribute('letter-spacing', '0.5');
    label.setAttribute('fill', '#a09890');
    label.textContent = year;
    svg.appendChild(label);
  }

  const stars = [];
  TIMELINE.forEach((item, index) => {
    const isLiterary = item.side === 'literary';
    const y = item.y + 23;
    const direction = isLiterary ? -1 : 1;
    const color = isLiterary ? CRAYON_BLUE : SPINE_INK;
    const fill = isLiterary ? '#eef6fb' : '#ffffff';
    const starX = item.lineX;
    const tickLength = isLiterary
      ? item.lineX - SPINE_X + VERTICAL.branchLength
      : VERTICAL.branchLength;

    svg.appendChild(rc.line(starX, y, starX + direction * tickLength, y,
      { stroke: color, strokeWidth: 1.0, roughness: 0.5, bowing: 0 }));

    const star = rc.polygon(starPoints(starX, y, 14, 6, starRotation(index)),
      { stroke: color, strokeWidth: 1.0, fill: fill, fillStyle: 'solid', roughness: 0.8 });
    star.style.transition = 'filter 0.25s ease';
    svg.appendChild(star);
    stars.push({ el: star, y: y });
  });

  stars.sort((a, b) => a.y - b.y);
  startGlow(stars);
}

/* Gives the star matching your scroll position a gold glow. */
function startGlow(stars) {
  stopGlow();
  glowHandler = function () {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    const closest = stars[Math.round(progress * (stars.length - 1))].el;
    for (const { el } of stars) {
      el.style.filter = el === closest
        ? 'drop-shadow(0 0 3px #ffd700) drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 20px #ffaa00)'
        : '';
    }
  };
  window.addEventListener('scroll', glowHandler, { passive: true });
  glowHandler();
}

function stopGlow() {
  if (glowHandler) {
    window.removeEventListener('scroll', glowHandler);
    glowHandler = null;
  }
}

/* Fades each entry in the first time it scrolls into view. */
function revealOnScroll() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('tl-reveal');
        entry.target.style.opacity = '';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01 });
  document.querySelectorAll('.tl-entry').forEach(el => revealObserver.observe(el));
}


/* ── Wide-screen layout: horizontal line ──────────────────────────────────
   Years run left to right. Within each year, professional entries start half a
   slot after literary ones, so blue and black stars never line up vertically.
*/

const HORIZONTAL = {
  entryWidth: 180,       // keep in step with .entry { width } in timeline.html
  entryGap: 32,          // space between neighboring entries on the same side
  yearLabelWidth: 64,    // room for the year label before a year's first entry
  minYearWidth: 140,     // years are at least this far apart
  tick: 44,              // length of the tick between an entry and the line
  edge: 40,              // space above the tallest entry and below the lowest
};

function drawHorizontal(track, startX) {
  const slot = HORIZONTAL.entryWidth + HORIZONTAL.entryGap;
  const years = [...new Set(TIMELINE.map(item => item.year))].sort((a, b) => a - b);

  // Work out where each year starts and where each entry goes.
  const entries = [];
  const yearPositions = [];
  const rightEdge = { literary: startX, professional: startX };
  let lastYearX = startX - HORIZONTAL.minYearWidth;

  for (const year of years) {
    const yearX = Math.max(lastYearX + HORIZONTAL.minYearWidth, rightEdge.literary, rightEdge.professional);
    yearPositions.push({ year: year, x: yearX });
    lastYearX = yearX;

    for (const side of ['literary', 'professional']) {
      const stagger = side === 'professional' ? slot / 2 : 0;
      let x = Math.max(yearX + HORIZONTAL.yearLabelWidth + stagger, rightEdge[side]);
      for (const item of TIMELINE) {
        if (item.year === year && item.side === side) {
          entries.push({ item: item, x: x });
          x += slot;
        }
      }
      rightEdge[side] = Math.max(rightEdge[side], x);
    }
  }

  // Add the entries, then size the track to fit the tallest ones above and below the line.
  for (const entry of entries) {
    const el = document.createElement('div');
    el.className = 'entry ' + entry.item.side;
    el.innerHTML = buildEntryHTML(entry.item);
    el.style.left = entry.x + 'px';
    wireMoreButton(el);
    track.appendChild(el);
    entry.el = el;
  }

  let tallestAbove = 0;
  let tallestBelow = 0;
  for (const entry of entries) {
    if (entry.item.side === 'literary') {
      tallestAbove = Math.max(tallestAbove, entry.el.offsetHeight);
    } else {
      tallestBelow = Math.max(tallestBelow, entry.el.offsetHeight);
    }
  }

  const lineY = HORIZONTAL.edge + tallestAbove + HORIZONTAL.tick;
  const width = Math.max(rightEdge.literary, rightEdge.professional) + startX;
  const height = lineY + HORIZONTAL.tick + tallestBelow + HORIZONTAL.edge;
  track.style.width = width + 'px';
  track.style.height = height + 'px';

  // Drawing: main line, ticks, blue line, end dots, then stars on top.
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  track.insertBefore(svg, track.firstChild);
  const rc = rough.svg(svg);

  addCrayonFilter(svg, 'crayon', { x: '-15%', y: '-15%', width: '130%', height: '130%' }, 6);

  const lineEnd = width - startX;
  svg.appendChild(rc.line(startX, lineY, lineEnd, lineY, { stroke: SPINE_INK, strokeWidth: 1.2, roughness: 0.4, bowing: 0 }));

  entries.sort((a, b) => a.x - b.x);
  const bluePoints = [[startX, lineY]];
  let literaryCount = 0;

  for (const entry of entries) {
    const isLiterary = entry.item.side === 'literary';
    const color = isLiterary ? CRAYON_BLUE : TEXT_INK;
    entry.starX = entry.x + 8;
    entry.starY = lineY;

    // Literary stars sit just above or below the line, alternating, so the blue line weaves.
    if (isLiterary) {
      entry.starY = lineY + (literaryCount % 2 === 0 ? -14 : 14);
      literaryCount++;
      bluePoints.push([entry.starX, entry.starY]);
    }

    const tickEnd = isLiterary ? lineY - HORIZONTAL.tick + 4 : lineY + HORIZONTAL.tick - 4;
    svg.appendChild(rc.line(entry.starX, entry.starY, entry.starX, tickEnd, { stroke: color, strokeWidth: 1, roughness: 0.5, bowing: 0 }));

    entry.el.style.top = isLiterary
      ? (lineY - HORIZONTAL.tick - entry.el.offsetHeight) + 'px'
      : (lineY + HORIZONTAL.tick) + 'px';
  }

  bluePoints.push([lineEnd, lineY]);
  drawBlueLine(rc, svg, bluePoints);
  drawEndDots(rc, svg, lineEnd, lineY, true);

  entries.forEach((entry, index) => {
    const isLiterary = entry.item.side === 'literary';
    const color = isLiterary ? CRAYON_BLUE : TEXT_INK;
    const fill = isLiterary ? '#eef6fb' : '#ffffff';
    svg.appendChild(rc.polygon(starPoints(entry.starX, entry.starY, 11, 5, starRotation(index)),
      { stroke: color, strokeWidth: 1, fill: fill, fillStyle: 'solid', roughness: 0.6 }));
  });

  for (const position of yearPositions) {
    const label = document.createElement('div');
    label.className = 'year';
    label.textContent = position.year;
    label.style.left = position.x + 'px';
    label.style.top = lineY + 'px';
    track.appendChild(label);
  }
}


/* ── Pick a layout and keep it up to date ─────────────────────────────── */

function drawTimeline() {
  const verticalCanvas = document.getElementById('tl-canvas');
  const scroller = document.getElementById('scroller');
  const track = document.getElementById('track');
  const hint = document.querySelector('.hint');

  // Line the timeline up with the left edge of the name in the header.
  const startX = document.querySelector('.site-title').getBoundingClientRect().left;
  track.innerHTML = '';

  if (window.innerWidth < PHONE_BREAKPOINT) {
    hint.style.display = 'none';
    scroller.style.display = 'none';
    verticalCanvas.style.display = '';
    renderVertical(startX);
    revealOnScroll();
  } else {
    stopGlow();
    verticalCanvas.style.display = 'none';
    verticalCanvas.innerHTML = '';
    hint.style.display = '';
    scroller.style.display = '';
    drawHorizontal(track, startX);
  }
}

/* Lets an ordinary mouse wheel scroll the horizontal timeline sideways. */
const scroller = document.getElementById('scroller');
scroller.addEventListener('wheel', (event) => {
  const canScrollSideways = scroller.scrollWidth > scroller.clientWidth;
  if (canScrollSideways && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    scroller.scrollLeft += event.deltaY;
    event.preventDefault();
  }
}, { passive: false });

/* Redraw when the width changes (not on height-only changes, like a phone's
   address bar hiding, which would otherwise redraw on every scroll). */
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastWidth) {
    lastWidth = window.innerWidth;
    drawTimeline();
  }
});

window.addEventListener('load', drawTimeline);
