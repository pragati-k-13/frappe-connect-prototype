# Frappe Connect — design handoff mock

A running prototype of the **business-side** discovery flow for Frappe Connect: how a
business finds a Frappe implementation partner, from first contact on the marketing
site through to a filtered partner list.

This is a **reference for implementation**, not the implementation. There's no backend,
no auth, and no Frappe app scaffolding — the point is that the interactions, states, and
copy are settled before anyone wires them to real doctypes.

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## The flow

| #   | Route                   | What it is                                                             | Build it?                     |
| --- | ----------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| 1   | `/`                     | `frappe.io/partners` — where a business discovers Connect              | **No** — the real page exists |
| 2   | `/connect`              | Frappe Connect landing: the 3-question qualifier + supporting sections | Yes                           |
| 3   | `/connect/partners`     | The filtered partner list                                              | Yes                           |
| 4   | `/connect/partners/:id` | A partner's profile — **top section only so far**                      | Yes                           |

Screen 1 is a deliberately light stand-in. It's here so the entry point isn't imaginary
— you can see what a business was looking at when they clicked through. It's styled to
read as _website_ rather than _app_ (serif headline, wide measure, no rail).

**"Find a partner" opens Connect in a new tab.** That's why it's a plain anchor with
`target="_blank"`, not a `RouterLink` — Connect is a separate destination, not a section
of the marketing site.

**Live:** <https://pragati-k-13.github.io/frappe-connect-prototype/>

## ⚠️ Most of the content is placeholder data

The thirteen partners are real companies with real logos. Almost everything attached to
them is invented: hourly rates, star ratings, review text and reviewers, partner tiers,
case studies and the clients they name, marketplace apps, vision quotes and their
authors, and several of the profile stats.

Each one is flagged where it lives, in `src/data/`. **Nothing in this repo should be read
as fact about those companies.**

Beyond that:

- **State is in-memory.** A refresh resets the quiz — deliberate, so the flow is easy to
  re-run while reviewing.
- **Counts don't reconcile with the list.** The map and chips show the directory's real
  figures (156 partners); the list is seeded with thirteen representative ones. The map
  and the chips do agree with each other — both read `REGIONS`.
- **Log in works.** "Log in via Frappe Cloud" spins for a moment and signs you in — there's
  no auth behind it, just the state change. Contact and Save open it first when you're
  signed out, and finish what you started once you're in. "Sign up" is inert.
- **Share feedback, "Write a review", "View all", "View" and "Message partner" are inert.**
  They show placement and affordance. "Book a slot" and the estimate modal are the
  exceptions — both work, they just don't submit anywhere.

## Where the reasoning lives

|                                          |                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [DESIGN-NOTES.md](DESIGN-NOTES.md)       | Every screen decision: what it was, what it replaced, what was measured to settle it                    |
| [FRAPPE-UI-NOTES.md](FRAPPE-UI-NOTES.md) | Library traps that aren't specific to Connect — mostly classes that compile to nothing without erroring |

Both were part of this README until it reached fifty minutes of reading on the front page
of the repo.

## Layout

```
src/
  data/           quiz.js (questions), partners.js (partners, packs, stories),
                  logos.js + media.js (convention-based asset resolution)
  stores/         connect.js — answers, filters, and the results getter
  assets/         world-map.svg (frappe-cloud-v2), tiers/ (Frappe Partner Badges),
                  partners/ (drop real logos here),
                  media/ + clients/ (PLACEHOLDER profile art — see scripts/)
  components/     ConnectShell (Sidebar + top bar), DottedWorldMap, PartnerRow,
                  FilterChip, TierIcon, DemoSwitch,
                  MediaGallery + MediaLightbox, ClientStrip, BookSlotDialog
  pages/          FrappeSitePage, ConnectLandingPage, ResultsPage,
                  PartnerProfilePage
scripts/          placeholder-asset generators — delete once real art lands
```

## Not built yet

Scoped out of this pass, in rough order:

1. **The rest of the partner profile.** Everything down to Marketplace contributions is
   built. What's below it isn't, and is deliberately absent rather than stubbed — an
   empty section reads as a bug in review, a missing one reads as "not yet".
2. **Contact / request flow** — what "Contact" and "Message partner" actually open. Both
   are on the profile and inert; they'd go to the in-app messages screen, which doesn't
   exist. Not routed to a stub on purpose, so the gap stays visible.
3. **The signed-in views.** `store.account` and `store.project` are live and the demo
   switcher flips between them; what's missing is the screens behind them. The estimate
   modal is meant to be gated on `store.hasProject` and currently isn't.
4. **The partner-side views.** The switcher is built and `store.role` is the seam — the
   screens behind it are not.
5. **Implementation tracking** — progress and goalposts, the collaboration half of the
   product.
