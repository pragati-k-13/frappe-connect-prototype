# App marks

The four apps the estimator's module catalogue covers are here as their real
icons, taken from the product cards on <https://frappe.io/products>:

| File | Source |
| --- | --- |
| `erpnext.png` | `frappe.io/files/erpnext53456f.png` |
| `crm.png` | `frappe.io/files/crmaff993.png` |
| `frappe-hr.png` | `frappe.io/files/hrbde4d8.png` |
| `helpdesk.png` | `frappe.io/files/helpdesk8109cf.png` |

Each is ~160x157 RGBA PNG, 2-3 KB, and carries its own rounded-square shape on
transparency — so they render whole with `object-contain` in a square box, at
whatever size the mark is drawn.

To add another app, drop a file named after its `APPS[].value` and `data/apps.js`
picks it up on the next build. No import to write, no data field to update. Same
convention as `assets/partners/`. Until a file exists the app renders as the
coloured initial tile in `data/apps.js`.

Marks are drawn at 20px in the estimate table, so they want to be square and
legible small — the app icon, not the horizontal lockup.
