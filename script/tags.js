import { addListItemEvent, dismissTopOverlay, escapeHtml, highlightedList, pushOverlay } from './app.js';
import { purgeTagFromAssignments, tagCaseCount } from './tag-assignments.js';

// ═══════════════════════════════════════════════════════════════════════════
//  TAGS
//  Owns the tag definitions and the management modal (add, rename, recolor,
//  reorder, delete). Assigning tags to cases is handled separately.
//
//  A tag is { id, name, color }. TAG_DEFAULTS is used until the user edits the
//  list; from then on the full list is persisted to localStorage (per-browser)
//  and read back as an override.
// ═══════════════════════════════════════════════════════════════════════════

const TAG_STORAGE_KEY = 'userTags';

// Default tags. Colors are chosen to sit well on the dark theme.
const TAG_DEFAULTS = [
    { id: 'learning',  name: 'learning',  color: '#48cae4' }, // cyan (matches brand)
    { id: 'shaky',     name: 'shaky',     color: '#f0883e' }, // orange
    { id: 'perfected', name: 'perfected', color: '#57d97f' }, // green
    { id: 'review',    name: 'review',    color: '#e9c46a' }, // yellow
];

// Curated palette offered in the color picker — one swatch per hue, ordered
// around the colour wheel (warm → cool) with a neutral grey to finish.
const TAG_PALETTE = [
    '#e05c5c', // red
    '#f0883e', // orange
    '#e9c46a', // yellow
    '#57d97f', // green
    '#3fb6a8', // teal
    '#48cae4', // cyan
    '#5fa8f0', // blue
    '#7f8cff', // indigo
    '#9b8cf0', // purple
    '#cf6fe0', // magenta
    '#f06fa0', // pink
    '#c8c8c8', // grey
];

let _tags = null;

// ── Store ──────────────────────────────────────────────────────────────────

function loadTags() {
    if (_tags) return _tags;
    try {
        const raw = localStorage.getItem(TAG_STORAGE_KEY);
        if (raw) { _tags = JSON.parse(raw); return _tags; }
    } catch (e) {}
    _tags = TAG_DEFAULTS.map(t => ({ ...t }));
    return _tags;
}

function saveTags() {
    try { localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(_tags)); } catch (e) {}
}

// Accessor for the current tag list, for use by other modules.
export function getTags() { return loadTags(); }

// ── Import / export (used by the shared JSON download/upload) ─────────────────

export function exportTagsRaw() { return localStorage.getItem(TAG_STORAGE_KEY); }

export function importTagsRaw(raw) {
    if (raw == null) return;
    try {
        JSON.parse(raw); // validate before persisting
        localStorage.setItem(TAG_STORAGE_KEY, raw);
        _tags = null;     // force reload from the new override
        renderTagList();
    } catch (e) {}
}

