// Partner logos, resolved by convention rather than by a hand-kept table.
//
// Drop a file into `src/assets/partners/` named after the partner's id (the
// slug `P()` derives from the name — e.g. `8848-digital.svg`) and the row picks
// it up on the next build. No import to write, no data field to update.
//
// Anything without a file falls back to the initials tile in `PartnerRow`, so a
// partly-filled folder renders fine.
import frappeMark from '../assets/frappe.svg'

const files = import.meta.glob('../assets/partners/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

// ⚠️ PLUS FRAPPE, by hand. A Starter Pack is implemented by Frappe's own team
// (`FRAPPE_TEAM` in `data/partners.js`), and its thread and project resolve a
// logo by id like any partner's. Not a file in `partners/`: Frappe is not in
// the directory.
export const LOGOS = {
  ...Object.fromEntries(
    Object.entries(files).map(([path, url]) => [
      path.split('/').pop().replace(/\.[^.]+$/, ''),
      url,
    ]),
  ),
  frappe: frappeMark,
}

export const logoFor = (id) => LOGOS[id] ?? null
