// ── Photo layout ──────────────────────────────────────────────────────────────
// All photos are identical squares — only positions change.
// [left%, top%] traced from the reference image (780×952px).

const PHOTO_LAYOUT = [
  [ 14.3, 21.0 ],  //  1
  [ 68.5, 19.3 ],  //  2
  [ 36.9, 31.6 ],  //  3
  [ 15.7, 36.8 ],  //  4
  [ 26.7, 45.1 ],  //  5
  [ 60.8, 41.9 ],  //  6
  [ 49.5, 50.8 ],  //  7
  [ 24.8, 63.8 ],  //  8
  [ 15.3, 73.0 ],  //  9
  [ 47.4, 68.7 ],  // 10
  [ 68.0, 70.8 ],  // 11
];

// Edit mode is enabled by adding ?edit=1 to the URL. Without it the page
// is fully read-only: no editor bar, no drag-to-reposition, no drop-to-preview.
const EDIT_MODE = new URLSearchParams(location.search).has('edit');
if (EDIT_MODE) document.body.classList.add('edit-mode');

const field   = document.getElementById('photo-field');
const landing = document.getElementById('landing');
const frames  = [];

MEMORIES.forEach(({ photo, title }, i) => {
  const [left, top] = PHOTO_LAYOUT[i % PHOTO_LAYOUT.length];

  const frame      = document.createElement('div');
  frame.className  = 'photo-frame';
  frame.style.left = `${left}%`;
  frame.style.top  = `${top}%`;
  frame.dataset.idx = i;
  frame.dataset.pos = `${left.toFixed(1)}, ${top.toFixed(1)}`;

  frame.innerHTML = photo
    ? `<img src="photos/${photo}" alt="${title}" loading="lazy">`
    : `<div class="photo-placeholder"></div>`;
  if (photo) frame.dataset.photo = photo;

  enableDropPreview(frame);

  // In view mode, clicking a photo opens its detail page
  frame.addEventListener('click', () => {
    if (editing) return;
    const target = frame.dataset.photo;
    if (!target) return;
    window.location.href = `detail.html?photo=${encodeURIComponent(target)}`;
  });

  field.appendChild(frame);
  frames.push(frame);
});