function tagNewId() {
    return 'tag-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Mutations ──────────────────────────────────────────────────────────────

function addTag() {
    loadTags();
    const color = TAG_PALETTE[_tags.length % TAG_PALETTE.length];
    _tags.push({ id: tagNewId(), name: 'new tag', color });
    saveTags();
    renderTagList();
    // Focus the freshly added name so the user can rename immediately.
    const inputs = document.querySelectorAll('#tag-list .tag-name-input');
    const last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
}

export function deleteTag(id) {
    loadTags();
    _tags = _tags.filter(t => t.id !== id);
    saveTags();
    purgeTagFromAssignments(id); // drop its case attachments in both trainers
    renderTagList();
}

function renameTag(id, name) {
    loadTags();
    const t = _tags.find(t => t.id === id);
    if (t) { t.name = name; saveTags(); }
}

function setTagColor(id, color, rerender = true) {
    loadTags();
    const t = _tags.find(t => t.id === id);
    if (!t) return;
    t.color = color;
    saveTags();
    if (rerender) {
        renderTagList();
    } else {
        const dot = document.querySelector(`#tag-list .tag-color-dot[data-id="${id}"]`);
        if (dot) dot.style.setProperty('--tag-color', color);
    }
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderTagList() {
    const list = document.getElementById('tag-list');
    if (!list) return;
    const tags = loadTags();

    if (!tags.length) {
        list.innerHTML = '<div class="tag-empty">No tags. Add one below.</div>';
        return;
    }

    list.innerHTML = tags.map((t) => `
        <div class="tag-row" data-id="${escapeHtml(t.id)}">
            <span class="tag-drag" data-tip="Drag to reorder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
            </span>
            <button class="tag-color-dot" data-id="${escapeHtml(t.id)}" style="--tag-color:${escapeHtml(t.color)}" data-tip="Change color"></button>
            <input class="tag-name-input" data-id="${escapeHtml(t.id)}" value="${escapeHtml(t.name)}" maxlength="24" spellcheck="false" />
            <button class="tag-del-btn" data-id="${escapeHtml(t.id)}" data-tip="Delete tag">✕</button>
        </div>
    `).join('');

    renderTagMenu(); // keep the lists-modal "Your tags" submenu in sync
}

// Renders the read-only "Your tags" submenu in the lists modal. Each row shows
// the tag's colour and how many cases it currently covers (in this trainer).
// Selecting/viewing/deleting is handled by the shared list-button listeners.
export function renderTagMenu() {
    const el = document.getElementById('usertags');
    if (!el) return;
    const tags = loadTags();
    el.innerHTML = tags.length
        ? tags.map(t =>
            `<div id="tagsel-${escapeHtml(t.id)}" class="list-item tag-list-item" data-tagid="${escapeHtml(t.id)}">` +
            `<span class="tag-swatch-dot" style="--tag-color:${escapeHtml(t.color)}"></span>` +
            `${escapeHtml(t.name)} (${tagCaseCount(t.id)})</div>`
          ).join('')
        : '<div class="sublist-empty">No tags yet.</div>';
    el.querySelectorAll('.list-item').forEach(addListItemEvent);
}

// Resolves the tag id of the currently highlighted "Your tags" row, or null.
export function highlightedTagId() {
    if (typeof highlightedList === 'string' && highlightedList.startsWith('tagsel-')) {
        return highlightedList.slice('tagsel-'.length);
    }
    return null;
}

// ── Modal open/close ───────────────────────────────────────────────────────

export function openTagModal() {
    renderTagList();
    const el = document.getElementById('tag-modal');
    el.style.display = 'flex';
    pushOverlay({ el, isPopup: true, close: () => { closeColorPopover(); el.style.display = 'none'; } });
}

function closeTagModal(e) {
    if (e && e.target !== document.getElementById('tag-modal')) return; // backdrop only
    dismissTopOverlay();
}

// ── Color picker popover ───────────────────────────────────────────────────

let _colorPopoverTagId = null;

function openColorPopover(dotEl, tagId) {
    closeColorPopover();
    _colorPopoverTagId = tagId;

    const pop = document.createElement('div');
    pop.className = 'tag-color-popover';
    pop.innerHTML =
        '<div class="tag-swatches">' +
        TAG_PALETTE.map(c =>
            `<button class="tag-swatch" data-color="${c}" style="--tag-color:${c}" data-tip="${c}"></button>`
        ).join('') +
        '</div>' +
        '<label class="tag-custom-color">Custom<input type="color" class="tag-color-input" /></label>';
    document.body.appendChild(pop);

    // Position below the dot, clamped to the viewport.
    const r = dotEl.getBoundingClientRect();
    pop.style.top  = (r.bottom + 8) + 'px';
    pop.style.left = r.left + 'px';
    const pr = pop.getBoundingClientRect();
    if (pr.right > window.innerWidth - 8)  pop.style.left = Math.max(8, window.innerWidth - 8 - pr.width) + 'px';
    if (pr.bottom > window.innerHeight - 8) pop.style.top = Math.max(8, r.top - pr.height - 8) + 'px';

    pop.querySelectorAll('.tag-swatch').forEach(sw =>
        sw.addEventListener('click', () => { setTagColor(_colorPopoverTagId, sw.dataset.color); closeColorPopover(); }));

    const ci  = pop.querySelector('.tag-color-input');
    const cur = loadTags().find(t => t.id === tagId);
    if (cur) ci.value = cur.color;
    ci.addEventListener('input',  () => setTagColor(_colorPopoverTagId, ci.value, false));
    ci.addEventListener('change', () => setTagColor(_colorPopoverTagId, ci.value));

    setTimeout(() => document.addEventListener('pointerdown', _colorOutsideClick), 0);
}

function _colorOutsideClick(e) {
    if (!e.target.closest('.tag-color-popover') && !e.target.closest('.tag-color-dot')) closeColorPopover();
}

function closeColorPopover() {
    document.removeEventListener('pointerdown', _colorOutsideClick);
    document.querySelectorAll('.tag-color-popover').forEach(p => p.remove());
    _colorPopoverTagId = null;
}

// ── Drag-to-reorder (pointer events → works on mouse + touch) ───────────────

let _tagDrag = null;

function tagDragStart(e, handle) {
    const row = handle.closest('.tag-row');
    if (!row) return;
    e.preventDefault();
    _tagDrag = row;
    row.classList.add('dragging');
    document.addEventListener('pointermove', tagDragMove);
    document.addEventListener('pointerup',   tagDragEnd);
}

function tagDragMove(e) {
    if (!_tagDrag) return;
    const list = document.getElementById('tag-list');
    const others = [...list.querySelectorAll('.tag-row:not(.dragging)')];
    const after = others.find(r => {
        const rect = r.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
    });
    if (after) list.insertBefore(_tagDrag, after);
    else       list.appendChild(_tagDrag);
}

function tagDragEnd() {
    if (!_tagDrag) return;
    _tagDrag.classList.remove('dragging');
    document.removeEventListener('pointermove', tagDragMove);
    document.removeEventListener('pointerup',   tagDragEnd);
    _tagDrag = null;

    // Commit DOM order back to the store.
    const order = [...document.querySelectorAll('#tag-list .tag-row')].map(r => r.dataset.id);
    _tags = order.map(id => _tags.find(t => t.id === id)).filter(Boolean);
    saveTags();
}

// ── Event delegation ───────────────────────────────────────────────────────

document.getElementById('tag-list').addEventListener('input', (e) => {
    const input = e.target.closest('.tag-name-input');
    if (input) renameTag(input.dataset.id, input.value);
});

document.getElementById('tag-list').addEventListener('click', (e) => {
    const del = e.target.closest('.tag-del-btn');
    if (del) { deleteTag(del.dataset.id); return; }
    const dot = e.target.closest('.tag-color-dot');
    if (dot) { openColorPopover(dot, dot.dataset.id); return; }
});

document.getElementById('tag-list').addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.tag-drag');
    if (handle) tagDragStart(e, handle);
});

document.getElementById('tag-add-btn').addEventListener('click', addTag);
document.getElementById('tag-modal-close').addEventListener('click', () => closeTagModal());
document.getElementById('tag-modal').addEventListener('click', closeTagModal);
