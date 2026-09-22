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
// ⚠️ TITLES FROM THE DESIGN. They read like guides Frappe would publish about
// working with partners, and they are placeholders until somebody points them
// at real posts.

// The two cards at the top of the section.
export const GUIDE_CARDS = [
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

// The one below them, with the wide image and a standfirst.
export const FEATURED_GUIDE = {
  title: 'How to choose and work with a Frappe Partner effectively',
  body: 'Implementations are rarely successful because of software alone. Here is our advice on finding and working with Partners.',
  tag: 'Guides',
  href: BLOG,
}

// And the rows under it.
//
// ⚠️ `likes` AND `comments` ARE INVENTED, and they are the only invented
// numbers in this file. They are in the design so they are here — but they
// assert engagement nobody measured, which is exactly why the partners page
// dropped the same counts off its success stories. Replace with real figures or
// cut them before this is shown outside the team.
export const GUIDE_ROWS = [
  {
    title: 'How to choose and work with a Frappe Partner effectively',
    body: 'From cricket, swimming, and coaching camps to accounting',
    tag: 'Guides',
    likes: 19,
    comments: 1,
    href: BLOG,
  },
  {
    title: 'What a fixed-scope implementation can and cannot do for you',
    body: 'Where a starter pack stops, and what a change request costs',
    tag: 'Guides',
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
    at: '30 Sep 2026',
    where: 'Online',
    href: 'https://events.frappe.io',
  },
  {
    title: 'Frappe Karavan',
    at: '21 Nov 2026',
    where: 'Cairo, Riyadh, Doha, Dubai',
    href: 'https://events.frappe.io',
  },
]
