// Help-modal nav icons. Kept in a dependency-free leaf module so the
// per-trainer help-section tables (oblHelpSections / pblHelpSections) can read
// them at module-eval time without depending on app.js's initialization order.

export const HELP_HOME_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.25 3.75V5.43953L18.25 7.03953V3.75H16.25ZM19.75 8.23953V3.5C19.75 2.80964 19.1904 2.25 18.5 2.25H16C15.3097 2.25 14.75 2.80964 14.75 3.5V4.23953L14.3426 3.91362C12.9731 2.81796 11.027 2.81796 9.65742 3.91362L1.53151 10.4143C1.20806 10.6731 1.15562 11.1451 1.41438 11.4685C1.67313 11.792 2.1451 11.8444 2.46855 11.5857L3.25003 10.9605V21.25H2.00003C1.58581 21.25 1.25003 21.5858 1.25003 22C1.25003 22.4142 1.58581 22.75 2.00003 22.75H22C22.4142 22.75 22.75 22.4142 22.75 22C22.75 21.5858 22.4142 21.25 22 21.25H20.75V10.9605L21.5315 11.5857C21.855 11.8444 22.3269 11.792 22.5857 11.4685C22.8444 11.1451 22.792 10.6731 22.4685 10.4143L19.75 8.23953ZM19.25 9.76047L13.4056 5.08492C12.5838 4.42753 11.4162 4.42753 10.5945 5.08492L4.75003 9.76047V21.25H8.25003L8.25003 16.9506C8.24999 16.2858 8.24996 15.7129 8.31163 15.2542C8.37773 14.7625 8.52679 14.2913 8.90904 13.909C9.29128 13.5268 9.76255 13.3777 10.2542 13.3116C10.7129 13.2499 11.2858 13.25 11.9507 13.25H12.0494C12.7143 13.25 13.2871 13.2499 13.7459 13.3116C14.2375 13.3777 14.7088 13.5268 15.091 13.909C15.4733 14.2913 15.6223 14.7625 15.6884 15.2542C15.7501 15.7129 15.7501 16.2858 15.75 16.9506L15.75 21.25H19.25V9.76047ZM14.25 21.25V17C14.25 16.2717 14.2484 15.8009 14.2018 15.454C14.1581 15.1287 14.0875 15.0268 14.0304 14.9697C13.9733 14.9126 13.8713 14.842 13.546 14.7982C13.1991 14.7516 12.7283 14.75 12 14.75C11.2717 14.75 10.8009 14.7516 10.4541 14.7982C10.1288 14.842 10.0268 14.9126 9.9697 14.9697C9.9126 15.0268 9.84199 15.1287 9.79826 15.454C9.75162 15.8009 9.75003 16.2717 9.75003 17V21.25H14.25ZM12 8.25C11.3097 8.25 10.75 8.80964 10.75 9.5C10.75 10.1904 11.3097 10.75 12 10.75C12.6904 10.75 13.25 10.1904 13.25 9.5C13.25 8.80964 12.6904 8.25 12 8.25ZM9.25003 9.5C9.25003 7.98122 10.4812 6.75 12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5C14.75 11.0188 13.5188 12.25 12 12.25C10.4812 12.25 9.25003 11.0188 9.25003 9.5Z" fill="currentColor"/>
</svg>`;

export const HELP_CTRL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="13" rx="2"/>
  <line x1="6"  y1="10" x2="6"  y2="10"/>
  <line x1="10" y1="10" x2="10" y2="10"/>
  <line x1="14" y1="10" x2="14" y2="10"/>
  <line x1="18" y1="10" x2="18" y2="10"/>
  <line x1="6"  y1="14" x2="6"  y2="14"/>
  <line x1="18" y1="14" x2="18" y2="14"/>
  <line x1="10" y1="14" x2="14" y2="14"/>
</svg>`;

export const HELP_FILTER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4"/>
</svg>`;

export const HELP_EQ_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="7.41" height="14" rx="1"/>
    <rect x="9.41" y="5" width="12.59" height="14" rx="1"/>
</svg>`;

// Shared tag glyph geometry — used both by the help-nav Tags icon and by the
// inline tag chips (UNIT_TAG_SVG) so the path data lives in exactly one place.
const TAG_PATH = `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/>`;

// Inline tag chip icon (fixed 15px) used throughout the tag UI. Re-exported by
// tag-assignments.js for its existing consumers.
export const UNIT_TAG_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TAG_PATH}</svg>`;

// trash icon for deleting an orphaned tag
export const ORPHAN_TAG_DEL_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6" /></svg>`;

// Search and Data Sync reuse the sidebar rail's <symbol>s (defined in index.html)
// via <use>, so their path data is never duplicated.
export const HELP_SEARCH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><use href="#rail-icon-search"/></svg>`;
export const HELP_SYNC_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><use href="#rail-icon-upload"/></svg>`;

export const HELP_TAG_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${TAG_PATH}</svg>`;

// Lists: three bullets with three lines.
export const HELP_LIST_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="6"  r="1.1" fill="currentColor" stroke="none"/>
    <line x1="8" y1="6"  x2="20" y2="6"/>
    <circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/>
    <line x1="8" y1="12" x2="20" y2="12"/>
    <circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/>
    <line x1="8" y1="18" x2="20" y2="18"/>
</svg>`;

// Learn: a closed book.
export const HELP_LEARN_SVG = `<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M 9 4 C 7.355469 4 6 5.355469 6 7 L 6 25 C 6 26.644531 7.355469 28 9 28 L 26 28 L 26 4 Z M 9 6 L 24 6 L 24 22 L 9 22 C 8.648438 22 8.316406 22.074219 8 22.1875 L 8 7 C 8 6.433594 8.433594 6 9 6 Z M 11 9 L 11 11 L 22 11 L 22 9 Z M 9 24 L 24 24 L 24 26 L 9 26 C 8.433594 26 8 25.566406 8 25 C 8 24.433594 8.433594 24 9 24 Z"/></svg>`;
