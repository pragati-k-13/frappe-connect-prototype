// What the signed-in home screen shows besides the projects and the partner
// list: guides to read, and where Frappe will be.
//
// ⚠️ THE EVENTS ARE REAL, read off events.frappe.io on 22 September 2026. The
// guides are NOT — their titles come from the design, and none of them exists
// at a URL that could be checked. That split is the whole honesty story of this
// file, and it is marked at each list rather than left to be inferred.
//
// ⚠️ IT WILL GO STALE. Titles and dates are pasted, not fetched — a prototype
// with no server cannot fetch — so treat every date below as an assertion about
// one afternoon. A real build reads these over their feeds.

// Everything here links to the blog index rather than to an invented slug. A
// card that looks like a deep link and 404s is worse than one that lands
// somewhere real.
const BLOG = 'https://frappe.io/blog'

// ── Resources ───────────────────────────────────────────────────────────────
// Guides about working with partners: the two image cards.
//
// ⚠️ PLACEHOLDER TITLES. They read like guides Frappe would publish, and none
// of them exists yet.
export const RESOURCES = [
  {
    title: 'Your guide to finding and hiring the perfect Partner for your company',
    at: '23 Aug 2026',
    href: BLOG,
  },
  {
    title: 'How to work effectively with Partners to get your app implementation just right',
    at: '23 Aug 2026',
    href: BLOG,
  },
]

// ── Blog ────────────────────────────────────────────────────────────────────
// The first post is the featured one (wide image, standfirst); the rest are
// the rows under it.
//
// ⚠️ PLACEHOLDER TITLES, as above. `likes` AND `comments` ARE INVENTED — they
// assert engagement nobody measured, which is why the partners page dropped the
// same counts off its success stories. Replace with real figures or cut them
// before this is shown outside the team.
export const POSTS = [
  {
    title: 'What a fixed-scope implementation can and cannot do for you',
    body: 'Where a Starter Pack stops, what a change request costs, and how to tell which one your project needs before you book.',
    tag: 'Starter Packs',
    likes: 24,
    comments: 3,
    href: BLOG,
  },
  {
    title: 'Off spreadsheets in 90 days: a manufacturer’s first quarter on ERPNext',
    body: 'Stock, job cards and the month-end close, one at a time',
    tag: 'Customer stories',
    likes: 41,
    comments: 6,
    href: BLOG,
  },
  {
    title: 'Why we started certifying Frappe Partners',
    body: 'What the Gold badge means, and what it takes to earn one',
    tag: 'Partners',
    likes: 19,
    comments: 1,
    href: BLOG,
  },
]

// ── Events ──────────────────────────────────────────────────────────────────
// ⚠️ TWO, AND THAT IS THE HONEST NUMBER. events.frappe.io lists four Frappe
// Yatra dates prominently, and every one of them — Delhi, Pune, Bengaluru,
// Coimbatore — is in May and June 2026, which is to say months PAST. Putting
// them under "Upcoming" because the design has room for more cards would be the
// screen inventing a future out of a layout. These two are the only entries
// dated after today.
//
// ⚠️ THEY LINK TO THE INDEX, not to `events.frappe.io/events/{slug}`. The slug
// pattern is real and the slugs would be a guess.
export const EVENTS = [
  {
    title: 'Frappe Partnership',
    date: '2026-09-30',
    // The time is as listed. ⚠️ THE ZONE IS ASSUMED: the page gives none, and
    // Frappe is in India, so IST.
    time: '3:00 PM IST',
    where: 'Online',
    href: 'https://events.frappe.io',
  },
  {
    title: 'Frappe Karavan',
    date: '2026-11-21',
    // ⚠️ INVENTED TIME. events.frappe.io lists no time for any stop (Cairo
    // 21, Riyadh 24, Doha 26, Dubai 28 Nov); this is a placeholder for the
    // first one, in Cairo's zone (EET, UTC+2 in November). Replace it once
    // the schedule is published.
    time: '10:00 AM EET',
    where: 'Cairo, Riyadh, Doha, Dubai',
    href: 'https://events.frappe.io',
  },
]
