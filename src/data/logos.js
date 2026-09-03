// Partner logos, resolved by convention rather than by a hand-kept table.
//
// Drop a file into `src/assets/partners/` named after the partner's id (the
// slug `P()` derives from the name — e.g. `8848-digital.svg`) and the row picks
// it up on the next build. No import to write, no data field to update.
//
// Anything without a file falls back to the initials tile in `PartnerRow`, so a
// partly-filled folder renders fine.
const files = import.meta.glob('../assets/partners/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const LOGOS = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split('/').pop().replace(/\.[^.]+$/, ''),
    url,
  ]),
)

export const logoFor = (id) => LOGOS[id] ?? null
