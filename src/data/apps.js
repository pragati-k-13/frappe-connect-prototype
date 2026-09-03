// The app marks that identify a row in the "Estimate quote" table.
//
// The table lists modules from several apps in one flat list, so each row needs
// to say which app it belongs to without spending a column on the word. A mark
// does that in 16px; the app's name is on the mark's tooltip and in its `alt`.
//
// Resolved by convention, like the partner logos in `logos.js`: drop
// `src/assets/apps/<value>.png` and it appears. The four apps the module
// catalogue covers already have theirs, taken from frappe.io/products — see the
// README in that folder for the files and their sources.
//
// An app with no file renders as `Avatar`'s own fallback (its initial on a
// surface). There is deliberately no colour table here: approximating brand
// colours for apps whose artwork simply isn't in the repo invents a second
// visual language for the same thing.

const files = import.meta.glob('../assets/apps/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const APP_LOGOS = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path
      .split('/')
      .pop()
      .replace(/\.[^.]+$/, ''),
    url,
  ]),
)

export const appLogo = (value) => APP_LOGOS[value] ?? null
