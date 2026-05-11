// Edit mode is enabled by adding ?edit=1 to the URL. Without it the page
// just displays the note from memories.js — no editing, no localStorage writes.
const EDIT_MODE = new URLSearchParams(location.search).has('edit');
if (EDIT_MODE) document.body.classList.add('edit-mode');

// ── Read photo from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const photo  = params.get('photo');
if (!photo) location.href = 'index.html';

const entry = MEMORIES.find(m => m.photo === photo);
if (entry?.title) document.title = entry.title.toLowerCase();

// Back link preserves the edit flag so you stay in editor flow
if (EDIT_MODE) {
  const back = document.querySelector('.back-link');
  if (back) back.href = 'index.html?edit=1';
}

// ── Note ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = `note:${photo}`;
const PLACEHOLDER = EDIT_MODE ? 'click here to write a note…' : '';
const noteEl      = document.getElementById('note-box');

// In edit mode, prefer the user's locally-saved draft; otherwise use memories.js
const saved   = EDIT_MODE ? localStorage.getItem(STORAGE_KEY) : null;
const initial = saved !== null ? saved : (entry?.note || '');

function showPlaceholder() {
  noteEl.textContent = PLACEHOLDER;
  noteEl.classList.add('is-placeholder');
}
function clearPlaceholder() {
  noteEl.textContent = '';
  noteEl.classList.remove('is-placeholder');
}

if (initial) {
  noteEl.textContent = initial;
} else if (EDIT_MODE) {
  showPlaceholder();
}

// Only allow editing when in edit mode
noteEl.setAttribute('contenteditable', EDIT_MODE ? 'true' : 'false');

if (EDIT_MODE) {
  noteEl.addEventListener('focus', () => {
    if (noteEl.classList.contains('is-placeholder')) clearPlaceholder();
  });
  noteEl.addEventListener('blur', () => {
    if (noteEl.innerText.trim() === '') showPlaceholder();
  });
  noteEl.addEventListener('input', () => {
    if (noteEl.classList.contains('is-placeholder')) return;
    localStorage.setItem(STORAGE_KEY, noteEl.innerText);
  });
}