// ── Drag-and-drop image preview ──────────────────────────────────────────────
// Drop any image file from your computer onto a photo box to preview it.
// Previews are in-memory only — refresh the page to revert.
function enableDropPreview(frame) {
  // All drop interactions are gated on `editing` so view mode is fully locked.
  frame.addEventListener('dragenter', (e) => {
    if (!editing) return;
    e.preventDefault();
    frame.classList.add('drop-target');
  });
  frame.addEventListener('dragover', (e) => {
    if (!editing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  frame.addEventListener('dragleave', (e) => {
    if (!editing) return;
    if (!frame.contains(e.relatedTarget)) frame.classList.remove('drop-target');
  });
  frame.addEventListener('drop', (e) => {
    if (!editing) return;
    e.preventDefault();
    frame.classList.remove('drop-target');
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      frame.dataset.filename = file.name;
      frame.innerHTML = `
        <img src="${reader.result}" alt="dropped preview">
        <span class="filename-label">${file.name}</span>`;
    };
    reader.readAsDataURL(file);
  });
}

// ── Copy filenames ────────────────────────────────────────────────────────────
document.getElementById('copy-filenames').addEventListener('click', async () => {
  const lines = frames.map((f, i) => {
    const name = f.dataset.filename || '— (none dropped)';
    return `  ${String(i + 1).padStart(2)}: ${name}`;
  });
  const dropped = frames.filter(f => f.dataset.filename).length;
  const text = `// ${dropped} of ${frames.length} photos assigned\n` + lines.join('\n');

  try {
    await navigator.clipboard.writeText(text);
    editStatus.textContent = `${dropped}/${frames.length} filenames copied to clipboard`;
  } catch (err) {
    console.log(text);
    editStatus.textContent = 'copy failed — names logged to console';
  }
  setTimeout(() => { editStatus.textContent = editing ? 'drag any photo. positions update live.' : ''; }, 4000);
});

// ── Editor: drag-to-reposition + save ─────────────────────────────────────────
const editToggle  = document.getElementById('edit-toggle');
const saveBtn     = document.getElementById('save-positions');
const editStatus  = document.getElementById('editor-status');
let   editing     = false;

editToggle.addEventListener('click', () => {
  editing = !editing;
  landing.classList.toggle('editing', editing);
  editToggle.textContent = editing ? 'done' : 'edit';
  editStatus.textContent = editing ? 'drag photos to move. drop image files to preview.' : '';
});

let dragState = null;

function onPointerDown(e) {
  if (!editing) return;
  const frame = e.target.closest('.photo-frame');
  if (!frame) return;
  e.preventDefault();
  frame.setPointerCapture(e.pointerId);
  frame.classList.add('dragging');

  const rect    = landing.getBoundingClientRect();
  const fRect   = frame.getBoundingClientRect();
  // Pointer offset within the frame so dragging feels anchored
  const offsetX = e.clientX - fRect.left;
  const offsetY = e.clientY - fRect.top;

  dragState = { frame, rect, offsetX, offsetY };
}

function onPointerMove(e) {
  if (!dragState) return;
  const { frame, rect, offsetX, offsetY } = dragState;
  let leftPx = e.clientX - rect.left - offsetX;
  let topPx  = e.clientY - rect.top  - offsetY;
  leftPx = Math.max(0, Math.min(leftPx, rect.width  - frame.offsetWidth));
  topPx  = Math.max(0, Math.min(topPx,  rect.height - frame.offsetHeight));
  const leftPct = (leftPx / rect.width)  * 100;
  const topPct  = (topPx  / rect.height) * 100;
  frame.style.left  = `${leftPct}%`;
  frame.style.top   = `${topPct}%`;
  frame.dataset.pos = `${leftPct.toFixed(1)}, ${topPct.toFixed(1)}`;
}

function onPointerUp(e) {
  if (!dragState) return;
  dragState.frame.classList.remove('dragging');
  dragState = null;
}

field.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

saveBtn.addEventListener('click', async () => {
  const lines = frames.map((f, i) => {
    const left = parseFloat(f.style.left);
    const top  = parseFloat(f.style.top);
    const idx  = String(i + 1).padStart(2);
    return `  [ ${left.toFixed(1).padStart(4)}, ${top.toFixed(1).padStart(4)} ],  // ${idx}`;
  });
  const code = `const PHOTO_LAYOUT = [\n${lines.join('\n')}\n];`;

  try {
    await navigator.clipboard.writeText(code);
    editStatus.textContent = 'copied to clipboard — paste into script.js';
  } catch (err) {
    console.log(code);
    editStatus.textContent = 'copy failed — code logged to console (open devtools)';
  }
  setTimeout(() => { if (editing) editStatus.textContent = 'drag any photo. positions update live.'; }, 4000);
});

// ── Export notes from localStorage to a memories.js-ready snippet ────────────
document.getElementById('export-notes').addEventListener('click', async () => {
  const lines = MEMORIES.map((m, i) => {
    const stored = localStorage.getItem(`note:${m.photo}`);
    const note   = stored != null ? stored : (m.note || '');
    const escaped = note.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const photo   = m.photo.replace(/"/g, '\\"');
    const title   = (m.title || '').replace(/"/g, '\\"');
    return `  { photo: "${photo}", title: "${title}", note: "${escaped}" },  // ${String(i + 1).padStart(2)}`;
  });
  const code = `const MEMORIES = [\n${lines.join('\n')}\n];`;
  try {
    await navigator.clipboard.writeText(code);
    editStatus.textContent = 'memories.js snippet copied — paste over the MEMORIES array';
  } catch (_err) {
    console.log(code);
    editStatus.textContent = 'copy failed — snippet logged to console';
  }
  setTimeout(() => { if (editing) editStatus.textContent = 'drag photos to move. drop image files to preview.'; }, 4500);
});

// ── Marquees ──────────────────────────────────────────────────────────────────
// Duplicate the text so the keyframe (translateX 0 → -50%) loops seamlessly.
function buildMarquee(trackId, text) {
  const track = document.getElementById(trackId);
  for (let i = 0; i < 2; i++) {
    const span       = document.createElement('span');
    span.className   = 'marquee-text';
    span.textContent = text;
    track.appendChild(span);
  }
}
buildMarquee('marquee-track-top',    TICKER_TEXT_TOP);
buildMarquee('marquee-track-bottom', TICKER_TEXT_BOTTOM);

