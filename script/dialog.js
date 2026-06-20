// ═══════════════════════════════════════════════════════════════════════════
//  APP DIALOG
//  Designed replacements for the browser's alert / confirm / prompt. Each opens
//  a styled modal and returns a Promise, so callers `await` the result instead
//  of blocking the main thread.
//
//   appAlert(msg)   → Promise<void>             (resolves when dismissed)
//   appConfirm(msg) → Promise<boolean>          (true = confirmed)
//   appPrompt(msg)  → Promise<string | null>    (null = cancelled)
//
//  Transient, non-blocking feedback uses the toast (showError / showInfo /
//  showSuccess) instead — dialogs are only for acknowledgement or input.
// ═══════════════════════════════════════════════════════════════════════════

// Low-level builder. `buttons` is [{ label, value, variant }]; `input`, when
// given, adds a text field and Enter submits the primary button's value.
function appDialog({ title = '', message = '', buttons, input = null, cancelValue }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'app-dialog-overlay';

        const box = document.createElement('div');
        box.className = 'app-dialog';
        box.innerHTML =
            (title ? `<div class="app-dialog-title"></div>` : '') +
            `<div class="app-dialog-msg"></div>` +
            (input ? `<input type="text" class="app-dialog-input" spellcheck="false" autocomplete="off" />` : '') +
            `<div class="app-dialog-buttons"></div>`;
        if (title) box.querySelector('.app-dialog-title').textContent = title;
        box.querySelector('.app-dialog-msg').textContent = message;

        const field = input ? box.querySelector('.app-dialog-input') : null;
        if (field) {
            if (input.placeholder) field.placeholder = input.placeholder;
            if (input.value)       field.value = input.value;
        }

        let done = false;
        function finish(value) {
            if (done) return;
            done = true;
            document.removeEventListener('keydown', onKey, true);
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 150);
            resolve(value);
        }

        // The primary button (last one) is what Enter triggers.
        const btnRow = box.querySelector('.app-dialog-buttons');
        buttons.forEach(b => {
            const el = document.createElement('button');
            el.className = 'app-dialog-btn' + (b.variant ? ' ' + b.variant : '');
            el.textContent = b.label;
            el.addEventListener('click', () => finish(field ? (b.primary ? field.value : b.value) : b.value));
            btnRow.appendChild(el);
        });

        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(cancelValue); }
            else if (e.key === 'Enter') {
                e.preventDefault(); e.stopPropagation();
                const primary = buttons.find(b => b.primary);
                finish(field ? (primary ? field.value : (primary?.value)) : (primary ?? buttons.at(-1)).value);
            }
        }
        document.addEventListener('keydown', onKey, true);

        overlay.addEventListener('mousedown', e => { if (e.target === overlay) finish(cancelValue); });

        overlay.appendChild(box);
        document.body.appendChild(overlay);
        // Focus the input (prompt) or the primary button.
        if (field) { field.focus(); field.select(); }
        else (btnRow.querySelector('.primary') || btnRow.lastElementChild)?.focus();
    });
}

function appAlert(message, { title = 'Notice', okText = 'OK' } = {}) {
    return appDialog({
        title, message, cancelValue: undefined,
        buttons: [{ label: okText, value: undefined, variant: 'primary', primary: true }],
    });
}

function appConfirm(message, { title = 'Confirm', okText = 'OK', cancelText = 'Cancel', danger = false } = {}) {
    return appDialog({
        title, message, cancelValue: false,
        buttons: [
            { label: cancelText, value: false, variant: 'ghost' },
            { label: okText, value: true, variant: danger ? 'danger' : 'primary', primary: true },
        ],
    });
}

function appPrompt(message, { title = '', okText = 'OK', cancelText = 'Cancel', value = '', placeholder = '' } = {}) {
    return appDialog({
        title, message, cancelValue: null,
        input: { value, placeholder },
        buttons: [
            { label: cancelText, value: null, variant: 'ghost' },
            { label: okText, variant: 'primary', primary: true },
        ],
    });
}
