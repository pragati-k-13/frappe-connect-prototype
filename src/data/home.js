// What the signed-in home screen shows besides the projects: where to read,
// what Frappe has written lately, and where it will be.
//
// ⚠️ ALL OF IT IS REAL, read off frappe.io on 22 September 2026. Nothing here
// is invented, which is the opposite of most seed data in this prototype — and
// it is deliberate, because these three blocks exist to prove the home screen
// is worth opening. A dashboard whose "latest from Frappe" is three made-up
// headlines demonstrates a layout, not a reason to come back.
//
// ⚠️ IT WILL GO STALE, and that is the trade. Titles and dates are pasted, not
// fetched — a prototype with no server cannot fetch — so treat every date below
// as an assertion about one afternoon. A real build reads the same three
// sources over their feeds.

// ── Resources ───────────────────────────────────────────────────────────────
// ⚠️ NOT `frappe.io/handbook`, AND THE PROJECT RAIL STILL POINTS THERE. That
// page is Frappe's INTERNAL employee handbook — open day, internal forum,
// workstation security, "email the team!" — and the project page's Help block
// offers it to customers under "Frappe handbook". It is the wrong document for
// somebody running an implementation, which is what the docs below are for.
// See the note at the foot of this file.
export const RESOURCES = [
  {
    title: 'ERPNext documentation',
    body: 'Every module, as the people who build it describe it.',
    href: 'https://docs.frappe.io/erpnext',
  },
  {
    title: 'Frappe Cloud documentation',
    body: 'Sites, billing and the partner code your hosting runs on.',
    href: 'https://docs.frappe.io/cloud',
  },
]

// ── Blog ────────────────────────────────────────────────────────────────────
// The six most recent posts on frappe.io/blog; the home screen shows three.
// ⚠️ `href` follows the site's own `/blog/{category}/{slug}` pattern. The
// category is part of the path, so it cannot be dropped from the record even
// though nothing renders it.
export const POSTS = [
  {
    title: "It's not (just) about you",
    author: 'Rushabh Mehta',
    at: '22 Sep 2026',
    href: 'https://frappe.io/blog/culture/its-not-just-about-you',
  },
  {
    title: 'Conversations make the ecosystem',
    author: 'Foram Shah',
    at: '15 Sep 2026',
    href: 'https://frappe.io/blog/community-stories/conversations-make-the-ecosystem',
  },
  {
    title: 'Half a billion ledger entries',
    author: 'Ruthra Kumar',
    at: '3 Sep 2026',
    href: 'https://frappe.io/blog/engineering/half-a-billion-ledger-entries',
  },
]

// ── Events ──────────────────────────────────────────────────────────────────
// ⚠️ TWO, AND THAT IS THE HONEST NUMBER. events.frappe.io lists four Frappe
// Yatra dates prominently, and every one of them — Delhi, Pune, Bengaluru,
// Coimbatore — is in May and June 2026, which is to say months PAST. Putting
// them under "Upcoming" because there is room for four cards would be the
// screen inventing a future out of a layout. These two are the only entries
// dated after today.
export const EVENTS = [
  {
    title: 'Frappe Partnership',
    body: 'Webinar · 3:00 PM',
    at: '30 Sep 2026',
    where: 'Online',
    href: 'https://events.frappe.io',
  },
  {
    title: 'Frappe Karavan',
    body: 'Conference',
    at: '21 Nov 2026',
    where: 'Cairo, Riyadh, Doha, Dubai',
    href: 'https://events.frappe.io',
  },
]

// ⚠️ EVENT LINKS GO TO THE INDEX, not to `events.frappe.io/events/{slug}`. The
// slug pattern is real and the slugs are a guess, and a card that looks like a
// deep link and 404s is worse than one that lands on the listing with the event
// on it.
